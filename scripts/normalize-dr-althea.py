"""Convert Dr. Althea header logo (often light-on-dark) to dark-on-transparent for light cards."""
from __future__ import annotations

import io
from pathlib import Path

from PIL import Image

SRC = Path(__file__).resolve().parents[1] / "public" / "brands" / "logos" / "dr-althea.png"


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    pixels = im.load()
    w, h = im.size
    # Sample corners to detect bg
    samples = [pixels[2, 2], pixels[w - 3, 2], pixels[2, h - 3], pixels[w - 3, h - 3]]
    avg = tuple(sum(c[i] for c in samples) // 4 for i in range(4))
    print("corner avg", avg, "size", w, h)

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            lum = (r + g + b) / 3
            # Dark background + light logo → keep logo as near-black with alpha from lightness
            if avg[0] < 40:  # dark bg
                if lum < 30:
                    op[x, y] = (0, 0, 0, 0)
                else:
                    # light strokes become dark ink
                    alpha = min(255, int((lum / 255) * 255 * 1.05))
                    op[x, y] = (17, 17, 17, alpha)
            else:
                # already dark-on-light: punch near-white to transparent
                if lum > 245:
                    op[x, y] = (0, 0, 0, 0)
                else:
                    op[x, y] = (r, g, b, a)

    # Trim empty margins
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    # Pad a little
    pad = 8
    padded = Image.new("RGBA", (out.width + pad * 2, out.height + pad * 2), (0, 0, 0, 0))
    padded.paste(out, (pad, pad), out)
    padded.save(SRC, format="PNG", optimize=True)
    print("saved", SRC.stat().st_size, padded.size)


if __name__ == "__main__":
    main()
