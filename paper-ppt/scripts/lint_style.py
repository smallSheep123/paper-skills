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
# Code frames are monospaced on purpose: a 50-character line is normal, and
# counting it as a bullet made every legit code slide fail the style lint.
MONO_FONT = re.compile(r'(consola|courier|monaco|menlo|mono|code)', re.I)

LEADING_PUNCT = '。，、；：？！）】》」』”’…·,.;:?!)]}'
TITLE_MAX_ZONE = 1.25          # shapes above this y are titles/headers
CAPTION_RE = re.compile(r'^\s*(?:图|Figure|Fig\.?|表|Table)\s*(\d+)', re.I)

# Per-rule severity. A blanket --strict made every warning fatal, so a 29-character
# bullet blocked delivery while a duplicated figure number did not.
SEVERITY = {
    'overflow': 'warn',        # 3–15% over: look at it
    'overflow_hard': 'error',  # >15% over: it will visibly spill
    'figure_duplicate': 'error',
    'leading_punct': 'error',
    'red_runs': 'warn',
    'red_length': 'warn',
    'chars': 'warn',
    'bullets': 'warn',
    'figure_gap': 'warn',
}


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


CJK_CHAR = re.compile(r'[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]')
# Shape names in the deck that mark navigation (a table of contents, a chapter rail).
# PowerPoint shows them in the selection pane, so the intent is inspectable.
NAV_NAME = 'nav:'


def is_latin_paragraph(text: str) -> bool:
    """True when the paragraph reads as English rather than Chinese/Japanese.

    The two languages need different budgets: Chinese is counted in characters
    (no word boundaries), English in rendered lines (see paragraph_lines).
    """
    cjk = len(CJK_CHAR.findall(text))
    latin = len(re.findall(r'[A-Za-z]', text))
    return latin > 0 and cjk * 4 < latin


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
        fonts = set()
        text = []
        runs = []          # (text, is_red) in document order — needed to merge split red runs
        segments = ['']
        for child in para:
            tag = child.tag.split('}')[1]
            if tag == 'br':
                segments.append('')
                runs.append(('', False))
                continue
            if tag != 'r':
                continue
            rpr = child.find('a:rPr', NS)
            if rpr is not None and rpr.get('sz'):
                size = max(size or 0, int(rpr.get('sz')) / 100)
            latin = rpr.find('a:latin', NS) if rpr is not None else None
            if latin is not None and latin.get('typeface'):
                fonts.add(latin.get('typeface'))
            colour = rpr.find('a:solidFill/a:srgbClr', NS) if rpr is not None else None
            if colour is not None:
                colours.add(colour.get('val', '').upper())
            value = ''.join(t.text or '' for t in child.findall('a:t', NS))
            runs.append((value, bool(accent) and colour is not None and colour.get('val', '').upper() == accent))
            text.append(value)
            segments[-1] += value
        if not text:
            continue
        # Merge consecutive red runs: pptxgenjs splits a phrase at every script
        # boundary, so 「可控可问责」usually arrives as two runs and each half
        # would slip under the 6-character limit on its own.
        merged = []
        for run_text, is_red in runs:
            if is_red and merged and merged[-1][1]:
                merged[-1] = (merged[-1][0] + run_text, True)
            else:
                merged.append((run_text, is_red))
        red_runs = [run_text for run_text, is_red in merged if is_red]

        space_before = 0.0
        spacing = 1.0
        if ppr is not None:
            # lnSpc / spcBef are child elements, not attributes — the old
            # `ppr.get('lnSpc')` guard never fired, so 1.5x spacing was invisible.
            pts = ppr.find('a:spcBef/a:spcPts', NS)
            if pts is not None and pts.get('val'):
                space_before = int(pts.get('val')) / 100
            pct = ppr.find('a:lnSpc/a:spcPct', NS)
            if pct is not None and pct.get('val'):
                spacing = int(pct.get('val')) / 100000
        out.append({'text': ''.join(text), 'size': size, 'colours': colours, 'fonts': fonts,
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
    height_pt = 0.0
    for para in paragraphs(tx):
        size = (para['size'] or default_size) * scale
        per_line = max(avail_w * 72 / max(size, 1), 1.0)
        para_lines = sum(max(1, math.ceil(text_width_em(segment) / per_line))
                         for segment in para['segments'])
        lines += para_lines
        # lnSpc / spcBef were parsed but unused before; ignoring them under-estimates
        # decks that set 1.4 line spacing and 12 pt between bullets.
        height_pt += para_lines * size * 1.2 * para['spacing'] * spacing_scale + para['space_before']
    height = height_pt / 72
    return {'lines': lines, 'needs_in': round(height, 3), 'has_in': round(avail_h, 3),
            'overflow': height / avail_h if avail_h else 99.0}


def paragraph_lines(para: dict, avail_w: float, default_size: float,
                    scale: float = 1.0) -> int:
    """Lines one paragraph takes at the given width, same model as estimate()."""
    size = (para['size'] or default_size) * scale
    per_line = max(avail_w * 72 / max(size, 1), 1.0)
    return sum(max(1, math.ceil(text_width_em(segment) / per_line))
               for segment in para['segments'])


def declared_nav(root) -> set[int]:
    """Ids of shapes the deck declares as navigation, such as a table of contents.

    A TOC marks the current chapter with the accent colour, and a chapter name is
    often longer than the 6-character keyword budget — 「热点感知的任务放置」 is nine.
    That is a state mark, not emphasis, so those labels are exempt from the rule.

    Deciding it from geometry ("a column of evenly spaced short labels") made the
    verdict depend on spacing and could excuse a genuine red emphasis on a column
    of KPI cards. The deck states the intent instead: name the shape `nav:<what>`
    (visible in PowerPoint's selection pane) and a fully accent-coloured label
    inside it reads as state.
    """
    found: set[int] = set()
    for sp in root.iter(f"{{{NS['p']}}}sp"):
        nv = sp.find('p:nvSpPr/p:cNvPr', NS)
        if nv is not None and (nv.get('name') or '').startswith(NAV_NAME):
            found.add(id(sp))
    return found


def audit(path: Path, preset: str, strict: bool = False) -> dict:
    tokens = load_tokens(preset)
    accent = tokens['color']['accent'].upper()
    limits = tokens.get('limits', {})
    warnings, errors, stats = [], [], {'slides': 0, 'figures': [], 'accents': []}

    def add(rule: str, message: str) -> None:
        (errors if SEVERITY.get(rule) == 'error' else warnings).append(message)

    with zipfile.ZipFile(path) as z:
        names = sorted([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)],
                       key=lambda n: int(re.findall(r'\d+', n)[-1]))
        stats['slides'] = len(names)
        for index, name in enumerate(names, 1):
            root = ET.fromstring(z.read(name))
            page_reds = 0
            nav = declared_nav(root)
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
                    add('overflow_hard' if fit['overflow'] > 1.15 else 'overflow',
                        f'{label}: text needs ~{fit["lines"]} lines / {fit["needs_in"]}in '
                        f'in a {fit["has_in"]}in box ({fit["overflow"]:.2f}x)')

                # "≤4 条 / 每条 ≤28 字" only applies to real list frames: several
                # paragraphs in the body zone, not subtitles or one-line takeaways.
                mono_frame = sum(1 for p in paras
                                 if any(MONO_FONT.search(f) for f in p['fonts'])) >= max(1, len(paras) - 1)
                # Bibliography entries are long by nature: "[2] B. Author et al.
                # Early exit networks. Venue 2024." is not a 28-character bullet.
                bib_frame = sum(1 for p in paras
                                if re.match(r'^\[\d+\]', p['text'].strip())) >= max(2, len(paras) - 1)
                is_list = (len(paras) >= 3 and y > TITLE_MAX_ZONE
                           and not mono_frame and not bib_frame)

                # A TOC current chapter is highlighted with the accent colour, which is
                # state, not emphasis — so the 6-character rule is exempt inside a
                # shape the deck declares as navigation (see declared_nav).
                in_rail = id(sp) in nav
                left, _, right, _ = body_insets(tx)
                avail_w = max(w - left - right, 0.2)
                scale = autofit_scale(tx)[0]
                for para in paras:
                    reds = len(para['red_runs'])
                    page_reds += reds
                    text = para['text'].strip()
                    if not text:
                        continue
                    if text[0] in LEADING_PUNCT:
                        add('leading_punct', f'{label}: paragraph starts with "{text[0]}" — 行首标点')
                    # segments[0] is the paragraph start already checked above; only
                    # the manual breaks after <a:br/> are new.
                    for segment in para['segments'][1:]:
                        if segment[:1] and segment[:1] in LEADING_PUNCT:
                            add('leading_punct', f'{label}: line starts with "{segment[0]}" — 手动断行落在标点上')
                    if reds > limits.get('keywordsPerBullet', 1):
                        add('red_runs', f'{label}: {reds} red runs in one paragraph — 「{text[:18]}」')
                    # Only a red *phrase inside* body text is the keyword emphasis this
                    # rule is about; an accent label on a navigation rail is state.
                    whole_accent = in_rail and len(para['red_runs']) == 1 \
                        and para['red_runs'][0].strip() == text
                    for run_text in para['red_runs']:
                        # 「6 个字」指的是汉字个数：数字/英文标注（deadline、35%）不占字数
                        cjk = sum(1 for ch in run_text.strip() if '\u4e00' <= ch <= '\u9fff')
                        if cjk > 6 and not whole_accent:
                            add('red_length', f'{label}: red run of {cjk} 汉字 '
                                            f'「{run_text.strip()[:12]}」 — 红色连续不应超过 6 字')
                    size = (para['size'] or tokens['size']['body']) * scale
                    if is_list and is_latin_paragraph(text):
                        # English is measured in lines, not characters or words: the
                        # same 9-word sentence is one line in a 11in frame and three
                        # in a 5.6in column, so the width has to be in the rule.
                        lines = paragraph_lines(para, avail_w, tokens['size']['body'], scale)
                        en_limit = limits.get('linesPerBulletEn', 2)
                        if lines > en_limit:
                            add('chars', f'{label}: bullet {lines} lines > {en_limit} '
                                         f'in {avail_w:.2f}in — 「{text[:28]}」')
                    elif is_list and len(text) > limits.get('charsPerBulletZh', 28):
                        add('chars', f'{label}: bullet {len(text)} chars > {limits.get("charsPerBulletZh", 28)}')
                    # Only caption-shaped text counts: a body sentence that mentions
                    # 「如图 3 所示」is a reference, not the caption of figure 3.
                    caption = CAPTION_RE.match(text)
                    looks_like_caption = caption and (size <= tokens['size']['caption'] + 2
                                                      or tokens['color']['muted'].upper() in para['colours'])
                    if looks_like_caption:
                        stats['figures'].append(int(caption.group(1)))
                if is_list and len(paras) > limits.get('bulletsPerSlide', 4):
                    add('bullets', f'{label}: {len(paras)} paragraphs in one body frame '
                                   f'(limit {limits.get("bulletsPerSlide", 4)})')

            if page_reds > 0:
                stats['accents'].append({'page': index, 'red_runs': page_reds})


    numbers = stats['figures']
    if numbers:
        duplicates = sorted({n for n in numbers if numbers.count(n) > 1})
        if duplicates:
            add('figure_duplicate', f'figure numbers repeated: {duplicates}')
        # Gaps only matter in a deck that presents most of the paper's figures; a
        # 6-page excerpt legitimately shows 5–7 and 10–13.
        missing = [n for n in range(min(numbers), max(numbers) + 1) if n not in numbers]
        if missing and len(numbers) >= 8:
            add('figure_gap', f'figure numbers missing: {missing} (captions are typed, not generated)')
    if strict:
        errors, warnings = errors + warnings, []

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
