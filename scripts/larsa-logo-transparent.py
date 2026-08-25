"""Remove solid black background from LARSA logo → transparent PNG."""
from pathlib import Path

import numpy as np
from PIL import Image

src = Path(__file__).resolve().parents[1] / "public" / "brand" / "larsa-logo.png"
img = Image.open(src).convert("RGBA")
arr = np.array(img).astype(np.float32)
r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
dark = np.maximum(np.maximum(r, g), b)
alpha = arr[:, :, 3].copy()
alpha[dark < 28] = 0
soft = (dark >= 28) & (dark < 55)
t = (dark[soft] - 28) / (55 - 28)
alpha[soft] = alpha[soft] * t
arr[:, :, 3] = alpha
out = Image.fromarray(arr.astype(np.uint8), "RGBA")
bbox = out.getbbox()
if bbox:
    out = out.crop(bbox)
out.save(src, optimize=True)
check = np.array(out)
print("size", out.size, "corner_alpha", int(check[0, 0, 3]), "opaque", int((check[:, :, 3] > 200).sum()))
