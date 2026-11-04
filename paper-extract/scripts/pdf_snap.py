"""Native source path: page screenshots, per-page text, figure/table inventory, crops.

No MinerU, no models. Uses Poppler (pdftoppm / pdftotext) when present and
PyMuPDF as an optional fallback. The script only produces pixels and text;
deciding what a figure shows, whether a crop is complete and whether the
material is sufficient is the AI's job after actually looking at the images.

  python pdf_snap.py pages  paper.pdf --out work/pages [--dpi 150] [--pages 1-8]
  python pdf_snap.py text   paper.pdf --out work/paper.txt.md
  python pdf_snap.py inventory paper.pdf --out work/inventory.md
  python pdf_snap.py crop   paper.pdf --page 5 --box 0.05,0.08,0.45,0.30 --out figs/fig4.png [--dpi 300]
  python pdf_snap.py figure paper.pdf --page 5 --region 0.04,0.05,0.48,0.31 --out figs/fig2.png

`figure` is the one to try first: it finds the figure's real extent from vector
drawings, placed images and text (tick labels, outside annotations), stops above
the "Figure N:" caption, and prints the bbox + aspect ratio. `crop` remains for
hand-tuned boxes when the automatic extent is wrong.
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# Separator after the number: ":" / "：" (most venues) or "." / "|" (ACM, IEEE, some CVPR templates).
CAPTION = re.compile(r'^\s*(Figure|Fig\.|Table|Algorithm|Alg\.|图|表|算法)\s*([0-9]+[a-z]?|[A-Z]\.?[0-9]+)\s*[:：.|]\s*(.*)$', re.I)
# Algorithm boxes often have no separator: "Algorithm 1 Score Entropy Training Loop".
ALGO = re.compile(r'^\s*(Algorithm|算法)\s*([0-9]+)\s*[:：.]?\s+([A-Z\u4e00-\u9fff].*)$')
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
                m = CAPTION.match(segment) or ALGO.match(segment)
                if not m or not m.group(3).strip():
                    continue
                head = m.group(1).lower()
                kind = 'Table' if head in ('table', '表') else 'Algorithm' if head in ('algorithm', 'alg.', '算法') else 'Figure'
                key = (kind, m.group(2))
                if key in seen:
                    continue
                seen.add(key)
                items.append({'kind': kind, 'id': m.group(2), 'page': page, 'caption': m.group(3).strip()[:160]})
    order = {'Figure': 0, 'Table': 1, 'Algorithm': 2}
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
    if not items:
        print('WARNING: 0 captions found. The caption format may be unusual (check one caption on the page image);'
              ' fill the inventory by hand from the page images instead of assuming the paper has no figures.',
              file=sys.stderr)


def ink_bbox_by_pixels(page, clip, dpi: int = 96, threshold: int = 246):
    """Tight page-space bbox of non-background pixels inside `clip`.

    Vector and text bboxes are unreliable for rotated labels and for figures
    pasted as images, so the final extent is measured from a small render.
    """
    import fitz
    pix = page.get_pixmap(dpi=dpi, clip=clip, alpha=False, colorspace=fitz.csGRAY)
    width, height, stride = pix.width, pix.height, pix.stride
    data = pix.samples
    columns = [False] * width
    rows = [False] * height
    for y in range(height):
        row = data[y * stride:y * stride + width]
        first = None
        for x, value in enumerate(row):
            if value < threshold:
                columns[x] = True
                if first is None:
                    first = x
        if first is not None:
            rows[y] = True
    if not any(rows):
        return None
    x0 = columns.index(True)
    x1 = width - 1 - columns[::-1].index(True)
    y0 = rows.index(True)
    y1 = height - 1 - rows[::-1].index(True)
    scale = dpi / 72.0
    return fitz.Rect(clip.x0 + x0 / scale, clip.y0 + y0 / scale,
                     clip.x0 + (x1 + 1) / scale, clip.y0 + (y1 + 1) / scale)


def cmd_figure(a) -> None:
    """Auto-detect a figure's true extent inside a page region and crop it.

    Three kinds of ink count as figure content: vector drawings, placed raster
    images, and text spans (axis tick labels, "(a)/(b)" subcaptions, annotations
    that sit outside the plot box). The caption line is the hard bottom bound,
    because a caption is always below the figure it belongs to.
    """
    import json
    fitz = _fitz()
    pdf, out = Path(a.pdf), Path(a.out)
    x0, y0, x1, y1 = parse_box(a.region)
    pad = float(a.pad)
    with fitz.open(pdf) as doc:
        page = doc[a.page - 1]
        W, H = page.rect.width, page.rect.height
        clip = fitz.Rect(W * x0, H * y0, W * x1, H * y1)

        # 1. The caption always sits below the figure: it is the hard bottom bound.
        caption_top = None
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                text = ''.join(s['text'] for s in line['spans']).strip()
                r = fitz.Rect(line['bbox'])
                if not text or r.is_empty or not (CAPTION.match(text) or ALGO.match(text)):
                    continue
                # The caption can be wider than the region; require only horizontal overlap.
                if r.x1 > clip.x0 and r.x0 < clip.x1 and clip.y0 <= r.y0 <= clip.y1 + 0.06 * H:
                    caption_top = r.y0 if caption_top is None else min(caption_top, r.y0)
        search = fitz.Rect(clip)
        if caption_top is not None:
            search.y1 = min(search.y1, caption_top - 0.5)

        # 2. Vector and bitmap ink give a coarse prior to guard the pixel pass.
        core: list = []
        search_area = max(search.get_area(), 1.0)
        for drawing in page.get_drawings():
            r = fitz.Rect(drawing['rect'])
            if r.width <= 1.5 or r.height <= 1.5:
                continue             # hairline rules, dots, text underlines
            if r.get_area() >= 0.6 * search_area:
                continue             # page / column background panel, not figure ink
            fill = drawing.get('fill')
            if fill and all(channel > 0.97 for channel in fill) and r.get_area() >= 0.3 * search_area:
                continue             # a white plate the figure was pasted on
            r = r & search
            if not r.is_empty:
                core.append(r)
        for info in page.get_image_info():
            r = fitz.Rect(info['bbox']) & search
            if not r.is_empty:
                core.append(r)
        if not core:
            raise SystemExit(f'No drawings or images on page {a.page} inside the region; '
                             'widen --region or use crop with a hand-measured box')
        rough = fitz.Rect(core[0])
        for r in core[1:]:
            rough |= r

        # 3. Pixels decide. Rotated tick labels ("00:00" at 45 degrees) report a
        # bbox that stops above their real descenders, and pasted images can be
        # larger than their declared box, so geometry alone is not trustworthy.
        ink = ink_bbox_by_pixels(page, search)
        if ink is None or ink.is_empty:
            ink = rough
        else:
            guard = fitz.Rect(rough.x0 - 64, rough.y0 - 56, rough.x1 + 64, rough.y1 + 64)
            candidate = ink & guard
            if not candidate.is_empty:
                ink = candidate

        ink = fitz.Rect(ink.x0 - pad, ink.y0 - pad, ink.x1 + pad, ink.y1 + pad) & clip
        if caption_top is not None:
            ink.y1 = min(ink.y1, caption_top - 1.0)

        out.parent.mkdir(parents=True, exist_ok=True)
        page.get_pixmap(dpi=a.dpi, clip=ink).save(out)
    px_w, px_h = round(ink.width * a.dpi / 72), round(ink.height * a.dpi / 72)
    report = {'page': a.page, 'region': [x0, y0, x1, y1],
              'bbox': [round(ink.x0 / W, 5), round(ink.y0 / H, 5), round(ink.x1 / W, 5), round(ink.y1 / H, 5)],
              'points': [round(ink.width, 2), round(ink.height, 2)],
              'pixels': [px_w, px_h], 'aspect': round(ink.width / ink.height, 4),
              'caption_found': caption_top is not None, 'out': str(out)}
    if a.json:
        Path(a.json).parent.mkdir(parents=True, exist_ok=True)
        Path(a.json).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))
    print(f'-> {out}  open it and confirm axes, legend and subfigure labels are complete',
          file=sys.stderr)


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
    p = sub.add_parser('figure'); p.add_argument('pdf'); p.add_argument('--page', type=int, required=True)
    p.add_argument('--region', required=True, help='x0,y0,x1,y1 page fractions to search inside')
    p.add_argument('--dpi', type=int, default=300); p.add_argument('--out', required=True)
    p.add_argument('--pad', type=float, default=3.0, help='padding in points around the detected extent')
    p.add_argument('--json', help='also write the bbox/AR report to this path')
    p.set_defaults(fn=cmd_figure)
    a = ap.parse_args(argv)
    try:
        a.fn(a)
    except (ValueError, subprocess.CalledProcessError) as exc:
        print(f'error: {exc}', file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
