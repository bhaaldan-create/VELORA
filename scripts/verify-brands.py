from pathlib import Path
import re
OUT=Path("public/brands/logos")
DATA=Path("src/data/shop-brands.ts").read_text(encoding="utf-8")
slugs=re.findall(r"slug:\s*\"([^\"]+)\"", DATA)
logos=re.findall(r"logo:\s*\"([^\"]+)\"", DATA)
print("count", len(slugs), len(logos))
assert "velora" not in [s.lower() for s in slugs]
bad=[]
for path in logos:
  rel=path.replace("/brands/logos/","")
  p=OUT/rel
  if not p.exists():
    bad.append(("missing", path)); continue
  head=p.read_bytes()[:8]
  if head.startswith(b"%PDF"):
    bad.append(("pdf", path))
  if p.stat().st_size>1500000:
    bad.append(("huge", path, p.stat().st_size))
  if p.stat().st_size<400:
    bad.append(("tiny", path, p.stat().st_size))
print("bad", bad)
