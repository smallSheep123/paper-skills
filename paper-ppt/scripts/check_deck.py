"""Check exported PPTX geometry and data. Does not judge text fit or design."""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
from io import BytesIO
import json
import math
from pathlib import Path
import posixpath
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

from PIL import Image

NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'c': 'http://schemas.openxmlformats.org/drawingml/2006/chart',
      'm': 'http://schemas.openxmlformats.org/officeDocument/2006/math',
      'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
      'asvg': 'http://schemas.microsoft.com/office/drawing/2016/SVG/main',
      's': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def relationships(z: zipfile.ZipFile, part: str) -> dict[str, str]:
    folder, name = posixpath.split(part)
    rel = posixpath.join(folder, '_rels', name + '.rels')
    if rel not in z.namelist():
        return {}
    return {e.get('Id'): posixpath.normpath(posixpath.join(folder, e.get('Target', ''))).lstrip('/')
            for e in ET.fromstring(z.read(rel)) if e.get('TargetMode') != 'External'}


def image_ratio(data: bytes) -> float:
    try:
        with Image.open(BytesIO(data)) as im:
            return im.width / im.height
    except OSError:
        root = ET.fromstring(data)
        view = root.get('viewBox', '').replace(',', ' ').split()
        if len(view) == 4:
            return float(view[2]) / float(view[3])
        w, h = root.get('width', ''), root.get('height', '')
        return float(w.removesuffix('px')) / float(h.removesuffix('px'))


def workbook_cells(data: bytes) -> dict[str, dict[str, str]]:
    """Read cached scalar XLSX cells without evaluating formulas or loading Excel."""
    with zipfile.ZipFile(BytesIO(data)) as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            strings = [''.join(e.itertext()) for e in
                       ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si', NS)]
        rels = relationships(z, 'xl/workbook.xml')
        result = {}
        for sheet in ET.fromstring(z.read('xl/workbook.xml')).findall('s:sheets/s:sheet', NS):
            part = rels[sheet.get(f"{{{NS['r']}}}id")]
            cells = {}
            for cell in ET.fromstring(z.read(part)).findall('.//s:sheetData/s:row/s:c', NS):
                value = cell.findtext('s:v', default='', namespaces=NS)
                if cell.get('t') == 's':
                    value = strings[int(value)]
                elif cell.get('t') == 'inlineStr':
                    value = ''.join(cell.find('s:is', NS).itertext())
                cells[cell.get('r')] = value
            result[sheet.get('name')] = cells
        return result


def referenced_cells(formula: str, sheets: dict) -> list[str]:
    match = re.fullmatch(r"(?:'([^']+)'|([^!]+))!\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?", formula)
    if not match:
        raise ValueError(f'Unsupported chart reference: {formula}')
    quoted, plain, col, start, end_col, end = match.groups()
    if end_col and col != end_col:
        raise ValueError(f'Chart reference is not a single column: {formula}')
    cells = sheets[quoted or plain]
    return [cells.get(f'{col}{n}', '') for n in range(int(start), int(end or start) + 1)]


def same_value(a: str, b: str, numeric: bool) -> bool:
    if not numeric:
        return a == b
    if not a or not b:
        return a == b
    try:
        return math.isclose(float(a), float(b), rel_tol=1e-9, abs_tol=1e-9)
    except ValueError:
        return False


def audit(file: Path) -> dict:
    report = {'file': str(file.resolve()), 'sha256': hashlib.sha256(file.read_bytes()).hexdigest(),
              'slides': 0, 'pictures': 0, 'native_charts': 0, 'native_tables': 0,
              'checked_chart_references': 0, 'native_equations': 0,
              'math_sources': 0, 'fonts': {}, 'errors': [], 'warnings': []}
    errors, warnings, fonts = report['errors'], report['warnings'], Counter()
    with zipfile.ZipFile(file) as z:
        if z.testzip():
            errors.append('ZIP member integrity failure')
        pres = ET.fromstring(z.read('ppt/presentation.xml'))
        size = pres.find('p:sldSz', NS)
        sw, sh = int(size.get('cx')), int(size.get('cy'))
        parts = sorted((p for p in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', p)),
                       key=lambda p: int(re.search(r'(\d+)\.xml$', p).group(1)))
        report['slides'] = len(parts)
        for number, part in enumerate(parts, 1):
            root, rels = ET.fromstring(z.read(part)), relationships(z, part)
            label = f'Slide {number}'
            for run in root.findall('.//a:latin', NS):
                fonts[run.get('typeface', '')] += 1
            for para in root.findall('.//a:p', NS):
                if len(para.findall('a:pPr', NS)) > 1:
                    errors.append(f'{label}: duplicate paragraph properties')
            tree = root.find('p:cSld/p:spTree', NS)
            shapes = []
            for item in tree:
                if item.tag == f"{{{NS['mc']}}}AlternateContent":
                    branches = item.findall('mc:Choice', NS) + item.findall('mc:Fallback', NS)
                    shapes.extend(child for branch in branches for child in branch)
                    if item.find('.//m:oMath', NS) is not None:
                        report['native_equations'] += 1
                        if item.find('mc:Fallback', NS) is None:
                            errors.append(f'{label}: native equation has no image fallback')
                        if any(e.tag.startswith('{http://schemas.openxmlformats.org/wordprocessingml/') for e in item.iter()):
                            errors.append(f'{label}: WordprocessingML found in DrawingML math')
                else:
                    shapes.append(item)
            source_ids = set()
            for index, shape in enumerate(shapes, 1):
                nv = shape.find('.//p:cNvPr', NS)
                if nv is not None and nv.get('descr', '').startswith('paper-ppt-math:'):
                    try:
                        source = json.loads(nv.get('descr')[len('paper-ppt-math:'):])
                        size = float(source['fontSize'])
                        if not source['latex'].strip() or not math.isfinite(size) or size <= 0:
                            raise ValueError('empty source or invalid base size')
                        source_ids.add(nv.get('id'))
                    except (ValueError, KeyError, TypeError) as exc:
                        errors.append(f'{label}: invalid preserved math source ({exc})')
                if shape.tag == f"{{{NS['p']}}}grpSp":
                    warnings.append(f'{label}: grouped geometry needs visual review')
                    continue
                xfrm = shape.find('.//a:xfrm', NS)
                ext = None
                if xfrm is None:
                    xfrm = shape.find('p:xfrm', NS)
                if xfrm is not None:
                    off, ext = xfrm.find('a:off', NS), xfrm.find('a:ext', NS)
                    if off is not None and ext is not None:
                        x, y = int(off.get('x')), int(off.get('y'))
                        w, h = int(ext.get('cx')), int(ext.get('cy'))
                        tolerance = 1000  # ~0.001 in; tolerate integer rounding only.
                        if x < -tolerance or y < -tolerance or x+w > sw+tolerance or y+h > sh+tolerance:
                            # Decorative shapes may intentionally bleed off the canvas.
                            decoration = (shape.tag == f"{{{NS['p']}}}sp" and
                                          not shape.findall('.//a:t', NS) and
                                          shape.find('.//a:blip', NS) is None)
                            if decoration:
                                warnings.append(f'{label}, object {index}: decorative shape outside slide bounds; visually confirm intentional bleed')
                            else:
                                errors.append(f'{label}, object {index}: outside slide bounds')
                if shape.find('.//a:blip', NS) is not None:
                    report['pictures'] += 1
                    blip = shape.find('.//a:blip', NS)
                    svg = blip.find('.//asvg:svgBlip', NS)
                    image = svg if svg is not None else blip
                    target = rels.get(image.get(f"{{{NS['r']}}}embed"))
                    try:
                        ratio = image_ratio(z.read(target))
                        crop = shape.find('.//a:srcRect', NS)
                        if crop is not None:
                            ratio *= (1-(int(crop.get('l', 0))+int(crop.get('r', 0)))/100000) / (1-(int(crop.get('t', 0))+int(crop.get('b', 0)))/100000)
                        actual = int(ext.get('cx')) / int(ext.get('cy'))
                        if abs(actual/ratio-1) > .01:
                            errors.append(f'{label}: picture aspect ratio changed by {actual/ratio:.3f}x')
                    except (OSError, ValueError, KeyError, TypeError, ZeroDivisionError, ET.ParseError) as exc:
                        warnings.append(f'{label}: picture ratio not checked ({exc})')
                report['native_tables'] += len(shape.findall('.//a:tbl', NS))
                for chart in shape.findall('.//c:chart', NS):
                    report['native_charts'] += 1
                    chart_part = rels[chart.get(f"{{{NS['r']}}}id")]
                    chart_root = ET.fromstring(z.read(chart_part))
                    external = chart_root.find('c:externalData', NS)
                    if external is None:
                        warnings.append(f'{label}: chart has no embedded workbook; caches not verified')
                        continue
                    try:
                        wb_part = relationships(z, chart_part)[external.get(f"{{{NS['r']}}}id")]
                        sheets = workbook_cells(z.read(wb_part))
                        refs = chart_root.findall('.//c:numRef', NS) + chart_root.findall('.//c:strRef', NS)
                        for ref in refs:
                            formula = ref.findtext('c:f', namespaces=NS)
                            values = referenced_cells(formula, sheets)
                            numeric = ref.tag.endswith('numRef')
                            cache = ref.find('c:numCache' if numeric else 'c:strCache', NS)
                            if cache is None:
                                errors.append(f'{label}: missing chart cache for {formula}')
                                continue
                            cached = {int(pt.get('idx')): pt.findtext('c:v', default='', namespaces=NS)
                                      for pt in cache.findall('c:pt', NS)}
                            count = cache.find('c:ptCount', NS)
                            if count is None or int(count.get('val')) != len(values) or any(
                                    not same_value(cached.get(i, ''), value, numeric) for i, value in enumerate(values)):
                                errors.append(f'{label}: chart cache/workbook mismatch: {formula}')
                            report['checked_chart_references'] += 1
                    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as exc:
                        errors.append(f'{label}: embedded chart data verification failed ({exc})')
            report['math_sources'] += len(source_ids)
            notes = [target for target in rels.values() if '/notesSlides/notesSlide' in target]
            body = []
            for note in notes:
                nr = ET.fromstring(z.read(note))
                for sp in nr.findall('.//p:sp', NS):
                    ph = sp.find('p:nvSpPr/p:nvPr/p:ph', NS)
                    if ph is not None and ph.get('type') == 'body':
                        body += [e.text or '' for e in sp.findall('.//a:t', NS)]
            if not ''.join(body).strip():
                errors.append(f'{label}: missing speaker notes')
    report['fonts'] = dict(fonts)
    report['status'] = 'fail' if errors else 'pass'
    report['notice'] = 'Structural checks only. Review every rendered slide for facts, text fit and design.'
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('deck', type=Path)
    parser.add_argument('--out', type=Path)
    args = parser.parse_args()
    result = audit(args.deck)
    rendered = json.dumps(result, ensure_ascii=False, indent=2)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(rendered + '\n', encoding='utf-8')
    print(rendered)
    return int(bool(result['errors']))


if __name__ == '__main__':
    sys.exit(main())
