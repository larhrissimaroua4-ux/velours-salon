"""Découpe une vidéo en images WebP pour une animation pilotée par le scroll.

usage : python3 tools/build_frames.py <video.mp4> <dossier> DX0 DY0 DX1 DY1 MX0 MX1
  DX0 DY0 DX1 DY1 : cadre paysage pour ordinateur (exclut le filigrane)
  MX0 MX1         : bande portrait pour téléphone (toute la hauteur)
Produit desktop/NNN.webp (toutes les images), mobile/NNN.webp (une sur deux)
et frames.json ({ desktop: {count, width, height}, mobile: {...} }).
"""
import json
import sys
from pathlib import Path

import cv2
from PIL import Image

QUALITY = 68


def main():
    video, out = sys.argv[1], Path(sys.argv[2])
    dx0, dy0, dx1, dy1, mx0, mx1 = map(int, sys.argv[3:9])
    capture = cv2.VideoCapture(video)
    frames = []
    while True:
        ok, frame = capture.read()
        if not ok:
            break
        frames.append(Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)))
    meta = {}
    for sub, box, picks in (
        ('desktop', (dx0, dy0, dx1, dy1), list(range(len(frames)))),
        ('mobile', (mx0, 0, mx1, frames[0].height), sorted(set(list(range(0, len(frames), 2)) + [len(frames) - 1]))),
    ):
        folder = out / sub
        folder.mkdir(parents=True, exist_ok=True)
        for old in folder.glob('*.webp'):
            old.unlink()
        for rank, i in enumerate(picks):
            frames[i].crop(box).save(folder / f'{rank:03d}.webp', quality=QUALITY, method=6)
        meta[sub] = {'count': len(picks), 'width': box[2] - box[0], 'height': box[3] - box[1]}
    (out / 'frames.json').write_text(json.dumps(meta))
    print(meta)


if __name__ == '__main__':
    main()
