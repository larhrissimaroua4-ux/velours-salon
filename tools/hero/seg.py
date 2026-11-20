import os
import numpy as np, cv2, onnxruntime as ort
_sess = {}
def session(name):
    if name not in _sess:
        _sess[name] = ort.InferenceSession(os.path.join(os.path.dirname(__file__), 'models', f'{name}.onnx'), providers=['CPUExecutionProvider'])
    return _sess[name]
def mask(img_bgr, name='u2net_human_seg'):
    s = session(name)
    size = 1024 if name.startswith('isnet') else 320
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    x = cv2.resize(rgb, (size, size), interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
    x /= max(x.max(), 1e-6)
    if size == 1024:
        x = (x - 0.5) / 1.0
    else:
        x = (x - np.array([0.485, 0.456, 0.406], np.float32)) / np.array([0.229, 0.224, 0.225], np.float32)
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    out = s.run(None, {s.get_inputs()[0].name: x})[0][0, 0]
    out = (out - out.min()) / max(out.max() - out.min(), 1e-6)
    return cv2.resize(out, (img_bgr.shape[1], img_bgr.shape[0]), interpolation=cv2.INTER_LINEAR)
