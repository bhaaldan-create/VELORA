from __future__ import annotations

import json
import re
import ssl
import time
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "brands" / "logos"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0"}
CTX = ssl._create_unverified_context()


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=45, context=CTX) as r:
        return r.read()


def save(data: bytes, ext: str) -> None:
    for old in OUT.glob("dr-althea.*"):
        old.unlink()
    (OUT / f"dr-althea.{ext}").write_bytes(data)
    print(f"SAVED dr-althea.{ext} ({len(data)})")


def main() -> None:
    api = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
        {
            "action": "query",
            "list": "search",
            "srnamespace": 6,
            "srlimit": 10,
            "srsearch": "Althea logo",
            "format": "json",
        }
    )
    try:
        data = json.loads(fetch(api).decode())
        print("wm", [h["title"] for h in data.get("query", {}).get("search", [])])
    except Exception as e:
        print("wm fail", e)

    homes = [
        "https://www.sokoglam.com/collections/dr-althea",
        "https://www.iherb.com/c/dr-althea",
        "https://www.ulta.com/brand/dr-althea",
        "https://www.cultbeauty.com/brands/dr.-althea.list",
    ]
    for home in homes:
        try:
            html = fetch(home).decode("utf-8", "ignore")
            print("home", home, len(html))
            urls = re.findall(
                r"https?://[^\"'\s>]+\.(?:png|svg|jpg|webp)",
                html,
                flags=re.I,
            )
            for u in urls:
                if "logo" not in u.lower() and "althea" not in u.lower():
                    continue
                if "product" in u.lower() and "logo" not in u.lower():
                    continue
                try:
                    d = fetch(u)
                    print(" ", len(d), u[:120])
                    if len(d) > 1500 and (
                        d.startswith(b"\x89PNG")
                        or d[:2] == b"\xff\xd8"
                        or b"<svg" in d[:200].lower()
                    ):
                        # Prefer filenames with logo
                        if "logo" in u.lower() or (40 < len(d) < 200_000):
                            ext = "svg" if b"<svg" in d[:200].lower() else "png"
                            save(d, ext)
                            return
                except Exception as e:
                    print("  fail", e)
        except Exception as e:
            print("home fail", home, e)

    # Instagram CDN / press sometimes
    for u in [
        "https://www.dralthea.com/cdn/shop/files/DrAlthea_Logo_Black.png",
        "https://cdn.shopify.com/s/files/1/0558/2881/files/dr-althea-logo.png",
    ]:
        try:
            d = fetch(u)
            print("direct", len(d), u)
            if d.startswith(b"\x89PNG") and len(d) > 1500:
                save(d, "png")
                return
        except Exception as e:
            print("direct fail", e)


if __name__ == "__main__":
    main()
