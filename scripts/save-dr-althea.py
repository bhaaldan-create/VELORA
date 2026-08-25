import ssl
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "brands" / "logos"
UA = {"User-Agent": "Mozilla/5.0"}
CTX = ssl._create_unverified_context()

URLS = [
    "https://doctoraltheaglobal.com/cdn/shop/files/Dr.althea_logo_nb_2.png?v=1786697882",
    "https://doctoraltheaglobal.com/cdn/shop/files/Dr.althea_logo_nb_2.png?width=600&v=1786697882",
    "https://www.meifanau.com/cdn/shop/files/154fc15e505df501d25826708c949f41_400x.png?v=1778480393",
]


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=45, context=CTX) as r:
        return r.read()


def main() -> None:
    for u in URLS:
        try:
            d = fetch(u)
            print(u, len(d), d[:8])
            if d.startswith(b"\x89PNG") and len(d) > 1000:
                for old in OUT.glob("dr-althea.*"):
                    old.unlink()
                (OUT / "dr-althea.png").write_bytes(d)
                print("SAVED")
                return
        except Exception as e:
            print("fail", e)


if __name__ == "__main__":
    main()
