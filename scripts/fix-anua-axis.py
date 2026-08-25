"""Replace incorrect Anua / Axis-Y logos from official storefronts."""
from __future__ import annotations

import re
import ssl
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "brands" / "logos"
UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0"
}
CTX = ssl._create_unverified_context()


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=45, context=CTX) as r:
        return r.read()


def save(slug: str, data: bytes, ext: str) -> None:
    for old in OUT.glob(f"{slug}.*"):
        old.unlink()
    (OUT / f"{slug}.{ext}").write_bytes(data)
    print(f"SAVED {slug}.{ext} ({len(data)})")


def ok(d: bytes) -> bool:
    return len(d) > 800 and (
        d.startswith(b"\x89PNG") or d[:2] == b"\xff\xd8" or b"<svg" in d[:300].lower()
    )


def scrape(home: str) -> list[str]:
    html = fetch(home).decode("utf-8", "ignore")
    urls = re.findall(
        r"""(?:src|href|content)=["']([^"']+\.(?:png|svg|webp|jpe?g))["']""",
        html,
        flags=re.I,
    )
    out = []
    for u in urls:
        if "logo" not in u.lower() and "brand" not in u.lower():
            # still keep header logo files
            if "header" not in u.lower() and "wordmark" not in u.lower():
                continue
        if u.startswith("//"):
            u = "https:" + u
        elif u.startswith("/"):
            u = home.rstrip("/") + u
        out.append(u)
    # shopify files named logo
    for u in re.findall(
        r"https?://[^\"']+/cdn/shop/files/[^\"']+\.(?:png|svg|webp)", html, flags=re.I
    ):
        if any(k in u.lower() for k in ("logo", "anua", "axis", "wordmark", "brand")):
            out.append(u)
    return list(dict.fromkeys(out))


def main() -> None:
    # Direct known-good candidates
    direct = {
        "anua": [
            "https://anuaskin.com/cdn/shop/files/anua_logo.png",
            "https://anuaskin.com/cdn/shop/files/ANUA_logo.png",
            "https://www.anuaskin.com/cdn/shop/files/logo.png",
        ],
        "axis-y": [
            "https://axis-y.com/cdn/shop/files/axis-y-logo.png",
            "https://axis-y.com/cdn/shop/files/AXIS-Y_logo.png",
            "https://www.axis-y.com/cdn/shop/files/logo.png",
        ],
    }
    homes = {
        "anua": ["https://anuaskin.com/", "https://www.anuaskin.com/"],
        "axis-y": ["https://axis-y.com/", "https://www.axis-y.com/"],
    }

    for slug in ("anua", "axis-y"):
        print("===", slug)
        urls = list(direct[slug])
        for home in homes[slug]:
            try:
                urls.extend(scrape(home))
            except Exception as e:
                print(" scrape", home, e)
        print(" candidates", urls[:15])
        for u in urls:
            try:
                d = fetch(u)
                print(" try", len(d), u[:110])
                if not ok(d):
                    continue
                # reject huge chart-like SVGs
                if b"<svg" in d[:200].lower() and len(d) > 50_000:
                    print("  skip oversized svg")
                    continue
                if b"syphilis" in d.lower() or b"chlamydia" in d.lower():
                    print("  skip chart")
                    continue
                if b"BUNDESVERBAND" in d or b"Hilfsorganisation" in d:
                    print("  skip wrong anuas")
                    continue
                ext = "svg" if b"<svg" in d[:200].lower() else "png"
                if d[:2] == b"\xff\xd8":
                    ext = "jpg"
                save(slug, d, ext)
                break
            except Exception as e:
                print(" fail", e)


if __name__ == "__main__":
    main()
