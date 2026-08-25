import ssl
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "brands" / "logos"
UA = {"User-Agent": "Mozilla/5.0"}
CTX = ssl._create_unverified_context()

URLS = {
    "axis-y": "https://www.axis-y.com/cdn/shop/files/AXIS-Y_LogoAv1_854c7e2a-6d70-42ea-ab76-112b44644fc6.png?v=1741832265&width=600",
    "anua": "https://anua.com/cdn/shop/files/PNG_RGB_Primary_logo_ver2_2_255e833c-0e91-42df-96ca-0b7377ba7a8a.png?v=1779429699&width=800",
}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=45, context=CTX) as r:
        return r.read()


def save(slug: str, data: bytes, ext: str) -> None:
    for old in OUT.glob(f"{slug}.*"):
        old.unlink()
    (OUT / f"{slug}.{ext}").write_bytes(data)
    print(f"SAVED {slug}.{ext} ({len(data)})")


def main() -> None:
    for slug, url in URLS.items():
        d = fetch(url)
        print(slug, len(d), d[:8])
        assert d.startswith(b"\x89PNG") and len(d) > 1500
        save(slug, d, "png")


if __name__ == "__main__":
    main()
