"""Sync logo extensions in shop-brands.ts + finish missing assets."""
from __future__ import annotations

import re
import ssl
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "brands" / "logos"
DATA = ROOT / "src" / "data" / "shop-brands.ts"
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


def resolve_logo(slug: str) -> str | None:
    if slug == "loreal":
        p = OUT / "loreal-paris.svg"
        if p.exists():
            return "/brands/logos/loreal-paris.svg"
    for ext in (".svg", ".png", ".webp", ".jpg", ".jpeg"):
        p = OUT / f"{slug}{ext}"
        if p.exists() and p.stat().st_size > 500:
            return f"/brands/logos/{slug}{ext}"
    return None


def finish_missing() -> None:
    # Seapuri from official KR site
    if not resolve_logo("seapuri"):
        html = fetch("https://www.seapuri.co.kr/").decode("utf-8", "ignore")
        imgs = re.findall(
            r"""(?:src|href|content)=["']([^"']+)["']""",
            html,
            flags=re.I,
        )
        cands = []
        for i in imgs:
            low = i.lower()
            if any(k in low for k in ("logo", "brand", "seapuri")) and any(
                ext in low for ext in (".png", ".svg", ".jpg", ".webp", ".gif")
            ):
                if i.startswith("//"):
                    i = "https:" + i
                elif i.startswith("/"):
                    i = "https://www.seapuri.co.kr" + i
                cands.append(i)
        print("seapuri candidates:")
        for c in cands[:30]:
            print(" ", c[:160])
        for c in cands:
            try:
                d = fetch(c)
                print(" try", len(d), c[:100])
                if len(d) > 1500 and b"<html" not in d[:40].lower():
                    ext = "svg" if ".svg" in c.lower() or b"<svg" in d[:200].lower() else "png"
                    if d[:2] == b"\xff\xd8":
                        ext = "jpg"
                    save("seapuri", d, ext)
                    break
            except Exception as e:
                print(" fail", e)

    # SHEGLAM via browser-known CDN / seeklogo raw if available
    if not resolve_logo("sheglam") or (
        resolve_logo("sheglam") and (OUT / "sheglam.png").exists() and (OUT / "sheglam.png").stat().st_size < 3000
    ):
        tries = [
            "https://www.sheglam.com/cdn/shop/files/SHEGLAM_Logo_Black.png",
            "https://img.ltwebstatic.com/images3_ccc/2024/01/01/sheglam-logo.png",
            # Wikipedia / commons unlikely
        ]
        # scrape sheglam for any svg/png logo in page source via urllib
        try:
            page = fetch("https://www.sheglam.com/").decode("utf-8", "ignore")
            for m in re.findall(r"https?://[^\"'\s>]+\.(?:svg|png|webp)", page, flags=re.I):
                if "logo" in m.lower() or "sheglam" in m.lower() and "product" not in m.lower():
                    tries.append(m)
        except Exception as e:
            print("sheglam scrape", e)
        for u in tries:
            try:
                d = fetch(u)
                print("sheglam try", len(d), u[:110])
                if len(d) > 2000 and b"<html" not in d[:40].lower():
                    save("sheglam", d, "png")
                    break
            except Exception as e:
                print("sheglam fail", e)

    # Numbuzin — keep jpg if large enough; else try brand og cropped isn't ideal
    cur = resolve_logo("numbuzin")
    print("numbuzin current", cur)
    if cur:
        p = OUT / Path(cur).name
        print(" size", p.stat().st_size)


def sync_ts() -> None:
    text = DATA.read_text(encoding="utf-8")

    def repl(m: re.Match[str]) -> str:
        # match logo: "/brands/logos/SLUG.ext"
        full = m.group(0)
        path = m.group(1)
        slug = Path(path).stem
        if slug == "loreal-paris":
            return full  # keep
        resolved = resolve_logo(slug if slug != "loreal-paris" else "loreal")
        # For loreal entry the path is loreal-paris already
        if path.startswith("loreal"):
            return full
        if not resolved:
            print("NO FILE for", slug)
            return full
        return f'logo: "{resolved}"'

    # Also handle slug field nearby — replace by scanning each brand block
    # Simpler: for each file on disk, replace logo path for that slug
    new = text
    for f in OUT.iterdir():
        if f.suffix.lower() not in {".svg", ".png", ".jpg", ".jpeg", ".webp"}:
            continue
        slug = f.stem
        if slug in {"velora", "cerave", "vichy", "garnier", "neutrogena", "clinique", "the-ordinary", "la-roche-posay", "loreal-paris"}:
            continue
        new_path = f"/brands/logos/{f.name}"
        # replace any existing logo path for this slug
        new2, n = re.subn(
            rf'logo:\s*"/brands/logos/{re.escape(slug)}\.[a-zA-Z0-9]+"',
            f'logo: "{new_path}"',
            new,
        )
        if n:
            print(f"sync {slug} -> {f.name} ({n})")
            new = new2
        else:
            # maybe missing from data
            pass

    # loreal stays loreal-paris.svg
    DATA.write_text(new, encoding="utf-8")
    print("shop-brands.ts updated")


def main() -> None:
    finish_missing()
    sync_ts()
    # verify all 39
    text = DATA.read_text(encoding="utf-8")
    slugs = re.findall(r'slug:\s*"([^"]+)"', text)
    print("brands in data", len(slugs))
    missing = []
    for slug in slugs:
        if slug == "loreal":
            ok = (OUT / "loreal-paris.svg").exists()
        else:
            ok = bool(resolve_logo(slug))
        if not ok:
            missing.append(slug)
        else:
            path = resolve_logo("loreal" if slug == "loreal" else slug)
            # size
            rel = path.replace("/brands/logos/", "") if path else ""
            p = OUT / rel
            print(f"OK {slug:28} {rel:40} {p.stat().st_size if p.exists() else 0}")
    print("MISSING", missing)


if __name__ == "__main__":
    main()
