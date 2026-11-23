"""Photo du miroir de rendez-vous pour un soin.

Usage : python3 tools/build_booking_image.py <photo.jpg|png> <visage|cheveux|ongles|maquillage>

Recadre la photo au format du miroir ovale (portrait, 1 × 1,38, centrée),
puis écrit public/images/booking/<soin>.webp (640 px) et <soin>-sm.webp (420 px).
"""

import sys
from pathlib import Path

from PIL import Image

RATIO = 1.38
SERVICES = {'visage', 'cheveux', 'ongles', 'maquillage'}


def main():
    if len(sys.argv) != 3 or sys.argv[2] not in SERVICES:
        sys.exit(__doc__)
    source, service = Path(sys.argv[1]), sys.argv[2]
    image = Image.open(source).convert('RGB')
    w, h = image.size
    if h / w > RATIO:
        crop_h = round(w * RATIO)
        top = (h - crop_h) // 2
        image = image.crop((0, top, w, top + crop_h))
    else:
        crop_w = round(h / RATIO)
        left = (w - crop_w) // 2
        image = image.crop((left, 0, left + crop_w, h))
    out = Path(__file__).resolve().parent.parent / 'public' / 'images' / 'booking'
    for width, suffix in ((640, ''), (420, '-sm')):
        resized = image.resize((width, round(width * RATIO)), Image.LANCZOS)
        resized.save(out / f'{service}{suffix}.webp', quality=80, method=6)
    print(f'{service} : {out / service}.webp')


if __name__ == '__main__':
    main()
