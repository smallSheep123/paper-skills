"""Local tool bridge. Renders pixels and records hashes; never judges visual quality."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def executable(name: str, explicit: str | None = None) -> str | None:
    if explicit:
        p = Path(explicit).expanduser()
        return str(p.resolve()) if p.is_file() else shutil.which(explicit)
    if name != 'soffice':
        return shutil.which(name)
    for candidate in ('soffice.com', 'soffice', 'libreoffice'):
        found = shutil.which(candidate)
        if found:
            return found
    candidates = [Path('/Applications/LibreOffice.app/Contents/MacOS/soffice')]
    for env in ('ProgramFiles', 'ProgramFiles(x86)'):
        if os.environ.get(env):
            candidates.append(Path(os.environ[env]) / 'LibreOffice/program/soffice.com')
    return next((str(p) for p in candidates if p.is_file()), None)


def run_tool(args: list[str], timeout: int) -> None:
    result = subprocess.run(args, capture_output=True, text=True, timeout=timeout,
                            encoding='utf-8', errors='replace', check=False)
    if result.returncode:
        raise RuntimeError(f'{Path(args[0]).name} exited {result.returncode}: '
                           f'{result.stderr[-3000:]} {result.stdout[-1000:]}')


def contact_sheet(images: list[Path], output: Path) -> None:
    from PIL import Image, ImageDraw, ImageOps
    if not images:
        raise ValueError('No images to place in contact sheet')
    columns = min(3, len(images))
    width, height = 420, 270
    sheet = Image.new('RGB', (columns * width, ((len(images) + columns - 1) // columns) * height), 'white')
    draw = ImageDraw.Draw(sheet)
    for i, path in enumerate(images):
        x, y = (i % columns) * width, (i // columns) * height
        with Image.open(path) as source:
            thumb = ImageOps.contain(source.convert('RGB'), (width - 20, height - 36))
        sheet.paste(thumb, (x + (width - thumb.width) // 2, y + 8))
        draw.text((x + 10, y + height - 22), f'{i + 1}: {path.name}', fill='black')
    sheet.save(output)


def render(source: Path, output: Path, soffice: str | None = None,
           pdftoppm: str | None = None, dpi: int = 150, timeout: int = 180) -> dict:
    source, output = source.expanduser().resolve(), output.expanduser().resolve()
    if not source.is_file() or source.suffix.lower() not in ('.pptx', '.pdf'):
        raise ValueError('Input must be an existing .pptx or .pdf file')
    if not 72 <= dpi <= 600 or timeout < 1:
        raise ValueError('DPI must be 72..600 and timeout must be positive')
    if output.exists():
        raise ValueError('Output directory already exists; use a new revision directory')
    poppler = executable('pdftoppm', pdftoppm or os.environ.get('PDFTOPPM_PATH'))
    if not poppler:
        raise RuntimeError('pdftoppm not found; install Poppler or supply --pdftoppm')
    lo = None
    if source.suffix.lower() == '.pptx':
        lo = executable('soffice', soffice or os.environ.get('LIBREOFFICE_PATH'))
        if not lo:
            raise RuntimeError('LibreOffice not found; supply --soffice or use host rendering tools')
    # No system configuration changes and no shell expansion of user paths.
    source_sha = digest(source)
    output.mkdir(parents=True, exist_ok=False)
    pdf = output / (source.stem + '.pdf')
    expected = None
    if lo:
        with zipfile.ZipFile(source) as archive:
            root = ET.fromstring(archive.read('ppt/presentation.xml'))
            expected = len(root.findall('.//{http://schemas.openxmlformats.org/presentationml/2006/main}sldId'))
        with tempfile.TemporaryDirectory(prefix='paper-ppt-lo-') as profile:
            run_tool([lo, '-env:UserInstallation=' + Path(profile).resolve().as_uri(),
                      '--headless', '--convert-to', 'pdf', '--outdir', str(output), str(source)], timeout)
    else:
        shutil.copy2(source, pdf)
    if not pdf.is_file() or pdf.stat().st_size == 0:
        raise RuntimeError('Renderer did not produce a PDF; revision left for diagnosis')
    run_tool([poppler, '-png', '-r', str(dpi), str(pdf), str(output / 'slide')], timeout)
    pages = sorted(output.glob('slide-*.png'), key=lambda p: int(p.stem.rsplit('-', 1)[1]))
    if not pages or (expected is not None and len(pages) != expected):
        raise RuntimeError(f'Rendered page count mismatch: expected {expected}, got {len(pages)}')
    if digest(source) != source_sha:
        raise RuntimeError('Input changed while rendering; create a new revision')
    overview = output / 'contact-sheet.png'
    contact_sheet(pages, overview)
    def entry(p: Path) -> dict:
        return {'path': p.name, 'sha256': digest(p)}
    manifest = {'input': {'path': str(source), 'sha256': source_sha},
                'dpi': dpi, 'renderer': {'soffice': lo, 'pdftoppm': poppler},
                'pages': [entry(p) for p in pages], 'overview': entry(overview),
                'visual_review': 'pending'}
    (output / 'render.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return manifest


def doctor() -> dict:
    node = executable('node')
    package = False
    if node:
        try:
            result = subprocess.run([node, '-e', 'require("pptxgenjs")'],
                                    capture_output=True, timeout=10, check=False)
            package = result.returncode == 0
        except (OSError, subprocess.TimeoutExpired):
            pass
    return {'python': sys.version.split()[0], 'node': node, 'pptxgenjs': package,
            'soffice': executable('soffice', os.environ.get('LIBREOFFICE_PATH')),
            'pdftoppm': executable('pdftoppm', os.environ.get('PDFTOPPM_PATH')),
            'pillow': importlib.util.find_spec('PIL') is not None,
            'visual_model': 'NOT_CHECKED: discover a real image-capable tool in your AI client'}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('doctor')
    rp = commands.add_parser('render')
    rp.add_argument('source', type=Path)
    rp.add_argument('--out', type=Path, required=True)
    rp.add_argument('--soffice')
    rp.add_argument('--pdftoppm')
    rp.add_argument('--dpi', type=int, default=150)
    rp.add_argument('--timeout', type=int, default=180)
    args = parser.parse_args()
    try:
        if args.command == 'doctor':
            result = doctor()
            ok = all(result[k] for k in ('node', 'pptxgenjs', 'soffice', 'pdftoppm', 'pillow'))
        else:
            result = render(args.source, args.out, args.soffice, args.pdftoppm, args.dpi, args.timeout)
            ok = True
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if ok else 1
    except (ImportError, OSError, ValueError, RuntimeError, subprocess.TimeoutExpired, zipfile.BadZipFile, ET.ParseError) as exc:
        print(json.dumps({'error': str(exc), 'visual_review': 'pending'}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
