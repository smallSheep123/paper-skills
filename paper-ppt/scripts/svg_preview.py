"""Convert SVG slide previews to PNG (and an optional contact sheet).

Usage:
    python scripts/svg_preview.py <dir> [--width 1280] [--sheet sheet.png]

The SVG previews come from assets/build-style-samples.js (or any script using
SvgCanvas). They are a quick look without LibreOffice; text wrapping is
approximate. Final visual review must still use a real PPTX render.
Requires: cairosvg, pillow.
"""
import argparse
import pathlib
import sys


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("dir")
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--sheet", default=None, help="write a contact sheet PNG")
    args = ap.parse_args()

    try:
        import cairosvg
    except ImportError:
        print("pip install cairosvg pillow", file=sys.stderr)
        return 2

    root = pathlib.Path(args.dir)
    svgs = sorted(root.rglob("*.svg"))
    pngs = []
    for svg in svgs:
        png = svg.with_suffix(".png")
        cairosvg.svg2png(url=str(svg), write_to=str(png), output_width=args.width)
        pngs.append(png)
        print(png)

    if args.sheet and pngs:
        from PIL import Image

        thumbs = [Image.open(p).convert("RGB") for p in pngs]
        tw, th = 480, 270
        cols = 4
        rows = (len(thumbs) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * (tw + 12) + 12, rows * (th + 12) + 12), "#9a9a9a")
        for i, im in enumerate(thumbs):
            im = im.resize((tw, th))
            sheet.paste(im, (12 + (i % cols) * (tw + 12), 12 + (i // cols) * (th + 12)))
        sheet.save(args.sheet)
        print(args.sheet)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
