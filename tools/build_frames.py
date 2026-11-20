"""Découpe une vidéo en images WebP pour une animation pilotée par le scroll.

usage : python3 tools/build_frames.py <video.mp4> <dossier de sortie> X0 X1
  X0 X1 : bande verticale gardée (recadrage portrait, exclut le filigrane)
Produit desktop/NNN.webp (toutes les images), mobile/NNN.webp (une sur deux)
et frames.json ({ width, height, desktop: {count}, mobile: {count} }).
"""
import json
import sys
from pathlib import Path

import cv2
from PIL import Image

QUALITY = 72


def main():
    video, out, x0, x1 = sys.argv[1], Path(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
    capture = cv2.VideoCapture(video)
    frames = []
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        frames.append(Image.fromarray(cv2.cvtColor(frame[:, x0:x1], cv2.COLOR_BGR2RGB)))
    for sub in ('desktop', 'mobile'):
        (out / sub).mkdir(parents=True, exist_ok=True)
        for old in (out / sub).glob('*.webp'):
            old.unlink()
    for i, image in enumerate(frames):
        image.save(out / 'desktop' / f'{i:03d}.webp', quality=QUALITY, method=6)
    mobile = frames[::2]
    if (len(frames) - 1) % 2:
        mobile.append(frames[-1])
    for i, image in enumerate(mobile):
        image.resize((image.width * 3 // 4, image.height * 3 // 4), Image.LANCZOS).save(out / 'mobile' / f'{i:03d}.webp', quality=QUALITY, method=6)
    width, height = frames[0].size
    meta = {'width': width, 'height': height, 'desktop': {'count': len(frames)}, 'mobile': {'count': len(mobile)}}
    (out / 'frames.json').write_text(json.dumps(meta))
    print(meta)


if __name__ == '__main__':
    main()
