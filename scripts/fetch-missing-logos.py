"""Fetch remaining missing brand logos from official storefronts / Wikimedia."""
from __future__ import annotations

import json
import re
import ssl
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "brands" / "logos"
UA = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,image/*,*/*",
}
CTX = ssl.create_default_context()

MISSING = {
    "cosrx": "https://www.cosrx.com/",
    "numbuzin": "https://www.numbuzin.com/",
    "sheglam": "https://www.sheglam.com/",
    "beauty-of-joseon": "https://beautyofjoseon.com/",
    "seapuri": "https://seapuri.com/",
}

# Extra direct candidates (Shopify CDN / brand assets)
DIRECT = {
    "cosrx": [
        "https://www.cosrx.com/cdn/shop/files/COSRX_Logo.png",
        "https://www.cosrx.com/cdn/shop/files/cosrx-logo.png",
    ],
    "beauty-of-joseon": [
        "https://beautyofjoseon.com/cdn/shop/files/logo.png",
        "https://beautyofjoseon.com/cdn/shop/files/BOJ_Logo.png",
    ],
    "numbuzin": [
        "https://www.numbuzin.com/cdn/shop/files/numbuzin_logo.png",
    ],
    "sheglam": [
        "https://www.sheglam.com/cdn/shop/files/SHEGLAM_logo.png",
        "https://www.sheglam.com/cdn/shop/files/sheglam-logo.png",
    ],
    "seapuri": [
        "https://seapuri.com/cdn/shop/files/logo.png",
    ],
}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40, context=CTX) as r:
        return r.read()


def save(slug: str, data: bytes, ext: str) -> None:
    for old in OUT.glob(f"{slug}.*"):
        old.unlink()
    path = OUT / f"{slug}.{ext}"
    path.write_bytes(data)
    print(f"SAVED {path.name} ({len(data)} bytes)")


def guess_ext(url: str, data: bytes) -> str:
    low = url.lower()
    if ".svg" in low or b"<svg" in data[:400].lower():
        return "svg"
    if ".webp" in low or data[:4] == b"RIFF":
        return "webp"
    if ".jpg" in low or ".jpeg" in low or data[:2] == b"\xff\xd8":
        return "jpg"
    return "png"


def abs_url(base: str, u: str) -> str | None:
    u = u.strip().strip("'\"")
    if not u or u.startswith("data:"):
        return None
    if u.startswith("//"):
        return "https:" + u
    return urllib.parse.urljoin(base, u)


def scrape_logo_urls(home: str, html: str) -> list[str]:
    found: list[str] = []
    patterns = [
        r'(?:src|href|content)=["\']([^"\']*(?:logo|Logo|brand)[^"\']*\.(?:svg|png|webp|jpe?g))["\']',
        r'url\(([^)]*(?:logo|Logo)[^)]*)\)',
        r'property=["\']og:image["\']\s+content=["\']([^"\']+)["\']',
        r'content=["\']([^"\']+)["\']\s+property=["\']og:image["\']',
        r'rel=["\'](?:icon|apple-touch-icon)["\'][^>]*href=["\']([^"\']+)["\']',
        r'href=["\']([^"\']+)["\'][^>]*rel=["\'](?:icon|apple-touch-icon)["\']',
    ]
    for pat in patterns:
        for m in re.findall(pat, html, flags=re.I):
            au = abs_url(home, m)
            if au and au not in found:
                found.append(au)
    return found


def commons_search(query: str) -> str | None:
    api = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
        {
            "action": "query",
            "list": "search",
            "srnamespace": 6,
            "srlimit": 8,
            "srsearch": query,
            "format": "json",
        }
    )
    data = json.loads(fetch(api).decode("utf-8"))
    for hit in data.get("query", {}).get("search", []):
        title = hit["title"]
        api2 = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
            {
                "action": "query",
                "titles": title,
                "prop": "imageinfo",
                "iiprop": "url|size",
                "format": "json",
            }
        )
        time.sleep(1.0)
        d2 = json.loads(fetch(api2).decode("utf-8"))
        for page in d2.get("query", {}).get("pages", {}).values():
            info = (page.get("imageinfo") or [None])[0]
            if info and info.get("url") and info.get("size", 0) > 2000:
                return info["url"]
    return None


def try_urls(slug: str, urls: list[str], min_size: int = 2000) -> bool:
    for u in urls:
        try:
            data = fetch(u)
            print(f"  try {len(data)} {u[:110]}")
            if len(data) < min_size:
                continue
            save(slug, data, guess_ext(u, data))
            return True
        except Exception as e:
            print(f"  fail {e}")
    return False


def main() -> None:
    for slug, home in MISSING.items():
        print("===", slug)
        # skip if good file already exists
        existing = list(OUT.glob(f"{slug}.*"))
        if existing and existing[0].stat().st_size >= 2000:
            print("have", existing[0].name, existing[0].stat().st_size)
            continue

        if try_urls(slug, DIRECT.get(slug, [])):
            continue

        try:
            html = fetch(home).decode("utf-8", "ignore")
            urls = scrape_logo_urls(home, html)
            print(f"  scraped {len(urls)}")
            for u in urls[:12]:
                print("   -", u[:120])
            if try_urls(slug, urls, min_size=1500):
                continue
        except Exception as e:
            print("  scrape fail", e)

        time.sleep(1.2)
        try:
            q = {
                "cosrx": "COSRX logo",
                "numbuzin": "Numbuzin logo",
                "sheglam": "SHEGLAM logo",
                "beauty-of-joseon": "Beauty of Joseon logo",
                "seapuri": "Seapuri logo",
            }[slug]
            url = commons_search(q)
            print("  commons", url)
            if url and try_urls(slug, [url], min_size=1500):
                continue
        except Exception as e:
            print("  commons fail", e)

        print("STILL FAIL", slug)


if __name__ == "__main__":
    main()
