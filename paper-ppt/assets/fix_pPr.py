"""Repair duplicate DrawingML paragraph properties only when detected.

Default output: <name>.fixed.pptx. Does not overwrite the source or certify
PowerPoint compatibility. Conflicting properties are rejected, not guessed.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import tempfile
import xml.etree.ElementTree as ET
import zipfile

A = 'http://schemas.openxmlformats.org/drawingml/2006/main'


def repair_xml(data: bytes) -> tuple[bytes, int]:
    root = ET.fromstring(data)
    changed = 0
    for paragraph in root.iter(f'{{{A}}}p'):
        props = [c for c in paragraph if c.tag == f'{{{A}}}pPr']
        if len(props) < 2:
            continue
        first = ET.tostring(props[0])
        if any(ET.tostring(p) != first for p in props[1:]):
            raise ValueError('Conflicting pPr attributes; repair the generating code instead')
        for duplicate in props[1:]:
            paragraph.remove(duplicate)
        changed += 1
    if not changed:
        return data, 0
    # Preserve namespace prefixes and declarations (including mc:Ignorable tokens)
    # by deleting byte ranges rather than reserializing the entire OOXML tree.
    import re
    def fix_paragraph(match: re.Match[bytes]) -> bytes:
        block = match.group(0)
        pattern = rb'<a:pPr\b[^>]*(?:/>|>.*?</a:pPr\s*>)'
        found = list(re.finditer(pattern, block, flags=re.S))
        for extra in reversed(found[1:]):
            block = block[:extra.start()] + block[extra.end():]
        return block
    # PptxGenJS uses a:; other prefixes are deliberately not rewritten.
    fixed = re.sub(rb'<a:p\b[^>]*>.*?</a:p\s*>', fix_paragraph, data, flags=re.S)
    check = ET.fromstring(fixed)
    if any(sum(c.tag == f'{{{A}}}pPr' for c in p) > 1 for p in check.iter(f'{{{A}}}p')):
        raise ValueError('Unsupported XML namespace prefix; source left unchanged')
    return fixed, changed


def repair(source: Path, output: Path) -> int:
    source, output = source.resolve(), output.resolve()
    if source == output or output.exists():
        raise ValueError('Choose a new output file; source and previous revisions are preserved')
    output.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    temp = None
    try:
        with tempfile.NamedTemporaryFile(dir=output.parent, suffix='.pptx', delete=False) as f:
            temp = Path(f.name)
        with zipfile.ZipFile(source) as zin, zipfile.ZipFile(temp, 'w', zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename.startswith(('ppt/slides/slide', 'ppt/notesSlides/notesSlide')) and item.filename.endswith('.xml'):
                    data, changed = repair_xml(data)
                    count += changed
                zout.writestr(item, data)
        with zipfile.ZipFile(temp) as archive:
            if archive.testzip():
                raise ValueError('Output ZIP validation failed')
        temp.replace(output)
    finally:
        if temp is not None and temp.exists():
            temp.unlink()
    return count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--out', type=Path)
    args = parser.parse_args()
    output = args.out or args.source.with_name(args.source.stem + '.fixed.pptx')
    try:
        count = repair(args.source, output)
    except (OSError, ValueError, zipfile.BadZipFile, ET.ParseError) as exc:
        parser.exit(1, f'error: {exc}\n')
    print(f'Repaired paragraphs: {count}; output: {output}; visual review still required')


if __name__ == '__main__':
    main()
