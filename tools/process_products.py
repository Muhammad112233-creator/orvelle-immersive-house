"""
Turns the raw studio shots into the two layers the colourway viewer needs:

  <name>.png       transparent cut-out, full colour  (detail / overlay pass)
  <name>-lum.png   transparent cut-out, luminance    (multiply pass)

Tinting happens at runtime by multiplying a flat swatch colour through the
luminance layer, so every highlight, fold and stitch survives instead of
being flooded with a single hue.

The studio sweep is never actually pure white - it carries a soft vignette -
so the matte is measured relative to the background the photograph actually
has rather than against #ffffff.
"""
from PIL import Image, ImageFilter, ImageOps
from collections import deque
import numpy as np
import pathlib


def background_model(rgb):
    """Per-pixel estimate of the sweep, from a heavily blurred border-only view."""
    h, w, _ = rgb.shape
    edge = max(2, int(min(h, w) * 0.02))
    border = np.concatenate([
        rgb[:edge].reshape(-1, 3), rgb[-edge:].reshape(-1, 3),
        rgb[:, :edge].reshape(-1, 3), rgb[:, -edge:].reshape(-1, 3),
    ])
    return np.median(border, axis=0)


def flood_background(binary):
    """True where a background-ish pixel is reachable from the frame edge."""
    h, w = binary.shape
    seen = np.zeros_like(binary, dtype=bool)
    q = deque()

    def push(y, x):
        if binary[y, x] and not seen[y, x]:
            seen[y, x] = True
            q.append((y, x))

    for x in range(w):
        push(0, x); push(h - 1, x)
    for y in range(h):
        push(y, 0); push(y, w - 1)

    while q:
        y, x = q.popleft()
        if y > 0: push(y - 1, x)
        if y < h - 1: push(y + 1, x)
        if x > 0: push(y, x - 1)
        if x < w - 1: push(y, x + 1)
    return seen


def fill_small_regions(mask, max_fraction=0.004):
    """Returns `mask` with only its small connected components kept."""
    h, w = mask.shape
    limit = h * w * max_fraction
    out = np.zeros_like(mask)
    seen = np.zeros_like(mask)
    for sy in range(h):
        row = mask[sy]
        for sx in np.nonzero(row & ~seen[sy])[0]:
            q = deque([(sy, sx)])
            seen[sy, sx] = True
            cells = []
            while q:
                y, x = q.popleft()
                cells.append((y, x))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            if len(cells) <= limit:
                for y, x in cells:
                    out[y, x] = True
    return out


def cut_out(src, out_rgba, out_lum, tol=15.0, ramp=11.0, pad=0.05, feather=1.1):
    im = Image.open(src).convert('RGB')
    rgb = np.asarray(im).astype(np.float32)

    bg = background_model(rgb)
    diff = np.abs(rgb - bg).max(axis=2)

    alpha = np.clip((diff - tol) / ramp, 0.0, 1.0)

    looks_like_bg = alpha < 0.18
    outside = flood_background(looks_like_bg)

    # Enclosed background - the gap under a shoulder strap, say - is NOT part
    # of the product even though the edge flood cannot reach it. Only fill
    # holes small enough to be a highlight rather than a real opening.
    holes = looks_like_bg & ~outside
    if holes.any():
        filled = fill_small_regions(holes, max_fraction=0.004)
        alpha = np.where(filled, 1.0, alpha)

    alpha = np.where(outside, 0.0, alpha)

    alpha_img = Image.fromarray((alpha * 255).astype(np.uint8), 'L')
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(feather))

    bbox = alpha_img.point(lambda v: 255 if v > 28 else 0).getbbox()
    if bbox:
        px = int((bbox[2] - bbox[0]) * pad)
        py = int((bbox[3] - bbox[1]) * pad)
        bbox = (max(bbox[0] - px, 0), max(bbox[1] - py, 0),
                min(bbox[2] + px, im.width), min(bbox[3] + py, im.height))
        im = im.crop(bbox)
        alpha_img = alpha_img.crop(bbox)

    rgba = im.convert('RGBA')
    rgba.putalpha(alpha_img)
    rgba.save(out_rgba, optimize=True)

    lum = ImageOps.autocontrast(im.convert('L'), cutoff=(0.5, 0.5))
    lum = lum.point(lambda v: int(46 + v * 0.82))
    lum_rgba = Image.merge('RGB', (lum, lum, lum)).convert('RGBA')
    lum_rgba.putalpha(alpha_img)
    lum_rgba.save(out_lum, optimize=True)

    print(f'{pathlib.Path(out_rgba).name:22s} {rgba.size}  coverage '
          f'{(np.asarray(alpha_img) > 128).mean() * 100:.1f}%')


if __name__ == '__main__':
    products = pathlib.Path('public/images/products')
    for name in ('nocturne', 'solene'):
        cut_out(products / f'{name}-raw.png', products / f'{name}.png', products / f'{name}-lum.png')

    journal = pathlib.Path('public/images/journal')
    cut_out(journal / 'cover.png', journal / 'cover-cut.png', journal / 'cover-lum.png')
