"""Manage local MinerU 4.x model files without any document-library backend.

This is a thin wrapper around the official `mineru-kit models` CLI. It does not
import MinerU internals, does not start a service, and never modifies global
environment variables.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys


def find_cli() -> str:
    cli = shutil.which("mineru-kit")
    if not cli:
        raise RuntimeError(
            'mineru-kit not found. Install MinerU 4.x first, e.g. '
            'python -m pip install -U "mineru>=4.0,<5"'
        )
    return cli


def run(args: list[str]) -> int:
    proc = subprocess.run(args, check=False)
    return proc.returncode


def build_download(cli: str, tier: str, source: str | None,
                   small_backend: str | None, vlm_engine: str | None) -> list[str]:
    cmd = [cli, "models", "download", "--tier", tier]
    if source:
        cmd += ["--source", source]
    if small_backend:
        cmd += ["--small-backend", small_backend]
    if vlm_engine:
        cmd += ["--vlm-engine", vlm_engine]
    return cmd


def build_verify(cli: str, tier: str,
                 small_backend: str | None, vlm_engine: str | None) -> list[str]:
    cmd = [cli, "models", "verify", "--tier", tier]
    if small_backend:
        cmd += ["--small-backend", small_backend]
    if vlm_engine:
        cmd += ["--vlm-engine", vlm_engine]
    return cmd


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    dl = sub.add_parser("download", help="Download the models needed by a MinerU tier")
    dl.add_argument("--tier", choices=("basic", "standard"), default="standard")
    dl.add_argument("--source", choices=("auto", "huggingface", "modelscope"))
    dl.add_argument("--small-backend")
    dl.add_argument("--vlm-engine")

    verify = sub.add_parser("verify", help="Verify downloaded model files")
    verify.add_argument("--tier", choices=("basic", "standard"), default="standard")
    verify.add_argument("--small-backend")
    verify.add_argument("--vlm-engine")

    sub.add_parser("show", help="Show MinerU model configuration")
    args = parser.parse_args()

    try:
        cli = find_cli()
        if args.command == "download":
            cmd = build_download(cli, args.tier, args.source, args.small_backend, args.vlm_engine)
        elif args.command == "verify":
            cmd = build_verify(cli, args.tier, args.small_backend, args.vlm_engine)
        else:
            cmd = [cli, "models", "show"]
        print(json.dumps({"command": cmd}, ensure_ascii=False))
        return run(cmd)
    except (OSError, RuntimeError) as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
