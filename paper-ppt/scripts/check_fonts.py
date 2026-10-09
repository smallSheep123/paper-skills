#!/usr/bin/env python3
"""Check which fonts a style preset needs and which are installed on this machine.

    python scripts/check_fonts.py               # all presets
    python scripts/check_fonts.py domestic      # one preset
    python scripts/check_fonts.py --json dark-tech

For every role (latin / cjk / mono / math) it reports the first installed font in
the preset's fallback list, so you know what PowerPoint or the renderer will
actually use. See references/fonts.md for sources and licences.
"""
from __future__ import annotations

import argparse
import json
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

STYLES = Path(__file__).resolve().parent.parent / "styles"
ROLES = ("latin", "cjk", "mono", "math")

# Common localized or alternate names that refer to the same family.
ALIASES = {
    "microsoft yahei": ["微软雅黑", "microsoft yahei ui"],
    "pingfang sc": ["苹方-简", "pingfang"],
    "simsun": ["宋体"],
    "source han sans sc": ["思源黑体", "source han sans cn", "noto sans cjk sc"],
    "source han serif sc": ["思源宋体", "source han serif cn", "noto serif cjk sc"],
    "noto sans sc": ["noto sans cjk sc", "source han sans sc"],
    "noto serif sc": ["noto serif cjk sc"],
    "noto sans jp": ["noto sans cjk jp"],
    "hiragino sans": ["ヒラギノ角ゴシック", "hiragino kaku gothic pron"],
    "yu gothic": ["游ゴシック"],
}


def installed_families() -> set[str]:
    names: set[str] = set()
    if shutil.which("fc-list"):
        out = subprocess.run(["fc-list", ":", "family"], capture_output=True, text=True).stdout
        for line in out.splitlines():
            for n in line.split(","):
                names.add(n.strip().lower())
    dirs = []
    if platform.system() == "Windows":
        windir = os.environ.get("WINDIR", r"C:\Windows")
        dirs += [Path(windir) / "Fonts", Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft/Windows/Fonts"]
    elif platform.system() == "Darwin":
        dirs += [Path("/System/Library/Fonts"), Path("/Library/Fonts"), Path.home() / "Library/Fonts"]
    for d in dirs:
        if d.is_dir():
            for f in d.rglob("*"):
                if f.suffix.lower() in {".ttf", ".otf", ".ttc"}:
                    names.add(f.stem.lower().replace("-", " ").replace("_", " "))
    return names


def is_installed(font: str, have: set[str]) -> bool:
    key = font.lower()
    cands = [key] + ALIASES.get(key, [])
    compact = {h.replace(" ", "") for h in have}
    for c in cands:
        if c in have or c.replace(" ", "") in compact:
            return True
        if any(h.startswith(c) for h in have):  # file stems like "arial bold"
            return True
    return False


def check(preset: str, have: set[str], track: str = "default") -> dict:
    tokens = json.loads((STYLES / preset / "tokens.json").read_text(encoding="utf-8"))
    fonts = dict(tokens.get("fonts", {}))
    # The open track (scripts/get_fonts.py) is always a valid substitute: in the default track it is appended
    # after the preferred fonts (so an installed open font reports SUB, not MISS); in the open track it leads.
    o = fonts.get("open") or {}
    for role in ROLES:
        if role not in o and role not in fonts:
            continue
        base = fonts.get(role) or []
        base = [base] if isinstance(base, str) else list(base)
        extra = o.get(role) or []
        extra = [extra] if isinstance(extra, str) else list(extra)
        merged = extra + base if track == "open" else base + extra
        fonts[role] = list(dict.fromkeys(merged))
    report = {"preset": preset, "roles": {}}
    for role in ROLES:
        lst = fonts.get(role)
        if not lst:
            continue
        lst = [lst] if isinstance(lst, str) else lst
        status = [(f, is_installed(f, have)) for f in lst]
        used = next((f for f, ok in status if ok), None)
        report["roles"][role] = {"wanted": lst[0], "uses": used, "preferred_ok": status[0][1],
                                 "missing": [f for f, ok in status if not ok]}
    return report


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("presets", nargs="*")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--track", choices=["default", "open"], default="default",
                    help="open = bundled open-licensed fonts (scripts/get_fonts.py)")
    a = ap.parse_args()
    presets = a.presets or sorted(p.name for p in STYLES.iterdir() if (p / "tokens.json").exists())
    have = installed_families()
    reports = [check(p, have, a.track) for p in presets]
    if a.json:
        print(json.dumps(reports, ensure_ascii=False, indent=2))
        return 0
    worst = 0
    for r in reports:
        print(f"\n{r['preset']}")
        for role, x in r["roles"].items():
            if x["preferred_ok"]:
                mark, note = "OK  ", x["wanted"]
            elif x["uses"]:
                mark, note = "SUB ", f"{x['wanted']} missing -> uses {x['uses']}"
                worst = max(worst, 1)
            else:
                mark, note = "MISS", (f"none of {', '.join(x['missing'])} installed; renderers will silently fall back"
                                      " (e.g. DejaVu Sans), so visual review on this machine is invalid")
                worst = 2
            print(f"  [{mark}] {role:<5} {note}")
    print("\nSources and safe substitutes: references/fonts.md; open fonts: python scripts/get_fonts.py --install")
    return worst


if __name__ == "__main__":
    sys.exit(main())
