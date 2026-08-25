from __future__ import annotations

import io
import re
import ssl
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "brands" / "logos"
UA = {"User-Agent": "Mozilla/5.0"}
CTX = ssl._create_unverified_context()


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=45, context=CTX) as r:
        return r.read()


def main() -> None:
    html = fetch("https://www.sokoglam.com/collections/dr-althea").decode("utf-8", "ignore")
    urls = sorted(set(re.findall(r"https?://[^\"'\s>]+", html)))
    for u in urls:
        low = u.lower()
        if "althea" not in low:
            continue
        if not any(ext in low for ext in (".png", ".svg", ".jpg", ".webp")):
            continue
        print(u[:200])

    # Collection banner may include logo — download and crop center wordmark area if needed
    banner = "https://sokoglam.com/cdn/shop/collections/Dr_Althea_Collection_Page_a410344a-39dd-4c72-9b0d-95375073c5d3.png"
    data = fetch(banner)
    print("banner", len(data), data[:8])
    try:
        from PIL import Image

        im = Image.open(io.BytesIO(data)).convert("RGBA")
        print("size", im.size)
        # Save full for inspection; also try a center crop of likely logo band
        w, h = im.size
        # Often logos sit in upper/middle of collection art — save resized full as interim
        # Prefer detecting near-white/near-black text region — keep a square center crop
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        crop = im.crop((left, top, left + side, top + side))
        crop.thumbnail((640, 640), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        crop.save(buf, format="PNG", optimize=True)
        for old in OUT.glob("dr-althea.*"):
            old.unlink()
        (OUT / "dr-althea.png").write_bytes(buf.getvalue())
        print("saved cropped", len(buf.getvalue()))
        # Also dump original resized for visual QA
        im2 = im.copy()
        im2.thumbnail((800, 800), Image.Resampling.LANCZOS)
        buf2 = io.BytesIO()
        im2.save(buf2, format="PNG", optimize=True)
        (OUT / "_dr-althea-banner-preview.png").write_bytes(buf2.getvalue())
        print("preview", len(buf2.getvalue()))
    except Exception as e:
        print("pil", e)
        for old in OUT.glob("dr-althea.*"):
            old.unlink()
        (OUT / "dr-althea.png").write_bytes(data)


if __name__ == "__main__":
    main()
