"""Prépare une animation « avant → après » à partir de deux photos identiques
(générées par édition, même cadrage) : les zones qui changent sont détectées,
puis chaque zone reçoit une rampe 0 → 1 le long de son axe principal.

usage : python3 tools/build_reveal.py <avant.jpg> <après.jpg> <nom> [sens] [ordre] [seuil]
  sens  : down | up | left | right   (sens du geste dans chaque zone, défaut down)
  ordre : x | -x | y | -y            (ordre des zones, défaut x)
  seuil : écart de couleur Lab minimal (défaut 30)

Produit dans public/images/acts/ :
  <nom>-avant(.webp|-sm.webp), <nom>-apres(.webp|-sm.webp)  photos recadrées au format de l'arche
  <nom>-ramp.png   R = position le long du geste, G = numéro de zone, B = masque doux
  <nom>.json       { width, height, zones: [{ from:[x,y], to:[x,y], width }] }  (repère de la photo)
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

RATIO = 0.68
OUT = Path('public/images/acts')


def crop(img):
    h, w = img.shape[:2]
    if w / h > RATIO:
        nw = round(h * RATIO)
        x = (w - nw) // 2
        return img[:, x:x + nw]
    nh = round(w / RATIO)
    y = (h - nh) // 2
    return img[y:y + nh]


def main():
    before, after, name = sys.argv[1], sys.argv[2], sys.argv[3]
    sens = sys.argv[4] if len(sys.argv) > 4 else 'down'
    order = sys.argv[5] if len(sys.argv) > 5 else 'x'
    threshold = float(sys.argv[6]) if len(sys.argv) > 6 else 30
    a = crop(cv2.imread(before))
    b = crop(cv2.imread(after))
    if a.shape != b.shape:
        b = cv2.resize(b, (a.shape[1], a.shape[0]), interpolation=cv2.INTER_AREA)
    h, w = a.shape[:2]

    la = cv2.cvtColor(a, cv2.COLOR_BGR2LAB).astype(np.float32)
    lb = cv2.cvtColor(b, cv2.COLOR_BGR2LAB).astype(np.float32)
    diff = np.sqrt(((la - lb) ** 2).sum(2))
    hard = cv2.morphologyEx((diff > threshold).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    hard = cv2.morphologyEx(hard, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    n, labels, stats, centers = cv2.connectedComponentsWithStats(hard)
    zones = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 0.0004 * w * h]
    key = {'x': lambda i: centers[i][0], '-x': lambda i: -centers[i][0], 'y': lambda i: centers[i][1], '-y': lambda i: -centers[i][1]}[order]
    zones.sort(key=key)

    want = {'down': (0, 1), 'up': (0, -1), 'right': (1, 0), 'left': (-1, 0)}[sens]
    ramp = np.zeros((h, w), np.float32)
    zone_id = np.zeros((h, w), np.uint8)
    soft = np.clip((diff - threshold * 0.5) / threshold, 0, 1)
    alpha = np.zeros((h, w), np.float32)
    meta = []
    for k, i in enumerate(zones, start=1):
        region = cv2.dilate((labels == i).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
        ys, xs = np.nonzero(region)
        pts = np.stack([xs, ys], 1).astype(np.float32)
        c = pts.mean(0)
        _, vecs = np.linalg.eigh(np.cov((pts - c).T))
        axis = vecs[:, -1]
        if axis @ np.array(want, np.float32) < 0:
            axis = -axis
        proj = (pts - c) @ axis
        lo, hi = np.percentile(proj, 1), np.percentile(proj, 99)
        s = np.clip((proj - lo) / max(hi - lo, 1), 0, 1)
        ramp[ys, xs] = s
        zone_id[ys, xs] = k
        alpha[ys, xs] = soft[ys, xs]
        perp = (pts - c) @ np.array([-axis[1], axis[0]])
        meta.append({'from': [float(v) for v in c + axis * lo], 'to': [float(v) for v in c + axis * hi], 'width': float(np.percentile(perp, 95) - np.percentile(perp, 5))})

    alpha = cv2.GaussianBlur(alpha, (0, 0), 1.2)
    OUT.mkdir(parents=True, exist_ok=True)
    rgb = np.dstack([(ramp * 255).round(), zone_id, (alpha * 255).round()]).astype(np.uint8)
    # la rampe est lue en JS : demi-résolution suffit, sans interpolation entre zones
    Image.fromarray(rgb).resize((w // 2, h // 2), Image.NEAREST).save(OUT / f'{name}-ramp.png', optimize=True)
    for label, img in (('avant', a), ('apres', b)):
        pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        pil.save(OUT / f'{name}-{label}.webp', quality=82, method=6)
        pil.resize((560, round(560 / RATIO)), Image.LANCZOS).save(OUT / f'{name}-{label}-sm.webp', quality=82, method=6)
    (OUT / f'{name}.json').write_text(json.dumps({'width': w, 'height': h, 'zones': meta}))
    print(name, w, h, len(meta), 'zones')


if __name__ == '__main__':
    main()
