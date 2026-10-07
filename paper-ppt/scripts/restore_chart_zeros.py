"""Restore source-verified chart zeros lost in PptxGenJS embedded XLSX cells.

Only use after confirming that the cached zero is the intended source value.
Never replaces a nonblank workbook value; output must be a new file.
"""
from __future__ import annotations

import argparse
from io import BytesIO
from pathlib import Path
import re
import tempfile
import xml.etree.ElementTree as ET
import zipfile

from check_deck import NS, relationships, referenced_cells, workbook_cells


def restore(source: Path, output: Path) -> list[dict]:
    source, output = source.resolve(), output.resolve()
    if source == output or output.exists():
        raise ValueError('Choose a new output file; preserve previous revisions')
    changes, replacement = [], {}
    with zipfile.ZipFile(source) as z:
        patches = {}
        for part in z.namelist():
            if not re.fullmatch(r'ppt/charts/chart\d+\.xml', part):
                continue
            root = ET.fromstring(z.read(part))
            external = root.find('c:externalData', NS)
            if external is None:
                continue
            wb = relationships(z, part)[external.get(f"{{{NS['r']}}}id")]
            cells = workbook_cells(z.read(wb))
            for ref in root.findall('.//c:numRef', NS):
                formula = ref.findtext('c:f', namespaces=NS)
                values = referenced_cells(formula, cells)
                match = re.fullmatch(r"(?:'([^']+)'|([^!]+))!\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?", formula)
                sheet = match.group(1) or match.group(2)
                col, start = match.group(3), int(match.group(4))
                for pt in ref.findall('c:numCache/c:pt', NS):
                    i = int(pt.get('idx'))
                    if float(pt.findtext('c:v', namespaces=NS)) == 0 and values[i] == '':
                        address = f'{col}{start+i}'
                        patches.setdefault(wb, set()).add((sheet, address))
        for wb, targets in patches.items():
            replacements = {}
            with zipfile.ZipFile(BytesIO(z.read(wb))) as wz:
                rels = relationships(wz, 'xl/workbook.xml')
                sheets = {e.get('name'): rels[e.get(f"{{{NS['r']}}}id")]
                          for e in ET.fromstring(wz.read('xl/workbook.xml')).findall('s:sheets/s:sheet', NS)}
                for sheet, address in sorted(targets):
                    part = sheets[sheet]
                    xml = replacements.get(part, wz.read(part))
                    pattern = rb'<c\b(?=[^>]*\br="' + address.encode() + rb'")[^>]*>.*?</c>'
                    found = list(re.finditer(pattern, xml, re.S))
                    if len(found) != 1:
                        raise ValueError(f'Unsupported or missing scalar cell: {sheet}!{address}')
                    cell = ET.fromstring(found[0].group(0))
                    if cell.get('t') not in (None, 'n') or any(e.tag != 'v' for e in cell):
                        raise ValueError(f'Refusing to change nonnumeric/formula cell: {address}')
                    new = f'<c r="{address}"><v>0</v></c>'.encode()
                    xml = xml[:found[0].start()] + new + xml[found[0].end():]
                    replacements[part] = xml
                    changes.append({'workbook': wb, 'sheet': sheet, 'cell': address, 'value': 0})
                buffer = BytesIO()
                with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as out:
                    for item in wz.infolist():
                        out.writestr(item, replacements.get(item.filename, wz.read(item.filename)))
                replacement[wb] = buffer.getvalue()
        output.parent.mkdir(parents=True, exist_ok=True)
        temp = None
        try:
            with tempfile.NamedTemporaryFile(dir=output.parent, suffix='.pptx', delete=False) as f:
                temp = Path(f.name)
            with zipfile.ZipFile(temp, 'w', zipfile.ZIP_DEFLATED) as out:
                for item in z.infolist():
                    out.writestr(item, replacement.get(item.filename, z.read(item.filename)))
            temp.replace(output)
        finally:
            if temp and temp.exists():
                temp.unlink()
    return changes


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    changes = restore(args.source, args.out)
    print(f'Restored {len(changes)} source-verified zeros: {changes}; output: {args.out}')


if __name__ == '__main__':
    main()
