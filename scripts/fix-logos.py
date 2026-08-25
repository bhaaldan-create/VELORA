"""Fix bad/missing logos with precise official CDN URLs."""
from __future__ import annotations

import re
import ssl
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "brands" / "logos"
UA = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}
CTX = ssl.create_default_context()


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=45, context=CTX) as r:
        return r.read()


def save(slug: str, data: bytes, ext: str) -> None:
    for old in OUT.glob(f"{slug}.*"):
        old.unlink()
    (OUT / f"{slug}.{ext}").write_bytes(data)
    print(f"SAVED {slug}.{ext} ({len(data)})")


def html(url: str) -> str:
    return fetch(url).decode("utf-8", "ignore")


def shopify_header_logo(home: str) -> str | None:
    page = html(home)
    # Shopify header logo patterns
    pats = [
        r'class="[^"]*header__heading-logo[^"]*"[^>]*src="([^"]+)"',
        r'src="([^"]+)"[^>]*class="[^"]*header__heading-logo[^"]*"',
        r'id="logo"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"',
        r'<img[^>]+(?:alt="[^"]*COSRX[^"]*"|alt="COSRX")[^>]+src="([^"]+)"',
        r'<img[^>]+src="([^"]+)"[^>]+(?:alt="[^"]*COSRX[^"]*"|alt="COSRX")',
        r'cdn/shop/files/[^"\']+\.(?:png|svg|webp|jpg)',
    ]
    for pat in pats:
        m = re.search(pat, page, re.I)
        if m:
            if m.lastindex:
                u = m.group(1)
            else:
                u = m.group(0)
                if not u.startswith("http"):
                    u = "https://www.cosrx.com/" + u.lstrip("/")
            if u.startswith("//"):
                u = "https:" + u
            # bump size
            if "cdn/shop" in u:
                u = re.sub(r"width=\d+", "width=800", u)
                u = re.sub(r"height=\d+", "height=800", u)
                if "width=" not in u:
                    u += ("&" if "?" in u else "?") + "width=800"
            return u
    # dump candidate shopify file urls containing logo-ish names
    files = re.findall(
        r'https?://[^"\']+/cdn/shop/files/[^"\']+\.(?:png|svg|webp)', page, re.I
    )
    for f in files:
        low = f.lower()
        if any(k in low for k in ("logo", "wordmark", "brand", "header")):
            return f
    print("candidates sample:")
    for f in files[:15]:
        print(" ", f[:140])
    return None


def main() -> None:
    # COSRX — delete Apple Pay mistake
    for old in OUT.glob("cosrx.*"):
        print("remove", old.name, old.stat().st_size)
        old.unlink()

    u = shopify_header_logo("https://www.cosrx.com/")
    print("cosrx url", u)
    if u:
        data = fetch(u)
        ext = "svg" if ".svg" in u.lower() or b"<svg" in data[:300].lower() else "png"
        if len(data) > 800:
            save("cosrx", data, ext)
        else:
            print("too small", len(data))

    # Prefer larger COSRX header asset if known pattern from earlier scrape
    # Retry explicit file id seen in scrape
    if not list(OUT.glob("cosrx.*")):
        trial = "https://www.cosrx.com/cdn/shop/files/2_8fb22a57-55f6-4130-8683-29b321768c3c.png?v=1725424736&width=600"
        try:
            data = fetch(trial)
            print("trial", len(data))
            if len(data) > 1000:
                save("cosrx", data, "png")
        except Exception as e:
            print("trial fail", e)

    # SHEGLAM — try larger ltwebstatic / site logo
    try:
        page = html("https://www.sheglam.com/")
        imgs = re.findall(r'src="(https?://[^"]+\.(?:png|svg|webp))"', page, re.I)
        logos = [i for i in imgs if "logo" in i.lower() or "sheglam" in i.lower()]
        print("sheglam candidates", logos[:8])
        for i in logos[:5]:
            try:
                data = fetch(i)
                print(" she", len(data), i[:100])
                if len(data) > 2000:
                    save("sheglam", data, "png" if ".png" in i.lower() else "svg")
                    break
            except Exception as e:
                print(" she fail", e)
    except Exception as e:
        print("sheglam page", e)

    # SEAPURI — try oliveyoung / yesstyle / brand social; also yesstyle brand page
    seapuri_tries = [
        "https://image.oliveyoung.com/uploads/images/goods/10/0000/0017/S000000174465.png",
        "https://www.seapuri.co.kr",
    ]
    for t in seapuri_tries:
        print("seapuri try", t)
        try:
            if t.endswith(".png"):
                data = fetch(t)
                print(" ", len(data))
            else:
                page = html(t)
                imgs = re.findall(
                    r'(?:src|href)="([^"]*(?:logo|Logo)[^"]*\.(?:png|svg|jpg))"',
                    page,
                    re.I,
                )
                print("  imgs", imgs[:6])
                for i in imgs[:4]:
                    if i.startswith("//"):
                        i = "https:" + i
                    elif i.startswith("/"):
                        i = urllib.parse.urljoin(t, i)
                    data = fetch(i)
                    if len(data) > 1500:
                        save("seapuri", data, "png")
                        break
        except Exception as e:
            print(" ", e)

    # Numbuzin — cafe24 share image may be product; try header logo
    try:
        page = html("https://www.numbuzin.com/")
        imgs = re.findall(
            r'src="([^"]+)"',
            page,
            re.I,
        )
        logoish = [
            i
            for i in imgs
            if any(k in i.lower() for k in ("logo", "brand", "upload"))
            and i.lower().endswith((".png", ".svg", ".webp", ".jpg"))
        ]
        print("numbuzin logoish", logoish[:10])
        for i in logoish[:8]:
            if i.startswith("//"):
                i = "https:" + i
            elif i.startswith("/"):
                i = "https://www.numbuzin.com" + i
            try:
                data = fetch(i)
                print(" num", len(data), i[:110])
                # Prefer smaller logo-ish files over huge product OG images when name has logo
                if "logo" in i.lower() and len(data) > 1500:
                    save("numbuzin", data, "png" if ".png" in i.lower() else "jpg")
                    break
            except Exception as e:
                print(" num fail", e)
    except Exception as e:
        print("numbuzin", e)


if __name__ == "__main__":
    import urllib.parse

    main()
