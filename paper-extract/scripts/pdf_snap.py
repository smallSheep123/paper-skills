"""Native source path: page screenshots, per-page text, figure/table inventory, crops.

No MinerU, no models. Uses Poppler (pdftoppm / pdftotext) when present and
PyMuPDF as an optional fallback. The script only produces pixels and text;
deciding what a figure shows, whether a crop is complete and whether the
material is sufficient is the AI's job after actually looking at the images.

  python pdf_snap.py pages  paper.pdf --out work/pages [--dpi 150] [--pages 1-8]
  python pdf_snap.py text   paper.pdf --out work/paper.txt.md
  python pdf_snap.py inventory paper.pdf --out work/inventory.md
  python pdf_snap.py crop   paper.pdf --page 5 --box 0.05,0.08,0.45,0.30 --out figs/fig4.png [--dpi 300]
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

CAPTION = re.compile(r'^\s*(Figure|Fig\.|Table|图|表)\s*([0-9]+[a-z]?|[A-Z]\.?[0-9]+)\s*[:：]\s*(.*)$', re.I)
COLUMN_GAP = re.compile(r'\s{3,}')  # pdftotext -layout puts side-by-side columns on one line


def parse_pages(spec: str | None, count: int) -> list[int]:
    if not spec:
        return list(range(1, count + 1))
    out: list[int] = []
    for part in spec.split(','):
        part = part.strip()
        if not part:
            continue
        if '-' in part:
            a, b = part.split('-', 1)
            lo, hi = int(a), int(b) if b else count
            out.extend(range(lo, hi + 1))
        else:
            out.append(int(part))
    bad = [p for p in out if p < 1 or p > count]
    if bad:
        raise ValueError(f'pages out of range 1..{count}: {bad}')
    return sorted(dict.fromkeys(out))


def parse_box(text: str) -> tuple[float, float, float, float]:
    vals = [float(v) for v in text.split(',')]
    if len(vals) != 4:
        raise ValueError('--box needs x0,y0,x1,y1')
    x0, y0, x1, y1 = vals
    if not (0 <= x0 < x1 <= 1 and 0 <= y0 < y1 <= 1):
        raise ValueError('--box is page fractions: 0 <= x0 < x1 <= 1, 0 <= y0 < y1 <= 1')
    return x0, y0, x1, y1


def find_captions(page_texts: list[str]) -> list[dict]:
    """Caption lines per page ("Figure 3:" / "表 2："). A lead only; the page image is the truth."""
    items, seen = [], set()
    for page, text in enumerate(page_texts, 1):
        for line in text.splitlines():
            for segment in COLUMN_GAP.split(line):
                m = CAPTION.match(segment)
                if not m or not m.group(3).strip():
                    continue
                kind = 'Table' if m.group(1).lower() in ('table', '表') else 'Figure'
                key = (kind, m.group(2))
                if key in seen:
                    continue
                seen.add(key)
                items.append({'kind': kind, 'id': m.group(2), 'page': page, 'caption': m.group(3).strip()[:160]})
    order = {'Figure': 0, 'Table': 1}
    return sorted(items, key=lambda i: (order[i['kind']], int(re.sub(r'\D', '', i['id']) or 0), i['id']))


def page_count(pdf: Path) -> int:
    if shutil.which('pdfinfo'):
        out = subprocess.run(['pdfinfo', str(pdf)], capture_output=True, text=True, check=True).stdout
        m = re.search(r'^Pages:\s+(\d+)', out, re.M)
        if m:
            return int(m.group(1))
    fitz = _fitz()
    with fitz.open(pdf) as doc:
        return doc.page_count


def _fitz():
    try:
        import fitz  # PyMuPDF
        return fitz
    except ImportError as exc:
        raise SystemExit('Need Poppler (pdftoppm/pdftotext/pdfinfo) or `pip install pymupdf`.') from exc


def render_page(pdf: Path, page: int, dpi: int, out: Path) -> Path:
    out.parent.mkdir(parents=True, exist_ok=True)
    if shutil.which('pdftoppm'):
        stem = out.with_suffix('')
        subprocess.run(['pdftoppm', '-f', str(page), '-l', str(page), '-r', str(dpi), '-singlefile', '-png', str(pdf), str(stem)],
                       check=True, capture_output=True)
        return stem.with_suffix('.png')
    fitz = _fitz()
    with fitz.open(pdf) as doc:
        doc[page - 1].get_pixmap(dpi=dpi).save(out)
    return out


def page_text(pdf: Path, page: int) -> str:
    if shutil.which('pdftotext'):
        return subprocess.run(['pdftotext', '-layout', '-f', str(page), '-l', str(page), str(pdf), '-'],
                              capture_output=True, text=True, check=True, encoding='utf-8', errors='replace').stdout
    fitz = _fitz()
    with fitz.open(pdf) as doc:
        return doc[page - 1].get_text()


def contact_sheet(images: list[Path], out: Path, labels: list[str], cols: int = 4, width: int = 360) -> None:
    from PIL import Image, ImageDraw
    thumbs = []
    for p in images:
        im = Image.open(p).convert('RGB')
        im.thumbnail((width, width * 2))
        thumbs.append(im)
    h = max(t.height for t in thumbs) + 24
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (width + 10) + 10, rows * (h + 10) + 10), '#9a9a9a')
    draw = ImageDraw.Draw(sheet)
    for i, (t, label) in enumerate(zip(thumbs, labels)):
        x, y = 10 + (i % cols) * (width + 10), 10 + (i // cols) * (h + 10)
        sheet.paste(t, (x, y + 24))
        draw.rectangle([x, y, x + width, y + 22], fill='white')
        draw.text((x + 6, y + 5), label, fill='black')
    sheet.save(out)


def cmd_pages(a) -> None:
    pdf, out = Path(a.pdf), Path(a.out)
    pages = parse_pages(a.pages, page_count(pdf))
    files = [render_page(pdf, p, a.dpi, out / f'p{p:02d}.png') for p in pages]
    contact_sheet(files, out / 'sheet.png', [f'p{p}' for p in pages])
    print(f'{len(files)} pages -> {out} (sheet.png for overview; open single pages to read figures)')


def cmd_text(a) -> None:
    pdf, out = Path(a.pdf), Path(a.out)
    pages = parse_pages(a.pages, page_count(pdf))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(''.join(f'\n<!-- Page {p} -->\n\n{page_text(pdf, p)}' for p in pages), encoding='utf-8')
    print(f'text of {len(pages)} pages -> {out}')


def cmd_inventory(a) -> None:
    pdf, out = Path(a.pdf), Path(a.out)
    n = page_count(pdf)
    items = find_captions([page_text(pdf, p) for p in range(1, n + 1)])
    lines = ['# 图表清单（自动初稿，需逐项看页面截图确认）', '',
             '| 编号 | 页码 | caption 摘要 | 已看原图 | 进入 PPT | 裁切文件 | 备注 |', '|---|---|---|---|---|---|---|']
    lines += [f"| {i['kind']} {i['id']} | {i['page']} | {i['caption'].replace('|', '/')} |  |  |  |  |" for i in items]
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'{len(items)} captions -> {out}')


def cmd_crop(a) -> None:
    from PIL import Image
    pdf, out = Path(a.pdf), Path(a.out)
    x0, y0, x1, y1 = parse_box(a.box)
    with tempfile.TemporaryDirectory() as tmp:
        page_png = render_page(pdf, a.page, a.dpi, Path(tmp) / 'page.png')
        im = Image.open(page_png)
        w, h = im.size
        out.parent.mkdir(parents=True, exist_ok=True)
        im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h))).save(out)
    print(f'p{a.page} {a.box} @ {a.dpi}dpi -> {out} (open it and check axes, legend, caption edges)')


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    p = sub.add_parser('pages'); p.add_argument('pdf'); p.add_argument('--out', required=True)
    p.add_argument('--dpi', type=int, default=150); p.add_argument('--pages')
    p.set_defaults(fn=cmd_pages)
    p = sub.add_parser('text'); p.add_argument('pdf'); p.add_argument('--out', required=True); p.add_argument('--pages')
    p.set_defaults(fn=cmd_text)
    p = sub.add_parser('inventory'); p.add_argument('pdf'); p.add_argument('--out', required=True)
    p.set_defaults(fn=cmd_inventory)
    p = sub.add_parser('crop'); p.add_argument('pdf'); p.add_argument('--page', type=int, required=True)
    p.add_argument('--box', required=True, help='x0,y0,x1,y1 as fractions of the page')
    p.add_argument('--dpi', type=int, default=300); p.add_argument('--out', required=True)
    p.set_defaults(fn=cmd_crop)
    a = ap.parse_args(argv)
    try:
        a.fn(a)
    except (ValueError, subprocess.CalledProcessError) as exc:
        print(f'error: {exc}', file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
