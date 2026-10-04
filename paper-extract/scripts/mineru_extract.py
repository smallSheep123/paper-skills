"""Convert one document to Markdown with stateless MinerU 4.x.

Default output is <source>_mineru/<source>.md. The script intentionally uses
`mineru-kit parse`, not MinerU's document-library client and not any MCP layer.
Models are expected to be downloaded first; default model source is local.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
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


def build_command(cli: str, source: Path, output: Path, tier: str,
                  pages: str | None, ocr_mode: str | None) -> list[str]:
    cmd = [cli, "parse", str(source), "-o", str(output), "--tier", tier]
    if pages:
        cmd += ["--pages", pages]
    if ocr_mode:
        cmd += ["--ocr-mode", ocr_mode]
    return cmd


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--out-dir", type=Path,
                        help="New output directory; default: <source>_mineru")
    parser.add_argument("--tier", choices=("flash", "basic", "standard", "advanced"),
                        default="standard")
    parser.add_argument("--pages", help='MinerU page expression, e.g. "all" or "1-5,8"')
    parser.add_argument("--ocr-mode", choices=("txt", "ocr"))
    parser.add_argument("--model-source",
                        choices=("local", "auto", "huggingface", "modelscope"),
                        default="local",
                        help="local keeps inference offline after an explicit model download")
    args = parser.parse_args()

    try:
        source = args.source.expanduser().resolve()
        if not source.is_file():
            raise ValueError(f"Input does not exist: {source}")

        out_dir = (args.out_dir.expanduser().resolve()
                   if args.out_dir
                   else source.parent / f"{source.stem}_mineru")
        if out_dir.exists():
            raise ValueError(f"Output directory already exists: {out_dir}")
        out_dir.mkdir(parents=True, exist_ok=False)
        output = out_dir / f"{source.stem}.md"

        cli = find_cli()
        cmd = build_command(cli, source, output, args.tier, args.pages, args.ocr_mode)
        env = os.environ.copy()
        env["MINERU_MODEL_SOURCE"] = args.model_source
        proc = subprocess.run(cmd, env=env, check=False)
        if proc.returncode:
            raise RuntimeError(f"MinerU exited with code {proc.returncode}")
        if not output.is_file():
            raise RuntimeError("MinerU reported success but Markdown output was not created")

        print(json.dumps({
            "markdown": str(output),
            "output_dir": str(out_dir),
            "model_source": args.model_source,
            "tier": args.tier,
        }, ensure_ascii=False))
        return 0
    except (OSError, RuntimeError, ValueError) as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
