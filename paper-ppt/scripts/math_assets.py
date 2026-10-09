"""Render math snippets, preserve their source, and embed SVG / DrawingML OMML.

This is a math-snippet tool, not a general TeX document compiler. Native output
is deliberately conservative; unsupported layouts stay as vector artwork.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
from io import BytesIO
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile

NS = {
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'm': 'http://schemas.openxmlformats.org/officeDocument/2006/math',
    'a14': 'http://schemas.microsoft.com/office/drawing/2010/main',
    'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    'asvg': 'http://schemas.microsoft.com/office/drawing/2016/SVG/main',
}
for prefix, uri in NS.items():
    ET.register_namespace(prefix, uri)
REL = 'http://schemas.openxmlformats.org/package/2006/relationships'
CT = 'http://schemas.openxmlformats.org/package/2006/content-types'
MARKER = 'paper-ppt-math:'


def q(prefix, name):
    return f'{{{NS[prefix]}}}{name}'


def digest(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def validate_latex(source):
    if not isinstance(source, str) or not source.strip() or len(source) > 12000:
        raise ValueError('Expected a nonempty LaTeX math snippet (max 12000 characters)')
    # A snippet must not introduce a document, local file reads or TeX I/O.
    forbidden = re.search(r'\\(?:input|include|openin|openout|read|write|immediate|catcode|csname|usepackage|documentclass|newcommand|def|special|href|url)(?![A-Za-z])', source)
    if forbidden or '$' in source or re.search(r'\\(?:begin|end)\s*\{document\}', source):
        raise ValueError('Supply math only, without dollar delimiters, file I/O or document commands')


def native_math(source, font_size, color):
    """Convert a vetted simple subset. No silent flattening of complex TeX."""
    # These layouts need independent native-app validation before enabling.
    if re.search(r'\\(?:begin|end|left|right|limits|nolimits|overset|underset|overbrace|underbrace|substack|textcolor|color)\b', source):
        return None, 'Complex layout uses the vector renderer'
    try:
        import latex2mathml.converter
        import mathml2omml
    except ImportError:
        return None, 'Optional native conversion dependencies are unavailable'
    try:
        mml = latex2mathml.converter.convert(source, display='block')
        tree = ET.fromstring(mml)
        allowed = {'math', 'mrow', 'mi', 'mn', 'mo', 'mtext', 'mfrac',
                   'msqrt', 'mroot', 'msub', 'msup', 'msubsup'}
        # Attributes such as mathvariant, stretchy, spacing, or style directives
        # may be dropped by the converter; use SVG instead of guessing.
        for node in tree.iter():
            if node.tag.rsplit('}', 1)[-1] not in allowed:
                return None, 'MathML structure is outside the tested native subset'
            if any(k not in {'display'} and not (k == 'stretchy' and v == 'false') for k, v in node.attrib.items()):
                return None, 'MathML styling is outside the tested native subset'
            if '\\' in (node.text or ''):
                return None, 'Unconverted LaTeX command'
        raw = mathml2omml.convert(mml)
        omml = ET.fromstring(f'<root xmlns:m="{NS["m"]}">{raw}</root>')[0]
        for node in omml.iter():
            if node.tag.startswith('{http://schemas.openxmlformats.org/wordprocessingml/'):
                raise ValueError('WordprocessingML is not valid in DrawingML math')
        for run in omml.iter(q('m', 'r')):
            props = ET.Element(q('a', 'rPr'), {'sz': str(round(font_size * 100))})
            fill = ET.SubElement(props, q('a', 'solidFill'))
            ET.SubElement(fill, q('a', 'srgbClr'), {'val': color})
            ET.SubElement(props, q('a', 'latin'), {'typeface': 'Cambria Math'})
            ET.SubElement(props, q('a', 'ea'), {'typeface': 'Cambria Math'})
            run.insert(1 if len(run) and run[0].tag == q('m', 'rPr') else 0, props)
        # Omit the radical degree explicitly for square roots.
        for rad in omml.iter(q('m', 'rad')):
            if rad.find(q('m', 'deg')) is None:
                pr = ET.Element(q('m', 'radPr'))
                ET.SubElement(pr, q('m', 'degHide'), {q('m', 'val'): '1'})
                rad.insert(0, pr)
                rad.insert(1, ET.Element(q('m', 'deg')))
        return ET.tostring(omml, encoding='unicode'), None
    except (ValueError, ET.ParseError, NotImplementedError, KeyError, IndexError) as exc:
        return None, f'Native conversion unavailable: {type(exc).__name__}: {exc}'


def tool(name):
    found = shutil.which(name)
    if not found:
        raise RuntimeError(f'Missing {name}; see references/math-equations.md')
    return found


def run(args, cwd):
    env = dict(os.environ, openin_any='p', openout_any='p')
    result = subprocess.run(args, cwd=cwd, env=env, capture_output=True, timeout=60)
    if result.returncode:
        log = (result.stdout + result.stderr).decode('utf-8', errors='replace')
        raise RuntimeError(f'{Path(args[0]).name} failed:\n{log[-4000:]}')


def prepare(request, out):
    import pymupdf as fitz  # Identical vector and raster metrics.
    specs = json.loads(Path(request).read_text(encoding='utf-8'))
    if not isinstance(specs, list) or not specs:
        raise ValueError('Request must be a nonempty array of math specifications')
    assets = Path(out).resolve().parent / (Path(out).stem + '-assets')
    assets.mkdir(parents=True, exist_ok=True)
    seen, result = set(), {}
    for spec in specs:
        ident, source = spec['id'], spec['latex']
        if not re.fullmatch(r'[A-Za-z0-9_-]+', ident) or ident in seen:
            raise ValueError(f'Invalid or duplicate math id: {ident}')
        seen.add(ident)
        validate_latex(source)
        size, color = float(spec['fontSize']), spec.get('color', '111111')
        mode = spec.get('mode', 'auto')
        # border in bp around the snippet; use 0 for the pieces of a split equation so they butt together
        border = float(spec.get('border', 2))
        if not math.isfinite(border) or border < 0 or border > 20:
            raise ValueError('Math border must be between 0 and 20 bp')
        if not math.isfinite(size) or size <= 0 or not re.fullmatch(r'[A-Fa-f0-9]{6}', color) or mode not in {'auto', 'svg', 'native'}:
            raise ValueError('Math fontSize must be a positive finite point size; also check color and mode')
        with tempfile.TemporaryDirectory(prefix='paper-math-') as tmp:
            cwd = Path(tmp)
            tex = '\n'.join([
                f'\\documentclass[border={border:g}bp]{{standalone}}',
                # exscale: big operators and \Big delimiters scale with \fontsize (lmodern alone keeps them at 10 pt)
                r'\usepackage{amsmath,amssymb,bm,xcolor,lmodern,exscale}',
                r'\begin{document}',
                f'\\fontsize{{{size}bp}}{{{size * 1.25}bp}}\\selectfont\\color[HTML]{{{color}}}',
                r'$\displaystyle ' + source + '$', r'\end{document}',
            ])
            (cwd / 'equation.tex').write_text(tex, encoding='utf-8')
            run([tool('pdflatex'), '-no-shell-escape', '-halt-on-error', '-interaction=nonstopmode', 'equation.tex'], cwd)
            # Both outputs come from the same PDF page. Independent DVI/SVG and
            # PDF/raster crops have different borders and distort the fallback.
            with fitz.open(cwd / 'equation.pdf') as pdf:
                if len(pdf) != 1:
                    raise ValueError('A math snippet must produce exactly one PDF page')
                page = pdf[0]
                (cwd / 'equation.svg').write_text(page.get_svg_image(text_as_path=True), encoding='utf-8')
                page.get_pixmap(matrix=fitz.Matrix(4, 4), alpha=True).save(cwd / 'equation.png')
                width, height = page.rect.width / 72, page.rect.height / 72
            for ext in ('svg', 'png', 'pdf', 'tex'):
                shutil.copyfile(cwd / f'equation.{ext}', assets / f'{ident}.{ext}')
        omml, reason = native_math(source, size, color) if mode != 'svg' else (None, 'Vector mode requested')
        if mode == 'native' and not omml:
            raise ValueError(f'{ident}: native mode requested but {reason}')
        result[ident] = {
            'id': ident, 'latex': source, 'fontSize': size, 'color': color,
            'widthIn': width, 'heightIn': height,
            'svg': str(assets / f'{ident}.svg'), 'png': str(assets / f'{ident}.png'),
            'svgSha256': digest(assets / f'{ident}.svg'), 'pngSha256': digest(assets / f'{ident}.png'),
            'representation': 'native' if omml else 'svg', 'omml': omml,
            'fallbackReason': reason,
        }
    Path(out).write_text(json.dumps({'schema': 1, 'equations': result}, ensure_ascii=False, indent=2), encoding='utf-8')
    return result


def native_shape(pic, asset, placement):
    shape = ET.Element(q('p', 'sp'))
    nv = ET.SubElement(shape, q('p', 'nvSpPr'))
    nv.append(copy.deepcopy(pic.find('p:nvPicPr/p:cNvPr', NS)))
    ET.SubElement(nv, q('p', 'cNvSpPr'), {'txBox': '1'})
    ET.SubElement(nv, q('p', 'nvPr'))
    props = ET.SubElement(shape, q('p', 'spPr'))
    xf = ET.SubElement(props, q('a', 'xfrm'))
    box = placement['nativeBox']
    ET.SubElement(xf, q('a', 'off'), {'x': str(round(box['x'] * 914400)), 'y': str(round(box['y'] * 914400))})
    ET.SubElement(xf, q('a', 'ext'), {'cx': str(round(box['w'] * 914400)), 'cy': str(round(box['h'] * 914400))})
    geom = ET.SubElement(props, q('a', 'prstGeom'), {'prst': 'rect'})
    ET.SubElement(geom, q('a', 'avLst'))
    ET.SubElement(props, q('a', 'noFill'))
    ET.SubElement(ET.SubElement(props, q('a', 'ln')), q('a', 'noFill'))
    body = ET.SubElement(shape, q('p', 'txBody'))
    bp = ET.SubElement(body, q('a', 'bodyPr'), {'wrap': 'none', 'lIns': '0', 'rIns': '0', 'tIns': '0', 'bIns': '0', 'anchor': 'ctr'})
    ET.SubElement(bp, q('a', 'noAutofit'))
    ET.SubElement(body, q('a', 'lstStyle'))
    para = ET.SubElement(body, q('a', 'p'))
    ET.SubElement(para, q('a', 'pPr'), {'algn': {'center': 'ctr', 'left': 'l', 'right': 'r'}[placement.get('align', 'center')]})
    wrap = ET.SubElement(para, q('a14', 'm'))
    mp = ET.SubElement(wrap, q('m', 'oMathPara'))
    mpr = ET.SubElement(mp, q('m', 'oMathParaPr'))
    ET.SubElement(mpr, q('m', 'jc'), {q('m', 'val'): placement.get('align', 'center')})
    mp.append(ET.fromstring(asset['omml']))
    ET.SubElement(para, q('a', 'endParaRPr'), {'sz': str(round(asset['fontSize'] * 100))})
    return shape


def vector_shape(pic):
    """Use the legacy image-filled shape specified by MS-ODRAWXML math."""
    shape = ET.Element(q('p', 'sp'))
    nv = ET.SubElement(shape, q('p', 'nvSpPr'))
    nv.append(copy.deepcopy(pic.find('p:nvPicPr/p:cNvPr', NS)))
    ET.SubElement(nv, q('p', 'cNvSpPr'))
    ET.SubElement(nv, q('p', 'nvPr'))
    props = copy.deepcopy(pic.find('p:spPr', NS))
    fill = copy.deepcopy(pic.find('p:blipFill', NS))
    fill.tag = q('a', 'blipFill')
    props.insert(2, fill)
    shape.append(props)
    return shape


def replace_math_pictures(original, replacements):
    """Preserve all other slide XML, including prefix-valued MC attributes.

    Reserializing a whole slide can discard an xmlns declaration referenced
    only by mc:Choice/@Requires or mc:Ignorable. Patch our authored pictures.
    """
    namespaces = {}
    for _, pair in ET.iterparse(BytesIO(original), events=['start-ns']):
        namespaces[pair[0]] = pair[1]
    declarations = ' '.join(f'xmlns{":" + prefix if prefix else ""}="{uri}"' for prefix, uri in namespaces.items())
    used = set()

    def replace(match):
        wrapper = f'<root {declarations}>'.encode() + match.group(0) + b'</root>'
        pic = ET.fromstring(wrapper)[0]
        nv = pic.find('p:nvPicPr/p:cNvPr', NS)
        ident = nv.get('id') if nv is not None else None
        if ident in replacements:
            used.add(ident)
            return replacements[ident]
        return match.group(0)

    result = re.sub(rb'<(?:[A-Za-z_][\w.-]*:)?pic\b[^>]*>.*?</(?:[A-Za-z_][\w.-]*:)?pic\s*>', replace, original, flags=re.DOTALL)
    if used != set(replacements):
        raise ValueError('Could not locate the authored math picture in slide XML')
    return result


def finalize(source, manifest, out):
    source, out = Path(source).resolve(), Path(out).resolve()
    if source == out or out.exists():
        raise ValueError('Final output must be a new file, different from the source')
    data = json.loads(Path(manifest).read_text(encoding='utf-8'))['equations']
    changes, count = {}, {'native': 0, 'svg': 0}
    with zipfile.ZipFile(source) as z:
        types = ET.fromstring(z.read('[Content_Types].xml'))
        if not any(n.get('Extension') == 'svg' for n in types):
            ET.SubElement(types, f'{{{CT}}}Default', {'Extension': 'svg', 'ContentType': 'image/svg+xml'})
        for part in z.namelist():
            if not re.fullmatch(r'ppt/slides/slide\d+\.xml', part):
                continue
            root = ET.fromstring(z.read(part))
            tree = root.find('p:cSld/p:spTree', NS)
            relpart = str(Path(part).parent.as_posix()) + '/_rels/' + Path(part).name + '.rels'
            rels = ET.fromstring(z.read(relpart))
            replacements = {}
            for pic in list(tree):
                if pic.tag != q('p', 'pic'):
                    continue
                nv = pic.find('p:nvPicPr/p:cNvPr', NS)
                descr = nv.get('descr', '')
                if not descr.startswith(MARKER):
                    continue
                placement = json.loads(descr[len(MARKER):])
                asset = data[placement['id']]
                if placement['latex'] != asset['latex'] or placement['fontSize'] != asset['fontSize']:
                    raise ValueError('Math placement and prepared source disagree')
                for ext in ('svg', 'png'):
                    if digest(asset[ext]) != asset[f'{ext}Sha256']:
                        raise ValueError(f'Math asset changed: {asset[ext]}')
                native = asset['representation'] == 'native'
                count[asset['representation']] += 1
                media = f'paper-math-{hashlib.sha256(Path(asset["svg"]).read_bytes()).hexdigest()[:20]}.svg'
                changes['ppt/media/' + media] = Path(asset['svg']).read_bytes()
                existing = {r.get('Id') for r in rels}
                number = 1
                while f'rId{number}' in existing:
                    number += 1
                rid = f'rId{number}'
                ET.SubElement(rels, f'{{{REL}}}Relationship', {'Id': rid, 'Type': NS['r'] + '/image', 'Target': '../media/' + media})
                blip = pic.find('.//a:blip', NS)
                extlist = ET.SubElement(blip, q('a', 'extLst'))
                ext = ET.SubElement(extlist, q('a', 'ext'), {'uri': '{96DAC541-7B7A-43D3-8B79-37D633B846F1}'})
                ET.SubElement(ext, q('asvg', 'svgBlip'), {q('r', 'embed'): rid})
                if native:
                    ac = ET.Element(q('mc', 'AlternateContent'))
                    choice = ET.SubElement(ac, q('mc', 'Choice'), {'Requires': 'a14'})
                    choice.append(native_shape(pic, asset, placement))
                    fallback = ET.SubElement(ac, q('mc', 'Fallback'))
                    fallback.append(vector_shape(pic))
                    index = list(tree).index(pic)
                    tree.remove(pic)
                    tree.insert(index, ac)
                replacement = ac if native else pic
                replacements[nv.get('id')] = ET.tostring(replacement, encoding='utf-8')
            if replacements:
                changes[part] = replace_math_pictures(z.read(part), replacements)
                ET.register_namespace('', REL)
                changes[relpart] = ET.tostring(rels, encoding='utf-8', xml_declaration=True)
        ET.register_namespace('', CT)
        changes['[Content_Types].xml'] = ET.tostring(types, encoding='utf-8', xml_declaration=True)
        out.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as dst:
            for info in z.infolist():
                dst.writestr(info, changes.pop(info.filename, z.read(info.filename)))
            for name, content in changes.items():
                dst.writestr(name, content)
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    prep = sub.add_parser('prepare')
    prep.add_argument('request', type=Path)
    prep.add_argument('--out', required=True, type=Path)
    final = sub.add_parser('finalize')
    final.add_argument('source', type=Path)
    final.add_argument('--manifest', required=True, type=Path)
    final.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    if args.command == 'prepare':
        result = prepare(args.request, args.out)
        print(json.dumps({k: v['representation'] for k, v in result.items()}))
    else:
        print(json.dumps(finalize(args.source, args.manifest, args.out)))


if __name__ == '__main__':
    main()
