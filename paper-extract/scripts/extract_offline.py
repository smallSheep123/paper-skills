"""paper-mcp 兜底提取脚本（给 AI 会话用，正常情况请优先用 MCP 工具）。

背景：系统常开着代理（如 Clash，http_proxy=127.0.0.1:7897）且未设 NO_PROXY。
paper-mcp 调用的 mineru CLI 访问本地 MinerU 服务(127.0.0.1:8000)时，
请求被代理拦截返回 502，导致提取报 "Failed to query MinerU API health"。

本脚本只在【本进程内】把 localhost/127.0.0.1 加入 NO_PROXY 绕开代理，
不修改任何系统环境变量、不修改任何配置文件，进程退出即失效。

用法（必须用 paper-mcp 环境的 python 运行）：
  D:/Programming/Python/envs/paper-mcp/python.exe extract_offline.py <文件路径> [--force] [--no-lib] [--no-copy]

  --force    忽略论文库哈希缓存，强制重新提取
  --no-lib   只提取 markdown 不入库（extract_to_markdown，产物存到 <源文件名>_md/ 目录）
  --no-copy  入库后不把 paper.md 拷贝到源文件同目录

输出：一行 JSON（paper_id / title / md 路径 / abstract 等），直接解析即可。
"""

import os

# --- 进程内代理豁免：必须发生在 import paper_mcp 之前 ---
_PROXY_HOSTS = "localhost,127.0.0.1"
for _key in ("NO_PROXY", "no_proxy"):
    _cur = os.environ.get(_key, "").strip()
    os.environ[_key] = f"{_cur},{_PROXY_HOSTS}" if _cur else _PROXY_HOSTS
os.environ.setdefault("PAPER_MCP_CONFIG", r"D:\Learning\paper知识库\project\tool\config.yaml")

import argparse  # noqa: E402
import json  # noqa: E402
import shutil  # noqa: E402
from pathlib import Path  # noqa: E402


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("path", help="PDF/DOCX/PPTX/XLSX/图片 的绝对路径")
    ap.add_argument("--force", action="store_true", help="忽略库内缓存强制重提取")
    ap.add_argument("--no-lib", action="store_true", help="只提取 markdown，不入库")
    ap.add_argument("--no-copy", action="store_true", help="入库后不拷贝 md 到源文件同目录")
    args = ap.parse_args()

    from paper_mcp.server import build_context

    ctx = build_context()

    if args.no_lib:
        from paper_mcp.tools.extract_to_markdown import extract_to_markdown

        save_dir = str(Path(args.path).parent / (Path(args.path).stem + "_md"))
        res = extract_to_markdown(ctx, args.path, save_dir=save_dir)
        print(json.dumps(res, ensure_ascii=False, default=str))
        return

    from paper_mcp.tools.extract_pdf import extract_pdf

    res = extract_pdf(ctx, args.path, force=args.force)
    out = dict(res)
    paper_id = res.get("paper_id")
    paper = ctx.store.get_paper(paper_id) if paper_id else None
    if paper and paper.md_path:
        md_abs = os.path.join(str(ctx.config.data_dir), paper.md_path)
        out["lib_md"] = md_abs
        if not args.no_copy:
            dst = str(Path(args.path).with_suffix(".md"))
            shutil.copy2(md_abs, dst)
            out["copied_md"] = dst
    print(json.dumps(out, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
