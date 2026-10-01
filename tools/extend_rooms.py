"""
Make the room plates tall enough to cover a widescreen viewport.

The generated interiors are 1584x672 (2.36:1). Bent onto the arc, a plate that
wide is angularly shorter than the camera's vertical field of view, so the top
and bottom edges of the geometry swing into frame as black bands. Cropping the
width instead would hide the objects the hotspots are pinned to.

So we grow the plate vertically to 1584x1000 (1.58:1) by mirroring the top and
bottom strips outward, blurring them heavily and dropping their brightness.
The photographic content is untouched in the middle; the extensions read as
ceiling shadow and floor falloff, and the shader vignette lands on top of them
anyway.

Re-runnable: works from the *-src.jpg originals, which it creates on first run.

    python3 tools/extend_rooms.py
"""

from PIL import Image, ImageFilter, ImageEnhance
from pathlib import Path

ROOMS = Path("public/images/rooms")
TARGET_H = 1000
STRIP = 150          # how many source rows get mirrored outward
BLUR = 26


def extend(path: Path) -> None:
    src_path = path.with_name(path.stem + "-src.jpg")

    # Keep a pristine original so the script can be run again safely.
    if src_path.exists():
        im = Image.open(src_path).convert("RGB")
    else:
        im = Image.open(path).convert("RGB")
        im.save(src_path, quality=96)

    w, h = im.size
    if h >= TARGET_H:
        print(f"  {path.name}: already {w}x{h}, skipping")
        return

    pad_top = (TARGET_H - h) // 2
    pad_bottom = TARGET_H - h - pad_top

    canvas = Image.new("RGB", (w, TARGET_H))
    canvas.paste(im, (0, pad_top))

    # --- top: mirror the first STRIP rows upward, then soften and darken ---
    top = im.crop((0, 0, w, min(STRIP, h))).transpose(Image.FLIP_TOP_BOTTOM)
    top = top.resize((w, pad_top), Image.LANCZOS)
    top = top.filter(ImageFilter.GaussianBlur(BLUR))
    top = ImageEnhance.Brightness(top).enhance(0.45)
    canvas.paste(top, (0, 0))

    # --- bottom: same treatment, a touch brighter (floors catch light) ---
    bot = im.crop((0, h - min(STRIP, h), w, h)).transpose(Image.FLIP_TOP_BOTTOM)
    bot = bot.resize((w, pad_bottom), Image.LANCZOS)
    bot = bot.filter(ImageFilter.GaussianBlur(BLUR))
    bot = ImageEnhance.Brightness(bot).enhance(0.55)
    canvas.paste(bot, (0, pad_top + h))

    # Feather the two seams so the joins are not readable as hard lines.
    feather = 46
    for y0, y1 in ((pad_top - feather, pad_top + feather),
                   (pad_top + h - feather, pad_top + h + feather)):
        band = canvas.crop((0, y0, w, y1))
        canvas.paste(band.filter(ImageFilter.GaussianBlur(7)), (0, y0))

    canvas.save(path, quality=94)
    print(f"  {path.name}: {w}x{h} -> {w}x{TARGET_H}  (pad {pad_top}/{pad_bottom})")
    return pad_top


if __name__ == "__main__":
    print("Extending room plates:")
    pad = None
    for name in ("vestibule", "parlour", "atelier"):
        p = ROOMS / f"{name}.jpg"
        if p.exists():
            pad = extend(p) or pad
        else:
            print(f"  !! missing {p}")

    if pad:
        print(f"\nHotspot v remap:  v_new = (v_old * 672 + {pad}) / {TARGET_H}")
