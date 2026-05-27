#!/usr/bin/env python3
"""
Suno Bulk Downloader (Phase 1 helper)
Takes a suno_urls.txt (one URL per line) produced by the console extractor
and downloads everything with nice names, progress, and sidecar metadata.

Usage:
    python download.py --urls suno_urls.txt --out ./my-suno-library
"""
import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse, unquote

try:
    import httpx
except ImportError:
    print("Please: pip install httpx tqdm")
    sys.exit(1)

try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False


def sanitize(name: str) -> str:
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name[:120] or "untitled"


def extract_title_from_url(url: str) -> str:
    """Suno URLs often contain the song title in the path."""
    try:
        path = unquote(urlparse(url).path)
        # Common patterns: /.../song-title--id.mp3 or similar
        filename = Path(path).stem
        # Remove Suno hash suffixes
        title = re.sub(r'--[a-z0-9]+$', '', filename, flags=re.I)
        title = title.replace('_', ' ').replace('-', ' ').strip()
        return sanitize(title).title()
    except Exception:
        return "Suno Track"


def download_one(client: httpx.Client, url: str, out_dir: Path, idx: int) -> dict:
    title = extract_title_from_url(url)
    ext = Path(urlparse(url).path).suffix or ".mp3"
    safe_name = f"{idx:04d} - {title}{ext}"
    dest = out_dir / safe_name

    if dest.exists() and dest.stat().st_size > 128 * 1024:
        return {"url": url, "file": str(dest), "skipped": True}

    try:
        with client.stream("GET", url, timeout=60, follow_redirects=True) as r:
            r.raise_for_status()
            total = int(r.headers.get("content-length", 0))
            dest.parent.mkdir(parents=True, exist_ok=True)

            with open(dest, "wb") as f:
                if HAS_TQDM and total:
                    with tqdm(total=total, unit="B", unit_scale=True, desc=safe_name[:50], leave=False) as bar:
                        for chunk in r.iter_bytes(64 * 1024):
                            f.write(chunk)
                            bar.update(len(chunk))
                else:
                    for chunk in r.iter_bytes(64 * 1024):
                        f.write(chunk)

        # Sidecar metadata (easy to enrich later)
        meta = {
            "original_url": url,
            "title_guess": title,
            "downloaded_as": safe_name,
        }
        (dest.with_suffix(".json")).write_text(json.dumps(meta, indent=2))

        return {"url": url, "file": str(dest), "ok": True}
    except Exception as e:
        return {"url": url, "error": str(e)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--urls", required=True, help="Path to suno_urls.txt")
    parser.add_argument("--out", required=True, help="Output directory")
    parser.add_argument("--limit", type=int, default=0, help="Max files (0 = all)")
    args = parser.parse_args()

    urls = [u.strip() for u in Path(args.urls).read_text().splitlines() if u.strip().startswith("http")]
    if args.limit:
        urls = urls[:args.limit]

    out = Path(args.out).expanduser().resolve()
    out.mkdir(parents=True, exist_ok=True)

    print(f"Downloading {len(urls)} files → {out}")

    with httpx.Client(headers={"User-Agent": "SunoRadio-Import/1.0"}) as client:
        for i, url in enumerate(urls, 1):
            result = download_one(client, url, out, i)
            if result.get("skipped"):
                print(f"[{i}/{len(urls)}] SKIP  {Path(result['file']).name}")
            elif result.get("ok"):
                print(f"[{i}/{len(urls)}] OK    {Path(result['file']).name}")
            else:
                print(f"[{i}/{len(urls)}] FAIL  {result.get('error')}")

    print("\nDone. You can now point suno-radio at this folder.")
    print("Tip: docker compose down && docker compose up -d   then use the RESCAN button.")


if __name__ == "__main__":
    main()
