from __future__ import annotations

import re
import ssl
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "brands" / "logos"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0"}
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


def ok_img(d: bytes) -> bool:
    return (
        d.startswith(b"\x89PNG\r\n\x1a\n")
        or d[:2] == b"\xff\xd8"
        or b"<svg" in d[:400].lower()
    ) and len(d) > 800


def main() -> None:
    # Sol de Janeiro official wordmark
    u = "https://soldejaneiro.com/cdn/shop/files/SoldeJaneiro-logo.png?v=1738144454"
    d = fetch(u)
    assert ok_img(d), d[:20]
    save("sol-de-janeiro", d, "png")

    # Catrice — try commons API search then brand site
    import json
    import time
    import urllib.parse

    api = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
        {
            "action": "query",
            "list": "search",
            "srnamespace": 6,
            "srlimit": 5,
            "srsearch": "Catrice cosmetics logo",
            "format": "json",
        }
    )
    try:
        data = json.loads(fetch(api).decode())
        for hit in data.get("query", {}).get("search", []):
            title = hit["title"]
            api2 = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
                {
                    "action": "query",
                    "titles": title,
                    "prop": "imageinfo",
                    "iiprop": "url|size|mime",
                    "format": "json",
                }
            )
            time.sleep(1)
            d2 = json.loads(fetch(api2).decode())
            for page in d2.get("query", {}).get("pages", {}).values():
                info = (page.get("imageinfo") or [None])[0]
                if not info:
                    continue
                url = info["url"]
                mime = info.get("mime", "")
                if "pdf" in mime:
                    continue
                blob = fetch(url)
                print("catrice commons", title, len(blob), mime)
                if ok_img(blob) and not blob.startswith(b"%PDF"):
                    ext = "svg" if "svg" in mime else "png"
                    save("catrice", blob, ext)
                    break
            if list(OUT.glob("catrice.*")):
                break
    except Exception as e:
        print("catrice commons", e)

    if not list(OUT.glob("catrice.*")):
        for home in ["https://www.catrice.eu/en", "https://www.catrice.eu/"]:
            try:
                html = fetch(home).decode("utf-8", "ignore")
                urls = re.findall(
                    r"""(?:src|href)=["']([^"']+\.(?:svg|png|webp))["']""",
                    html,
                    flags=re.I,
                )
                for u2 in urls:
                    if "logo" not in u2.lower():
                        continue
                    if u2.startswith("/"):
                        u2 = "https://www.catrice.eu" + u2
                    blob = fetch(u2)
                    print("catrice site", len(blob), u2[:100])
                    if ok_img(blob):
                        save("catrice", blob, "svg" if b"<svg" in blob[:200].lower() else "png")
                        break
                if list(OUT.glob("catrice.*")):
                    break
            except Exception as e:
                print("catrice site", e)

    # Dr. Althea via oliveyoung / yesstyle / shopify mirrors
    for u2 in [
        "https://cdn.shopify.com/s/files/1/0270/2090/files/dr-althea-logo.png",
        "https://draltheausa.com/cdn/shop/files/Dr_Althea_Logo.png",
        "https://www.draltheausa.com/cdn/shop/files/logo.png",
    ]:
        try:
            blob = fetch(u2)
            print("althea", len(blob), u2)
            if ok_img(blob):
                save("dr-althea", blob, "png")
                break
        except Exception as e:
            print("althea", e)

    if not list(OUT.glob("dr-althea.*")):
        try:
            html = fetch("https://draltheausa.com/").decode("utf-8", "ignore")
            for u2 in re.findall(
                r"https?://[^\"']+/cdn/shop/files/[^\"']+\.(?:png|svg|webp)",
                html,
                flags=re.I,
            ):
                if "logo" in u2.lower() or "althea" in u2.lower():
                    blob = fetch(u2)
                    print("althea scrape", len(blob), u2[:100])
                    if ok_img(blob) and len(blob) < 500_000:
                        save("dr-althea", blob, "png")
                        break
        except Exception as e:
            print("althea home", e)

    # Seapuri — parse saved html more aggressively
    html_path = Path(__file__).resolve().parents[1] / "scripts" / "_seapuri.html"
    if not html_path.exists() or html_path.stat().st_size < 1000:
        html_path.write_bytes(fetch("https://www.seapuri.co.kr/"))
    text = html_path.read_text(encoding="utf-8", errors="ignore")
    # Cafe24 / shop logos often in background or img
    for pat in [
        r"""url\((['"]?)([^)'"]*logo[^)'"]*)\1\)""",
        r"""(?:src|href|content)=["']([^"']*logo[^"']*)["']""",
        r"""(?:src|href)=["']([^"']*seapuri[^"']*\.(?:png|svg|jpg|webp))["']""",
    ]:
        for m in re.finditer(pat, text, flags=re.I):
            u2 = m.group(m.lastindex)
            print("seapuri hit", u2[:140])
            if u2.startswith("//"):
                u2 = "https:" + u2
            elif u2.startswith("/"):
                u2 = "https://www.seapuri.co.kr" + u2
            if not u2.startswith("http"):
                continue
            try:
                blob = fetch(u2)
                print(" ", len(blob), blob[:12])
                if ok_img(blob):
                    ext = "svg" if b"<svg" in blob[:200].lower() else "png"
                    if blob[:2] == b"\xff\xd8":
                        ext = "jpg"
                    save("seapuri", blob, ext)
                    return
            except Exception as e:
                print(" ", e)


if __name__ == "__main__":
    main()
