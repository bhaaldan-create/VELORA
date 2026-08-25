"""Replace oversized / tiny logos with sane official assets; fetch Seapuri."""
from __future__ import annotations

import io
import re
import ssl
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "brands" / "logos"
UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}
CTX = ssl._create_unverified_context()


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60, context=CTX) as r:
        return r.read()


def save(slug: str, data: bytes, ext: str) -> None:
    for old in OUT.glob(f"{slug}.*"):
        old.unlink()
    (OUT / f"{slug}.{ext}").write_bytes(data)
    print(f"SAVED {slug}.{ext} ({len(data)})")


def shrink_image(data: bytes, max_side: int = 800, quality: int = 85) -> tuple[bytes, str]:
    try:
        from PIL import Image

        im = Image.open(io.BytesIO(data))
        im = im.convert("RGBA") if im.mode in ("P", "LA") else im
        w, h = im.size
        scale = min(1.0, max_side / max(w, h))
        if scale < 1:
            im = im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        # Prefer PNG for logos with transparency
        if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
            im.save(buf, format="PNG", optimize=True)
            return buf.getvalue(), "png"
        im = im.convert("RGB")
        im.save(buf, format="JPEG", quality=quality, optimize=True)
        return buf.getvalue(), "jpg"
    except Exception as e:
        print("pillow fail", e)
        return data, "png"


def main() -> None:
    print("--- size audit ---")
    for f in sorted(OUT.iterdir()):
        if f.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp", ".svg"}:
            continue
        sz = f.stat().st_size
        flag = ""
        if sz > 500_000:
            flag = " HUGE"
        elif sz < 1200:
            flag = " TINY"
        print(f"{f.name:45} {sz:10}{flag}")

    # Shrink huge raster logos in place
    for f in list(OUT.iterdir()):
        if f.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
            continue
        if f.stat().st_size < 400_000:
            continue
        print("shrinking", f.name)
        data, ext = shrink_image(f.read_bytes(), max_side=720, quality=82)
        slug = f.stem
        save(slug, data, ext)

    # Seapuri — dump more candidate patterns from homepage
    html = fetch("https://www.seapuri.co.kr/").decode("utf-8", "ignore")
    Path("scripts/_seapuri.html").write_text(html[:200000], encoding="utf-8")
    # look for image paths broadly
    urls = set(
        re.findall(
            r"""https?://[^"'\\\s>]+\.(?:png|svg|jpg|jpeg|webp)""",
            html,
            flags=re.I,
        )
    )
    urls |= set(
        re.findall(
            r"""["'](/[^"']+\.(?:png|svg|jpg|jpeg|webp))["']""",
            html,
            flags=re.I,
        )
    )
    print("seapuri absolute imgs", len(urls))
    ranked = []
    for u in urls:
        score = 0
        low = u.lower()
        if "logo" in low:
            score += 5
        if "seapuri" in low:
            score += 3
        if "brand" in low:
            score += 2
        if "icon" in low:
            score += 1
        if score:
            ranked.append((score, u))
    ranked.sort(reverse=True)
    for score, u in ranked[:20]:
        print(score, u[:140])
        try:
            full = u if u.startswith("http") else "https://www.seapuri.co.kr" + u
            d = fetch(full)
            print(" ", len(d))
            if 1500 < len(d) < 2_000_000 and b"<html" not in d[:50].lower():
                if len(d) > 400_000:
                    d, ext = shrink_image(d)
                else:
                    ext = "svg" if ".svg" in full.lower() or b"<svg" in d[:200].lower() else "png"
                    if d[:2] == b"\xff\xd8":
                        ext = "jpg"
                save("seapuri", d, ext)
                break
        except Exception as e:
            print(" ", e)

    # Tiny logos: try unavatar / apple-touch from brand sites
    tiny_fix = {
        "medicube": [
            "https://medicube.us/cdn/shop/files/medicube_logo.png",
            "https://medicube.us/cdn/shop/files/logo.png",
        ],
        "ofra": [
            "https://ofracosmetics.com/cdn/shop/files/OFRA_Logo.png",
            "https://ofracosmetics.com/cdn/shop/files/ofra-logo.png",
        ],
        "sheglam": [],
        "cosrx": [
            "https://www.cosrx.com/cdn/shop/files/COSRX_150x.png?v=1658313147",
        ],
    }

    # sheglam from page markers
    try:
        she = fetch("https://www.sheglam.com/").decode("utf-8", "ignore")
        for m in re.findall(r"https?://[^\"'\s>]+\.(?:png|svg|webp)", she, flags=re.I):
            if "logo" in m.lower():
                tiny_fix["sheglam"].append(m)
        print("sheglam logo urls", tiny_fix["sheglam"][:10])
    except Exception as e:
        print("she scrape", e)

    for slug, urls in tiny_fix.items():
        cur = list(OUT.glob(f"{slug}.*"))
        if cur and cur[0].stat().st_size >= 2000 and slug != "sheglam":
            continue
        for u in urls:
            try:
                d = fetch(u)
                print(slug, len(d), u[:100])
                if len(d) > 1500 and b"<html" not in d[:40].lower():
                    if len(d) > 400_000:
                        d, ext = shrink_image(d)
                    else:
                        ext = "png"
                    save(slug, d, ext)
                    break
            except Exception as e:
                print(slug, "fail", e)


if __name__ == "__main__":
    main()
