"""Prépare la photo d'une arche : recadrage au format 0.68, deux tailles WebP.

usage : python3 tools/build_service_image.py <photo> <nom>   (ex. visage)
Produit public/images/services/<nom>.webp (900 px) et <nom>-sm.webp (560 px).
"""
import sys
from pathlib import Path

from PIL import Image

RATIO = 0.68


def main():
    source, name = sys.argv[1], sys.argv[2]
    image = Image.open(source).convert('RGB')
    w, h = image.size
    if w / h > RATIO:
        nw = round(h * RATIO)
        image = image.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = round(w / RATIO)
        image = image.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    out = Path('public/images/services')
    out.mkdir(parents=True, exist_ok=True)
    for suffix, width in (('', 900), ('-sm', 560)):
        width = min(width, image.width)
        image.resize((width, round(width / RATIO)), Image.LANCZOS).save(out / f'{name}{suffix}.webp', quality=80, method=6)
    print(name, image.size)


if __name__ == '__main__':
    main()
