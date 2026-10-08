#!/usr/bin/env python3
"""Fetch and install the open-licensed fonts used by the "open" font track.

    python scripts/get_fonts.py                 # download CJK fonts into fonts/cjk/
    python scripts/get_fonts.py --install       # + install bundled Latin and CJK fonts for the current user
    python scripts/get_fonts.py --list

Latin fonts (Arimo, Carlito, Inter, JetBrains Mono, Fira Sans/Mono, STIX Two Math,
TeX Gyre Pagella) are bundled in fonts/ with their licences. CJK fonts are
10-25 MB each, so they are downloaded from the google/fonts repository at a
pinned commit and verified by SHA-256 instead of being committed.
All fonts here are under SIL OFL 1.1 or the GUST Font License.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import platform
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

FONTS = Path(__file__).resolve().parent.parent / "fonts"
COMMIT = "5e8a3ba899557829a76cfdac30fa512bda91d7ca"
BASE = f"https://raw.githubusercontent.com/google/fonts/{COMMIT}/ofl"

CJK = [
    # (family, file, path in google/fonts, sha256, MB)
    ("Noto Sans SC", "NotoSansSC[wght].ttf", "notosanssc/NotoSansSC%5Bwght%5D.ttf",
     "a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da", 17.8),
    ("Noto Serif SC", "NotoSerifSC[wght].ttf", "notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
     "050080d9255a86808f2945bffac582b31ef32bc36411ce29563b4961670c66f9", 25.1),
    ("Noto Sans JP", "NotoSansJP[wght].ttf", "notosansjp/NotoSansJP%5Bwght%5D.ttf",
     "c2f3b4d463500a2ddcd3849cded1fceeb9fd6d1c32e6cbecd568453ba50fc68f", 9.6),
]
LICENCE_URL = f"{BASE}/notosanssc/OFL.txt"


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def download(only: list[str] | None) -> list[Path]:
    out = FONTS / "cjk"
    out.mkdir(parents=True, exist_ok=True)
    got = []
    for fam, name, rel, digest, mb in CJK:
        if only and fam not in only:
            continue
        dst = out / name
        if dst.exists() and sha256(dst) == digest:
            print(f"ok      {fam} (cached)")
            got.append(dst)
            continue
        print(f"fetch   {fam} ({mb} MB) ...", flush=True)
        tmp = dst.with_suffix(".part")
        urllib.request.urlretrieve(f"{BASE}/{rel}", tmp)
        if sha256(tmp) != digest:
            tmp.unlink()
            raise SystemExit(f"checksum mismatch for {name}; refusing to install")
        tmp.replace(dst)
        got.append(dst)
        print(f"ok      {fam}")
    lic = out / "OFL.txt"
    if not lic.exists():
        urllib.request.urlretrieve(LICENCE_URL, lic)
    return got


def user_font_dir() -> Path:
    system = platform.system()
    if system == "Windows":
        return Path(os.environ["LOCALAPPDATA"]) / "Microsoft" / "Windows" / "Fonts"
    if system == "Darwin":
        return Path.home() / "Library" / "Fonts"
    return Path.home() / ".local" / "share" / "fonts"


def install() -> None:
    dst = user_font_dir()
    dst.mkdir(parents=True, exist_ok=True)
    files = [p for p in FONTS.rglob("*") if p.suffix.lower() in {".ttf", ".otf"}]
    for p in files:
        shutil.copy2(p, dst / p.name)
    print(f"installed {len(files)} font files into {dst}")
    if platform.system() == "Windows":
        print("Windows: per-user fonts are picked up after restarting PowerPoint; "
              "if not, right-click the files in fonts/ and choose 'Install'.")
    elif shutil.which("fc-cache"):
        subprocess.run(["fc-cache", "-f", str(dst)], check=False)
    print("Restart PowerPoint / LibreOffice so they see the new fonts.")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--install", action="store_true", help="also install all fonts for the current user")
    ap.add_argument("--only", nargs="*", help="CJK families to fetch, e.g. 'Noto Sans SC'")
    ap.add_argument("--no-cjk", action="store_true", help="skip CJK download")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()
    if a.list:
        for p in sorted(FONTS.rglob("*")):
            if p.suffix.lower() in {".ttf", ".otf"}:
                print(f"bundled  {p.relative_to(FONTS)}")
        for fam, name, *_ , mb in CJK:
            state = "present" if (FONTS / "cjk" / name).exists() else "download"
            print(f"{state:8} cjk/{name} ({fam}, {mb} MB)")
        return 0
    if not a.no_cjk:
        download(a.only)
    if a.install:
        install()
    return 0


if __name__ == "__main__":
    sys.exit(main())
