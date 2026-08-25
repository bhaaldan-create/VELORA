"""Fetch remaining logos via Brandfetch / official CDN / SSL-unverified sites."""
from __future__ import annotations

import re
import ssl
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "brands" / "logos"
UA = {"User-Agent": "Mozilla/5.0 (compatible; VELORA/1.0)"}
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


def looks_like_image(data: bytes) -> bool:
    if len(data) < 800:
        return False
    head = data[:80].lower()
    if b"<html" in head or b"<!doctype" in head or b"{" == data[:1]:
        return False
    return True


def main() -> None:
    # COSRX official header asset (larger than 150x if available)
    for u in [
        "https://www.cosrx.com/cdn/shop/files/COSRX.png?v=1658313147",
        "https://www.cosrx.com/cdn/shop/files/COSRX_150x.png?v=1658313147",
        "https://cdn.brandfetch.io/cosrx.com/w/800/h/400/logo",
    ]:
        try:
            d = fetch(u)
            print("cosrx", len(d), u[:90])
            if looks_like_image(d):
                save("cosrx", d, "png")
                break
        except Exception as e:
            print("cosrx fail", e)

    for slug, domain in [
        ("numbuzin", "numbuzin.com"),
        ("sheglam", "sheglam.com"),
        ("seapuri", "seapuri.com"),
    ]:
        urls = [
            f"https://cdn.brandfetch.io/{domain}/w/800/h/400/logo",
            f"https://cdn.brandfetch.io/{domain}/w/512/h/512/icon",
            f"https://unavatar.io/{domain}",
            f"https://logo.clearbit.com/{domain}",
        ]
        ok = False
        for u in urls:
            try:
                d = fetch(u)
                print(slug, len(d), u[:100])
                if looks_like_image(d) and len(d) > 2000:
                    ext = "png"
                    if b"<svg" in d[:300].lower():
                        ext = "svg"
                    save(slug, d, ext)
                    ok = True
                    break
            except Exception as e:
                print(slug, "fail", e)
        if not ok:
            print("MISSING", slug)

    # Numbuzin cafe24 SVG (possible wordmark)
    u = (
        "https://ecimg.cafe24img.com/pg1613b12558170092/numbuzin0828/web/upload/"
        "appfiles/ZaReJam3QiELznoZeGGkMG/38754ddaee7156da40184f6107fe970e.svg"
    )
    try:
        d = fetch(u)
        print("numbuzin svg bytes", len(d))
        print(d[:240])
        # keep only if current asset is missing/weak
        cur = list(OUT.glob("numbuzin.*"))
        if (not cur or cur[0].stat().st_size < 3000) and b"<svg" in d.lower() and len(d) > 400:
            save("numbuzin", d, "svg")
    except Exception as e:
        print("num svg", e)

    # Seapuri sites
    for home in [
        "https://www.seapuri.co.kr/",
        "https://seapuri.kr/",
        "http://www.seapuri.co.kr/",
    ]:
        try:
            page = fetch(home).decode("utf-8", "ignore")
            print("seapuri home ok", home, len(page))
            imgs = re.findall(
                r"""(?:src|href)=["']([^"']+\.(?:png|svg|jpg|webp))["']""",
                page,
                flags=re.I,
            )
            for i in imgs:
                if not any(k in i.lower() for k in ("logo", "brand", "seapuri")):
                    continue
                if i.startswith("//"):
                    i = "https:" + i
                elif i.startswith("/"):
                    i = home.rstrip("/") + i
                try:
                    d = fetch(i)
                    print(" seapuri img", len(d), i[:120])
                    if looks_like_image(d):
                        save("seapuri", d, "png" if ".png" in i.lower() else "svg")
                        return
                except Exception as e:
                    print(" seapuri img fail", e)
        except Exception as e:
            print("seapuri home fail", home, e)


if __name__ == "__main__":
    main()
