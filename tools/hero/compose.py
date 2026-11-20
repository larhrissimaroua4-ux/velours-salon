"""Accueil VELOURS : remplace les flacons de sérum de la vidéo par des produits
de maquillage flottants (rouges à lèvres, vernis, pinceau).

1. la femme + le satin sont découpés (masques u2net_human_seg, plus grande forme) ;
2. fond refait : noir, halo chaud, bokeh doré ;
3. produits découpés (cut/*.png) derrière et devant elle, en mouvement lent ;
4. le flacon posé devant le satin est recouvert par un grand vernis qui suit sa trajectoire.

Outil de développement (hors site). Prérequis : un environnement Python avec
onnxruntime, opencv-python-headless, pillow, numpy<2, et les modèles
u2net_human_seg.onnx / isnet-general-use.onnx (releases du projet rembg) dans
tools/hero/models/. Depuis la racine du projet :
  python tools/hero/compose.py            → tools/hero/.cache/composed/NNN.png
  python3 tools/build_frames.py tools/hero/.cache/composed public/images/hero-satin 40 0 1170 636 402 892
"""
import sys
import numpy as np, cv2
from PIL import Image, ImageFilter

W, H = 1280, 720
VIDEO = 'assets-src/hero-satin.mp4'
CACHE = 'tools/hero/.cache'
PRODUCTS = 'assets-src/hero-products'
rng = np.random.default_rng(7)

def load_frames():
    c = cv2.VideoCapture(VIDEO); fr = []
    while True:
        ok, f = c.read()
        if not ok: break
        fr.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    return fr

def person_alpha(m):
    b = (m > 0.5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(b)
    big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    keep = cv2.dilate((lab == big).astype(np.uint8), np.ones((15, 15), np.uint8)).astype(np.float32)
    keep = cv2.GaussianBlur(keep, (0, 0), 4)
    return np.clip(m * keep, 0, 1)

# ---- trajectoire du flacon de premier plan (haut du bouchon, relevé à la main)
KEYS = [(0, 1060, 470, 95), (30, 960, 484, 100), (50, 920, 500, 115), (60, 890, 500, 120), (70, 856, 510, 140),
        (80, 824, 520, 150), (90, 770, 530, 160), (100, 724, 540, 170), (110, 664, 550, 180), (120, 616, 550, 185)]
def bottle_at(i):
    for (a, xa, ya, wa), (b, xb, yb, wb) in zip(KEYS, KEYS[1:]):
        if a <= i <= b:
            k = (i - a) / (b - a)
            return xa + (xb - xa) * k, ya + (yb - ya) * k, wa + (wb - wa) * k
    return KEYS[-1][1:]

# zones où un flacon touche la femme : (image, x0, x1, y0, y1) relevés à la main
TRACKS = [
    [(50, 300, 390, 330, 500), (70, 305, 395, 335, 510), (85, 315, 420, 340, 495), (100, 345, 455, 350, 530), (120, 385, 505, 355, 545)],
    [(50, 150, 370, 360, 720), (65, 140, 350, 370, 720), (75, 110, 340, 370, 720), (95, 60, 300, 370, 720), (120, 0, 250, 380, 720)],
]
def track_boxes(i):
    boxes = []
    for keys in TRACKS:
        if i < keys[0][0]: continue
        for a, b in zip(keys, keys[1:]):
            if a[0] <= i <= b[0]:
                k = (i - a[0]) / (b[0] - a[0])
                v = [int(a[j] + (b[j] - a[j]) * k) for j in range(1, 5)]
                boxes.append((max(0, v[0] - 12), min(W, v[1] + 12), max(0, v[2] - 12), min(H, v[3] + 12), min(1, (i - keys[0][0]) / 8)))
                break
    return boxes

# ---- produits flottants : (fichier, x, y, hauteur px, angle°, vx, vy, vrot, flou, lumière, plan)
ITEMS = [
    ('polish_cap', 850, 95, 230, -18, -0.15, -0.25, 0.10, 0, 1.0, 'back'),
    ('lip_stand', 1045, 205, 270, 22, -0.20, -0.30, -0.08, 0, 1.0, 'back'),
    ('brush', 360, 500, 210, -32, -0.05, -0.35, 0.06, 1.5, 0.95, 'back'),
    ('lip_right', 215, 140, 120, -14, 0.15, -0.20, 0.05, 2.5, 0.85, 'back'),
    ('lip_left', 1120, 560, 140, 8, -0.25, -0.25, -0.05, 3.5, 0.8, 'back'),
    ('polish_red', 150, 520, 230, 10, 0.20, -0.30, 0.05, 4, 0.75, 'back'),
    ('lip_stand', 448, 150, 150, -28, -0.05, -0.20, 0.07, 1.2, 0.9, 'back'),
]
CUTS = {}
def cut(name):
    if name not in CUTS:
        im = Image.open(f'{PRODUCTS}/{name}.png').convert('RGBA')
        a = np.asarray(im.getchannel('A')).astype(np.float32) / 255
        a = np.clip((a - 0.2) / 0.55, 0, 1)  # objets opaques : alpha net
        im.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
        CUTS[name] = im
    return CUTS[name]

def place(canvas, name, x, y, height, angle, blur, light):
    im = cut(name)
    s = height / im.height
    im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS).rotate(angle, expand=True, resample=Image.BICUBIC)
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    if light < 0.999:
        arr = np.asarray(im).astype(np.float32); arr[..., :3] *= light; im = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
    canvas.alpha_composite(im, (int(x - im.width / 2), int(y - im.height / 2)))

# ---- bokeh doré
BOKEH = [(rng.uniform(0, W), rng.uniform(0, H), rng.uniform(1.5, 9), rng.uniform(0.12, 0.55), rng.uniform(0.1, 0.5), rng.uniform(0, 6.28)) for _ in range(90)]
def background(i, light):
    bg = np.zeros((H, W, 3), np.float32); bg[:] = (9, 5, 6)
    yy, xx = np.mgrid[0:H, 0:W]
    glow = np.exp(-(((xx - 660) / 430) ** 2 + ((yy - 300) / 330) ** 2))
    bg += glow[..., None] * np.array([58, 32, 20], np.float32) * light
    layer = np.zeros((H, W), np.float32)
    for x, y, r, a, v, ph in BOKEH:
        cy = (y - v * i) % H
        cv2.circle(layer, (int(x), int(cy)), int(max(1, r)), a * (0.75 + 0.25 * np.sin(i * 0.12 + ph)), -1, lineType=cv2.LINE_AA)
    layer = cv2.GaussianBlur(layer, (0, 0), 1.6)
    bg += layer[..., None] * np.array([235, 180, 95], np.float32) * light
    return bg

def render(i, frame, m, light):
    out = Image.fromarray(background(i, light).clip(0, 255).astype(np.uint8)).convert('RGBA')
    zoom = 1 + 0.12 * i / 120  # la caméra avance : les objets grossissent un peu
    for name, x, y, h, ang, vx, vy, vr, blur, li, plane in ITEMS:
        bob = 6 * np.sin(i * 0.05 + x)
        cx = W / 2 + (x + vx * i - W / 2) * zoom
        cy = H / 2 + (y + vy * i + bob - H / 2) * zoom
        place(out, name, cx, cy, h * zoom, ang + vr * i, blur, li * light)
    a = person_alpha(m)
    for x0, x1, y0, y1, k in track_boxes(i):  # flacons qui touchent la femme : on ne garde que le satin
        hsv = cv2.cvtColor(frame[y0:y1, x0:x1], cv2.COLOR_RGB2HSV)
        satin = (((hsv[..., 0] < 10) | (hsv[..., 0] > 160)) & (hsv[..., 1] > 90)).astype(np.float32)
        satin = cv2.GaussianBlur(satin, (0, 0), 2)
        # bords de zone adoucis (pas de « marche » visible dans les cheveux)
        hh_, ww_ = y1 - y0, x1 - x0
        fy = np.clip(np.minimum(np.arange(hh_), hh_ - 1 - np.arange(hh_)) / 18, 0, 1)
        fx = np.clip(np.minimum(np.arange(ww_), ww_ - 1 - np.arange(ww_)) / 18, 0, 1)
        if y1 >= H: fy[-18:] = 1
        if x0 <= 0: fx[:18] = 1
        win = np.outer(fy, fx)
        a[y0:y1, x0:x1] *= 1 - k * win * (1 - satin)
    a = a[..., None]
    base = np.asarray(out.convert('RGB')).astype(np.float32)
    comp = base * (1 - a) + frame.astype(np.float32) * a
    out = Image.fromarray(comp.clip(0, 255).astype(np.uint8)).convert('RGBA')
    bx, by, bw = bottle_at(i)
    hh = bw * 2.2  # vernis ouvert (sans bouchon) : son corps recouvre tout le verre de l'ancien flacon
    place(out, 'polish_open', bx, by - 0.15 * bw + hh / 2, hh, -6 + 0.04 * i, 0.6, min(1, light * 1.05))
    return np.asarray(out.convert('RGB'))

def lights(frames, masks):
    v = np.array([(f.mean(axis=2) * (m > 0.5)).sum() / max((m > 0.5).sum(), 1) for f, m in zip(frames, masks)])
    v = np.maximum.accumulate(v)
    return np.clip(0.12 + 0.88 * (v - v.min()) / max(v.max() - v.min(), 1e-6), 0.12, 1)

if __name__ == '__main__':
    frames = load_frames()
    import os
    os.makedirs(CACHE, exist_ok=True)
    if not os.path.exists(f'{CACHE}/masks.npy'):
        sys.path.insert(0, os.path.dirname(__file__))
        from seg import mask
        np.save(f'{CACHE}/masks.npy', np.stack([mask(cv2.cvtColor(f, cv2.COLOR_RGB2BGR)) for f in frames]).astype(np.float16))
    masks = np.load(f'{CACHE}/masks.npy').astype(np.float32)
    L = lights(frames, masks)
    which = [int(a) for a in sys.argv[1].split(',')] if len(sys.argv) > 1 else range(len(frames))
    os.makedirs(f'{CACHE}/composed', exist_ok=True)
    for i in which:
        Image.fromarray(render(i, frames[i], masks[i], L[i])).save(f'{CACHE}/composed/{i:03d}.png')
    print('ok', len(list(which)))
