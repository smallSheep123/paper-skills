"""Rebuild the AgentPrune figure crops used by this pilot from the paper PDF.

    python make_crops.py path/to/agentprune.pdf      # needs poppler (pdftoppm) + pillow

Coordinates were picked by looking at the 300-dpi page renders (the AI's figure-surgery step);
for a new paper the agent repeats that step: render, read the page, decide crops and annotation anchors.
"""
import subprocess, sys, tempfile, pathlib
from PIL import Image

pdf = sys.argv[1]
out = pathlib.Path(__file__).parent / 'crops'; out.mkdir(exist_ok=True)
tmp = pathlib.Path(tempfile.mkdtemp())
def page(n):
    subprocess.run(['pdftoppm', '-f', str(n), '-l', str(n), '-r', '300', '-png', pdf, str(tmp / f'p{n}')], check=True)
    return Image.open(next(tmp.glob(f'p{n}-*.png')))
K = 2.55  # boxes below are in 1000-px-wide thumbnail coordinates of the 300-dpi page
def c(im, b, name):
    im.crop(tuple(int(v * K) for v in b)).save(out / f'{name}.png')

p5, p6, p8 = page(5), page(6), page(8)
for b, n in [((188, 140, 815, 612), 'f4_full'), ((233, 186, 516, 556), 'f4_left'), ((522, 186, 810, 556), 'f4_right'),
             ((233, 186, 516, 492), 'f4_sp_left'), ((522, 186, 810, 492), 'f4_sp_right'),
             ((228, 492, 812, 576), 'f4_temporal'), ((228, 576, 812, 610), 'f4_tokens')]:
    c(p5, b, n)
x0, y0 = int(255 * K), int(812 * K)
p5.crop((x0 + 10, y0, x0 + 1240, int(845 * K))).save(out / 'eq7.png')            # Eq. (7) without its number
p5.crop((int(195 * K), 2892, int(830 * K), 3064)).save(out / 'eq8.png')          # Eq. (8) with the paper's own overbraces
f = 300 / 72
p6.crop((int(150 * f) + 225, int(507 * f), int(150 * f) + 1075, int(531 * f))).save(out / 'eq12.png')
c(p8, (600, 133, 818, 305), 'f5_gsm8k'); c(p8, (175, 133, 390, 305), 'f5_mmlu')
t = Image.open(out / 'f4_temporal.png'); w, h = t.size
t.crop((0, 0, w // 2, h)).save(out / 'f4_temporal_L.png'); t.crop((w // 2, 0, w, h)).save(out / 'f4_temporal_R.png')
print('crops ->', out)

# v3: zoom crops of single agent cells (Thinker 1 / 2 / 3), used on the example page
def agent_cells(crops):
    from PIL import Image
    a = Image.open(crops / 'f4_sp_left.png'); b = Image.open(crops / 'f4_sp_right.png')
    a.crop((368, 78, 660, 390)).save(crops / 't2_before.png'); b.crop((370, 78, 662, 390)).save(crops / 't2_after.png')
    a.crop((50, 78, 338, 390)).save(crops / 't1_before.png'); b.crop((52, 440, 340, 730)).save(crops / 't3_after.png')
