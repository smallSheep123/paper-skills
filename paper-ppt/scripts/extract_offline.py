"""Optional paper-mcp bridge. Only modifies this process's environment.

Use the paper-mcp Python environment. No bundled backend or personal config path.
Default returns library paths so Markdown image references keep working.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import sys


def configure(config: str | None = None) -> None:
    if config:
        path = Path(config).expanduser().resolve()
        if not path.is_file():
            raise ValueError(f'Config does not exist: {path}')
        os.environ['PAPER_MCP_CONFIG'] = str(path)
    for key in ('NO_PROXY', 'no_proxy'):
        hosts = [s.strip() for s in os.environ.get(key, '').split(',') if s.strip()]
        for host in ('localhost', '127.0.0.1', '::1'):
            if host not in hosts:
                hosts.append(host)
        os.environ[key] = ','.join(hosts)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('path', type=Path, help='Existing input document')
    parser.add_argument('--config', help='paper-mcp config; otherwise use its normal configuration discovery')
    parser.add_argument('--force', action='store_true', help='Explicitly ignore extraction cache')
    parser.add_argument('--no-lib', action='store_true', help='Extract to <stem>_md without importing')
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--copy-bundle', action='store_true', help='Copy Markdown and sibling assets to a new <stem>_extracted directory')
    group.add_argument('--no-copy', action='store_true', help='Legacy flag; no-copy is now the default')
    args = parser.parse_args()
    source = args.path.expanduser().resolve()
    try:
        if not source.is_file():
            raise ValueError(f'Input does not exist: {source}')
        if args.no_lib and args.copy_bundle:
            raise ValueError('--copy-bundle only applies to library extraction')
        target = source.parent / (source.stem + ('_md' if args.no_lib else '_extracted'))
        if (args.no_lib or args.copy_bundle) and target.exists():
            raise ValueError(f'Output already exists; preserve or move it first: {target}')
        configure(args.config)  # Must precede paper_mcp imports.
        from paper_mcp.server import build_context
        ctx = build_context()
        if args.no_lib:
            from paper_mcp.tools.extract_to_markdown import extract_to_markdown
            result = extract_to_markdown(ctx, str(source), save_dir=str(target))
        else:
            from paper_mcp.tools.extract_pdf import extract_pdf
            result = dict(extract_pdf(ctx, str(source), force=args.force))
            paper_id = result.get('paper_id')
            paper = ctx.store.get_paper(paper_id) if paper_id else None
            if paper and paper.md_path:
                md = (Path(ctx.config.data_dir) / paper.md_path).resolve()
                result['lib_md'] = str(md)
                if args.copy_bundle:
                    # Keep relative image links, unlike copying only paper.md.
                    library = Path(ctx.config.data_dir).resolve()
                    if md.parent == library or not md.is_relative_to(library):
                        raise ValueError('Refusing to copy a library root or external directory')
                    if target.is_relative_to(md.parent):
                        raise ValueError('Bundle destination cannot be inside its source')
                    shutil.copytree(md.parent, target, symlinks=True)
                    result['copied_md'] = str(target / md.name)
        print(json.dumps(result, ensure_ascii=False, default=str))
        return 0
    except ImportError as exc:
        print(json.dumps({'error': f'paper-mcp environment/dependency missing: {exc}'}, ensure_ascii=False), file=sys.stderr)
    except Exception as exc:
        print(json.dumps({'error': str(exc)}, ensure_ascii=False), file=sys.stderr)
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
