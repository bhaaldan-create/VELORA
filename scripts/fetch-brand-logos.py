"""Fetch official brand logos via Wikimedia Commons + Clearbit domain logos.
Skips files that already exist. Rate-limits Commons to avoid 429.
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "brands" / "logos"
OUT.mkdir(parents=True, exist_ok=True)

UA = {
    "User-Agent": "VELORABeautyStore/1.0 (ecommerce brand assets; contact@velorabeautyiq.me)"
}

# slug -> (commons file title OR None, clearbit/domain hostname)
BRANDS: dict[str, tuple[str | None, str]] = {
    "anua": ("Anua logo", "anuaskin.com"),
    "axis-y": ("Axis-Y logo", "axis-y.com"),
    "beauty-of-joseon": ("Beauty of Joseon logo", "beautyofjoseon.com"),
    "cosrx": ("COSRX logo", "cosrx.com"),
    "dr-althea": ("Dr. Althea logo", "draltheakorea.com"),
    "im-from": ("I'm From logo", "imfrom.net"),
    "mary-may": ("Mary&May logo", "marynmay.com"),
    "medicube": ("Medicube logo", "medicube.us"),
    "numbuzin": ("Numbuzin logo", "numbuzin.com"),
    "purito-seoul": ("Purito logo", "purito.com"),
    "skin1004": ("SKIN1004 logo", "skin1004.com"),
    "seapuri": ("Seapuri logo", "seapuri.com"),
    "seoul-1988": ("Seoul 1988 logo", "seoul1988.kr"),
    "tocobo": ("Tocobo logo", "tocobo.com"),
    "anastasia-beverly-hills": (
        "Anastasia Beverly Hills logo",
        "anastasiabeverlyhills.com",
    ),
    "estee-lauder": ("Estée Lauder Companies logo.svg", "esteelauder.com"),
    "la-girl": ("L.A. Girl logo", "lagirlusa.com"),
    "maybelline": (None, "maybelline.com"),  # already have svg
    "nars": (None, "narscosmetics.com"),
    "nyx": (None, "nyxcosmetics.com"),
    "ofra": ("OFRA Cosmetics logo", "ofracosmetics.com"),
    "sol-de-janeiro": ("Sol de Janeiro logo", "soldejaneiro.com"),
    "too-faced": ("Too Faced logo", "toofaced.com"),
    "bourjois": ("Bourjois logo", "bourjois.com"),
    "chanel": (None, "chanel.com"),
    "clarins": ("Clarins logo.svg", "clarins.com"),
    "dior": (None, "dior.com"),
    "givenchy": ("Givenchy logo.svg", "givenchybeauty.com"),
    "guerlain": (None, "guerlain.com"),
    "loreal": (None, "loreal.com"),  # use existing loreal-paris.svg
    "lancome": (None, "lancome-usa.com"),
    "ysl": (None, "yslbeautyus.com"),
    "catrice": ("Catrice logo", "catrice.eu"),
    "essence": ("essence cosmetics logo", "essence.eu"),
    "charlotte-tilbury": (None, "charlottetilbury.com"),
    "huda-beauty": ("Huda Beauty logo", "hudabeauty.com"),
    "sheglam": ("SHEGLAM logo", "sheglam.com"),
    "mac": ("MAC Cosmetics logo.svg", "maccosmetics.com"),
    "inglot": ("Inglot Cosmetics logo", "inglotcosmetics.com"),
}


def fetch(url: str, timeout: int = 35) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def existing(slug: str) -> Path | None:
    for p in OUT.glob(f"{slug}.*"):
        if p.suffix.lower() in {".svg", ".png", ".webp", ".jpg", ".jpeg"}:
            return p
    # special case L'Oréal
    if slug == "loreal":
        p = OUT / "loreal-paris.svg"
        if p.exists():
            return p
    return None


def commons_file_url(title: str) -> str | None:
    if not title.startswith("File:"):
        title = f"File:{title}"
    api = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
        {
            "action": "query",
            "titles": title,
            "prop": "imageinfo",
            "iiprop": "url|mime|size",
            "format": "json",
        }
    )
    data = json.loads(fetch(api).decode("utf-8"))
    for page in data.get("query", {}).get("pages", {}).values():
        info = (page.get("imageinfo") or [None])[0]
        if info and info.get("url"):
            return info["url"]
    return None


def commons_search(query: str) -> str | None:
    api = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
        {
            "action": "query",
            "list": "search",
            "srnamespace": 6,
            "srlimit": 5,
            "srsearch": query,
            "format": "json",
        }
    )
    data = json.loads(fetch(api).decode("utf-8"))
    for hit in data.get("query", {}).get("search", []):
        title = hit["title"]
        # prefer svg / logo-ish
        low = title.lower()
        if "logo" in low or low.endswith(".svg"):
            url = commons_file_url(title)
            if url:
                return url
    # fallback first hit
    hits = data.get("query", {}).get("search", [])
    if hits:
        return commons_file_url(hits[0]["title"])
    return None


def guess_ext(url: str, data: bytes) -> str:
    low = url.lower().split("?")[0]
    if low.endswith(".svg") or b"<svg" in data[:500].lower():
        return "svg"
    if low.endswith(".webp") or data[:4] == b"RIFF":
        return "webp"
    if low.endswith((".jpg", ".jpeg")) or data[:2] == b"\xff\xd8":
        return "jpg"
    return "png"


def save(slug: str, data: bytes, ext: str) -> Path:
    path = OUT / f"{slug}.{ext}"
    path.write_bytes(data)
    return path


def try_clearbit(domain: str) -> bytes | None:
    url = f"https://logo.clearbit.com/{domain}"
    try:
        data = fetch(url)
        if len(data) < 400:
            return None
        return data
    except Exception:
        return None


def try_google_hd(domain: str) -> bytes | None:
    # Larger favicon as last resort (often 128–256)
    url = f"https://www.google.com/s2/favicons?domain={domain}&sz=256"
    try:
        data = fetch(url)
        if len(data) < 800:
            return None
        return data
    except Exception:
        return None


def main() -> None:
    ok = 0
    fail: list[tuple[str, str]] = []

    for i, (slug, (commons_q, domain)) in enumerate(BRANDS.items()):
        ex = existing(slug)
        if ex:
            print(f"skip {slug} -> {ex.name}")
            ok += 1
            continue

        got = False
        # 1) Commons
        if commons_q:
            try:
                time.sleep(1.6)
                url = None
                if commons_q.endswith((".svg", ".png", ".jpg")):
                    url = commons_file_url(commons_q)
                if not url:
                    time.sleep(0.6)
                    url = commons_search(commons_q if "logo" in commons_q.lower() else f"{commons_q} logo")
                if url:
                    data = fetch(url)
                    ext = guess_ext(url, data)
                    path = save(slug, data, ext)
                    print(f"OK commons {slug} {path.name} ({len(data)})")
                    ok += 1
                    got = True
            except urllib.error.HTTPError as e:
                print(f"commons HTTP {slug} {e.code}")
            except Exception as e:
                print(f"commons ERR {slug} {e}")

        if got:
            continue

        # 2) Clearbit
        time.sleep(0.35)
        data = try_clearbit(domain)
        if data:
            ext = guess_ext(domain, data)
            path = save(slug, data, ext)
            print(f"OK clearbit {slug} {path.name} ({len(data)})")
            ok += 1
            continue

        # 3) Google HD favicon last resort
        data = try_google_hd(domain)
        if data:
            path = save(slug, data, "png")
            print(f"OK favicon {slug} {path.name} ({len(data)})")
            ok += 1
            continue

        fail.append((slug, domain))
        print(f"FAIL {slug}")

    print("---")
    print(f"ok={ok} fail={len(fail)}")
    for s, d in fail:
        print(" ", s, d)


if __name__ == "__main__":
    main()
