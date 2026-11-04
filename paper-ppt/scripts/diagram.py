"""Render an HTML/CSS/SVG file to a PNG with a headless browser.

Why this exists: hand-placed PowerPoint connectors (straight lines between
shape edges) are the single most common source of "the diagram looks wrong"
in AI-made decks — lines miss the box, arrows stop short, the mesh looks like
confetti. HTML + inline SVG computes those coordinates instead of eyeballing
them, keeps CJK text on the real font stack, and produces one flat image that
PowerPoint cannot reflow.

Usage:
  python diagram.py figure.html --out figs/mesh.png --width 900 --height 560 [--scale 2]
  python diagram.py figure.html --out figs/mesh.png --width 900 --height 560 --selector "#panel"

The HTML should size itself (body { margin:0; width:900px; height:560px }).
`--selector` clips to one element by resizing the window to that element's box,
which is handy when one file holds several panels.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

CANDIDATES = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
]


def browser(explicit: str | None = None) -> str:
    for value in (explicit, os.environ.get('PAPER_PPT_CHROME')):
        if value:
            path = Path(value).expanduser()
            if path.is_file():
                return str(path)
            raise SystemExit(f'Browser not found at {value}')
    for name in ('chrome', 'google-chrome', 'chromium', 'msedge', 'microsoft-edge'):
        found = shutil.which(name)
        if found:
            return found
    for candidate in CANDIDATES:
        if Path(candidate).is_file():
            return candidate
    raise SystemExit('No Chrome/Edge/Chromium found. Install one, or pass --browser / set PAPER_PPT_CHROME.')


def measure(html: Path, selector: str, chrome: str) -> tuple[int, int]:
    """Ask the browser for the element's box via --dump-dom + a print-to-title trick."""
    probe = html.read_text(encoding='utf-8')
    script = (
        '<script>window.addEventListener("load",function(){'
        'var el=document.querySelector(%s);'
        'var r=el?el.getBoundingClientRect():document.body.getBoundingClientRect();'
        'document.title=Math.ceil(r.width)+"x"+Math.ceil(r.height);'
        '});</script>' % json.dumps(selector)
    )
    if '</body>' in probe:
        probe = probe.replace('</body>', script + '</body>')
    else:
        probe += script
    with tempfile.TemporaryDirectory(prefix='paper-ppt-diagram-') as tmp:
        page = Path(tmp) / 'probe.html'
        page.write_text(probe, encoding='utf-8')
        result = subprocess.run(
            [chrome, '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
             '--dump-dom', page.as_uri()],
            capture_output=True, text=True, timeout=90, encoding='utf-8', errors='replace')
    for token in reversed(result.stdout.split('<title>')[1:][:1] or []):
        size = token.split('</title>')[0].strip()
        if 'x' in size:
            width, height = size.split('x', 1)
            if width.isdigit() and height.isdigit():
                return int(width), int(height)
    raise RuntimeError('Could not measure the element box; pass --width/--height explicitly')


def render(html: Path, out: Path, width: int, height: int, scale: float, chrome: str,
           selector: str | None, timeout: int, transparent: bool) -> dict:
    html, out = html.resolve(), out.resolve()
    if not html.is_file():
        raise SystemExit(f'HTML not found: {html}')
    if selector:
        measured_w, measured_h = measure(html, selector, chrome)
        width, height = measured_w or width, measured_h or height
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        out.unlink()                      # a stale file would mask a failed render
    profile = tempfile.mkdtemp(prefix='paper-ppt-chrome-')
    command = [
        chrome, '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
        '--force-device-scale-factor=%s' % scale,
        '--window-size=%d,%d' % (width, height),
        # A fresh profile avoids handing the request to an already-running browser
        # (which exits 0 and silently writes nothing). --virtual-time-budget is
        # avoided on purpose: on Edge it stops --screenshot from ever firing.
        '--no-first-run', '--no-default-browser-check',
        '--allow-file-access-from-files',
        '--user-data-dir=%s' % profile,
        '--screenshot=%s' % out,
    ]
    command.append('--default-background-color=00000000' if transparent else '--default-background-color=ffffffff')
    command.append(html.as_uri())
    result = subprocess.run(command, capture_output=True, text=True, timeout=timeout,
                            encoding='utf-8', errors='replace')
    for _ in range(40):                      # the browser may still be flushing
        if out.is_file() and out.stat().st_size:
            break
        time.sleep(0.25)
    shutil.rmtree(profile, ignore_errors=True)
    if not out.is_file() or out.stat().st_size == 0:
        raise RuntimeError('Browser produced no screenshot: %s %s' % (result.stderr[-1200:], result.stdout[-600:]))
    return {'out': str(out), 'css_size': [width, height], 'scale': scale,
            'pixels': [round(width * scale), round(height * scale)], 'browser': chrome}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('html', type=Path)
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--width', type=int, default=1200)
    ap.add_argument('--height', type=int, default=600)
    ap.add_argument('--scale', type=float, default=2.0, help='device pixel ratio (2 = retina, good for slides)')
    ap.add_argument('--selector', help='clip to this CSS selector instead of the viewport')
    ap.add_argument('--browser')
    ap.add_argument('--timeout', type=int, default=120)
    ap.add_argument('--transparent', action='store_true', help='keep alpha (default: white background)')
    args = ap.parse_args(argv)
    try:
        chrome = browser(args.browser)
    except SystemExit as exc:
        print(json.dumps({'error': str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1
    report = render(args.html, args.out, args.width, args.height, args.scale, chrome,
                    args.selector, args.timeout, args.transparent)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
