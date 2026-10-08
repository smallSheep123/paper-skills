import sys, pathlib, cairosvg
from PIL import Image, ImageDraw, ImageFont
out = pathlib.Path(__file__).parent / 'out'
names = sys.argv[1].split(',') if len(sys.argv) > 1 else sorted(p.name for p in out.iterdir() if p.is_dir())
for n in names:
    ims = []
    for svg in sorted((out / n).glob('p*.svg')):
        png = svg.with_suffix('.png'); cairosvg.svg2png(url=str(svg), write_to=str(png), output_width=1600); ims.append(Image.open(png).convert('RGB'))
    w = 800; h = 450
    sheet = Image.new('RGB', (w * len(ims) + 10 * (len(ims) + 1), h + 20), (120, 120, 120))
    for i, im in enumerate(ims): sheet.paste(im.resize((w, h)), (10 + i * (w + 10), 10))
    sheet.save(out / f'{n}-sheet.png')
print('rendered', names)
