"""Style lint for a .pptx: text fit, accent budget, CJK line starts, figure numbering.

`check_deck.py` answers "is the file structurally sane?" (objects inside the
canvas, pictures not stretched, no blank placeholders). It deliberately does
not judge text fit or design. In practice the failures that make an AI deck look
amateur are the other kind:

  * a paragraph that needs four lines inside a box that fits two;
  * six red keywords on one page, so none of them reads as emphasis;
  * a line that starts with "，" because the break was placed by hand;
  * 图 5 / 图 7 / 图 7 again, because captions are typed, not generated.

This script measures those from the XML and prints warnings that name the
slide, the shape and the numbers. Text width is an estimate (CJK = 1 em,
ASCII ≈ 0.5 em), so treat a 3% overflow as "look at it", not "certainly broken".

  python scripts/lint_style.py deck.pptx [--preset domestic] [--json report.json] [--strict]

Exit code is 1 only with --strict and at least one error-level finding.
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'}
EMU = 914400.0
LEADING_PUNCT = '。，、；：？！）】》」』”’…·,.;:?!)]}'
TITLE_MAX_ZONE = 1.25          # shapes above this y are titles/headers


def load_tokens(preset: str) -> dict:
    path = Path(__file__).resolve().parents[1] / 'styles' / preset / 'tokens.json'
    if not path.is_file():
        raise SystemExit(f'Unknown preset "{preset}": {path} not found')
    return json.loads(path.read_text(encoding='utf-8'))


def text_width_em(text: str) -> float:
    """Approximate rendered width in em units (CJK full width, Latin half)."""
    width = 0.0
    for ch in text:
        code = ord(ch)
        if code < 128:
            if ch == ' ':
                width += 0.28
            elif ch.isdigit():
                width += 0.56
            elif ch.isupper():
                width += 0.64
            elif ch.isalpha():
                width += 0.52
            else:
                width += 0.38
        elif 0x4E00 <= code <= 0x9FFF or 0x3000 <= code <= 0x303F or 0xFF00 <= code <= 0xFF60:
            width += 1.0
        else:
            width += 0.6
    return width


def shape_box(sp) -> tuple[float, float, float, float] | None:
    xfrm = sp.find('.//a:xfrm', NS)
    if xfrm is None:
        return None
    off, ext = xfrm.find('a:off', NS), xfrm.find('a:ext', NS)
    if off is None or ext is None:
        return None
    return (int(off.get('x')) / EMU, int(off.get('y')) / EMU,
            int(ext.get('cx')) / EMU, int(ext.get('cy')) / EMU)


def body_insets(tx) -> tuple[float, float, float, float]:
    body = tx.find('a:bodyPr', NS)
    get = lambda name, default: (int(body.get(name)) / EMU) if body is not None and body.get(name) else default
    return (get('lIns', 0.1), get('tIns', 0.05), get('rIns', 0.1), get('bIns', 0.05))


def autofit_scale(tx) -> tuple[float, float]:
    node = tx.find('a:bodyPr/a:normAutofit', NS)
    if node is None:
        return 1.0, 1.0
    scale = int(node.get('fontScale', '100000')) / 100000
    reduction = int(node.get('lnSpcReduction', '0')) / 100000
    return scale, max(0.5, 1.0 - reduction)


def paragraphs(tx, accent: str | None = None) -> list[dict]:
    """Text, font size, colour and spacing for each paragraph, with <a:br/> splits."""
    out = []
    for para in tx.findall('a:p', NS):
        ppr = para.find('a:pPr', NS)
        size = None
        colours = set()
        text = []
        red_runs = []
        segments = ['']
        for child in para:
            tag = child.tag.split('}')[1]
            if tag == 'br':
                segments.append('')
                continue
            if tag != 'r':
                continue
            rpr = child.find('a:rPr', NS)
            if rpr is not None and rpr.get('sz'):
                size = max(size or 0, int(rpr.get('sz')) / 100)
            colour = rpr.find('a:solidFill/a:srgbClr', NS) if rpr is not None else None
            if colour is not None:
                colours.add(colour.get('val', '').upper())
            value = ''.join(t.text or '' for t in child.findall('a:t', NS))
            if accent and colour is not None and colour.get('val', '').upper() == accent:
                red_runs.append(value)
            text.append(value)
            segments[-1] += value
        if not text:
            continue
        space_before = 0.0
        spacing = 1.2
        if ppr is not None:
            if ppr.get('spcBef'):
                pts = ppr.find('a:spcBef/a:spcPts', NS)
                space_before = int(pts.get('val')) / 100 if pts is not None else 0.0
            if ppr.get('lnSpc'):
                pct = ppr.find('a:lnSpc/a:spcPct', NS)
                if pct is not None:
                    spacing = int(pct.get('val')) / 100000
        out.append({'text': ''.join(text), 'size': size, 'colours': colours,
                    'space_before': space_before, 'spacing': spacing, 'segments': segments,
                    'red_runs': red_runs})
    return out


def estimate(tx, w: float, h: float, default_size: float) -> dict:
    """Lines and height needed for the text, versus the box."""
    scale, spacing_scale = autofit_scale(tx)
    left, top, right, bottom = body_insets(tx)
    avail_w = max(w - left - right, 0.2)
    avail_h = max(h - top - bottom, 0.1)
    lines = 0
    tallest = 0.0
    for para in paragraphs(tx):
        size = (para['size'] or default_size) * scale
        tallest = max(tallest, size)
        per_line = max(avail_w * 72 / max(size, 1), 1.0)
        for segment in para['segments']:
            lines += max(1, math.ceil(text_width_em(segment) / per_line))
    height = (lines * tallest * 1.2 * spacing_scale) / 72
    return {'lines': lines, 'needs_in': round(height, 3), 'has_in': round(avail_h, 3),
            'overflow': height / avail_h if avail_h else 99.0}


def audit(path: Path, preset: str, strict: bool = False) -> dict:
    tokens = load_tokens(preset)
    accent = tokens['color']['accent'].upper()
    limits = tokens.get('limits', {})
    big = tokens['size'].get('bigNumber', 36)
    warnings, errors, stats = [], [], {'slides': 0, 'figures': [], 'accents': []}

    with zipfile.ZipFile(path) as z:
        names = sorted([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)],
                       key=lambda n: int(re.findall(r'\d+', n)[-1]))
        stats['slides'] = len(names)
        for index, name in enumerate(names, 1):
            root = ET.fromstring(z.read(name))
            page_reds = 0
            page_red_chars = 0
            page_chars = 0
            page_big = 0
            has_figure = root.find('.//p:pic', NS) is not None
            for sp in root.iter(f"{{{NS['p']}}}sp"):
                box = shape_box(sp)
                tx = sp.find('p:txBody', NS)
                if tx is None or box is None:
                    continue
                x, y, w, h = box
                label = f'p{index} ({x:.2f},{y:.2f} {w:.2f}x{h:.2f})'
                paras = paragraphs(tx, accent)
                if not paras:
                    continue

                fit = estimate(tx, w, h, tokens['size']['body'])
                if fit['overflow'] > 1.03:
                    warnings.append(f'{label}: text needs ~{fit["lines"]} lines / {fit["needs_in"]}in '
                                    f'in a {fit["has_in"]}in box ({fit["overflow"]:.2f}x)')

                # "≤4 条 / 每条 ≤28 字" only applies to real list frames: several
                # paragraphs in the body zone, not subtitles or one-line takeaways.
                is_list = len(paras) >= 3 and y > TITLE_MAX_ZONE
                for para in paras:
                    reds = sum(1 for colour in para['colours'] if colour == accent)
                    page_reds += reds
                    page_chars += len(para['text'])
                    if accent in para['colours']:
                        page_red_chars += len(para['text'])
                    text = para['text'].strip()
                    if not text:
                        continue
                    if text[0] in LEADING_PUNCT:
                        warnings.append(f'{label}: paragraph starts with "{text[0]}" — 行首标点')
                    for segment in para['segments']:
                        if segment[:1] in LEADING_PUNCT and segment[:1]:
                            warnings.append(f'{label}: line starts with "{segment[0]}" — 手动断行落在标点上')
                    if reds > limits.get('keywordsPerBullet', 1):
                        warnings.append(f'{label}: {reds} red runs in one paragraph — 「{text[:18]}」')
                    for run_text in para['red_runs']:
                        # 「6 个字」指的是汉字个数：数字/英文标注（deadline、35%）不占字数
                        cjk = sum(1 for ch in run_text.strip() if '\u4e00' <= ch <= '\u9fff')
                        if cjk > 6:
                            warnings.append(f'{label}: red run of {cjk} 汉字 '
                                            f'「{run_text.strip()[:12]}」 — 红色连续不应超过 6 字')
                    size = (para['size'] or tokens['size']['body']) * autofit_scale(tx)[0]
                    if size >= big * 0.9 and has_figure:
                        page_big += 1
                    if is_list and len(text) > limits.get('charsPerBulletZh', 28):
                        warnings.append(f'{label}: bullet {len(text)} chars > {limits.get("charsPerBulletZh", 28)}')
                    for match in re.finditer(r'图\s*(\d+)', text):
                        stats['figures'].append(int(match.group(1)))
                if is_list and len(paras) > limits.get('bulletsPerSlide', 4):
                    warnings.append(f'{label}: {len(paras)} paragraphs in one body frame '
                                    f'(limit {limits.get("bulletsPerSlide", 4)})')

            if page_reds > 0:
                stats['accents'].append({'page': index, 'red_runs': page_reds})

            if page_big > 1:
                warnings.append(f'p{index}: {page_big} runs at big-number size — 结果页只强调一个数')

    numbers = stats['figures']
    if numbers:
        duplicates = sorted({n for n in numbers if numbers.count(n) > 1})
        if duplicates:
            warnings.append(f'figure numbers repeated: {duplicates}')
        missing = [n for n in range(1, max(numbers) + 1) if n not in numbers]
        if missing:
            warnings.append(f'figure numbers missing: {missing} (captions are typed, not generated)')
    if strict and warnings:
        errors = warnings
        warnings = []

    return {'preset': preset, 'deck': str(path), 'stats': stats,
            'errors': errors, 'warnings': warnings,
            'ok': not errors}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('deck', type=Path)
    ap.add_argument('--preset', default='domestic')
    ap.add_argument('--json', type=Path)
    ap.add_argument('--strict', action='store_true', help='treat warnings as errors (exit 1)')
    args = ap.parse_args(argv)
    report = audit(args.deck, args.preset, args.strict)
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for item in report['errors']:
        print('ERROR  ' + item)
    for item in report['warnings']:
        print('warn   ' + item)
    print(json.dumps({k: report[k] for k in ('preset', 'ok')} | {'findings': len(report['errors']) + len(report['warnings'])},
                     ensure_ascii=False))
    return 0 if report['ok'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
