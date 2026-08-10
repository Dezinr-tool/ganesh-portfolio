import sys
import numpy as np
from PIL import Image
from transformers import pipeline

SRC = "tmp/ganesh-rgb.png"      # opaque RGB portrait (alpha flattened on black)
ALPHA = "tmp/ganesh-alpha.png"  # alpha mask
OUT = "public/ganesh-depth.png"

print("loading Depth Anything V2 (small)...", flush=True)
pipe = pipeline(
    task="depth-estimation",
    model="depth-anything/Depth-Anything-V2-Small-hf",
)

img = Image.open(SRC).convert("RGB")
print("running inference on", img.size, flush=True)
result = pipe(img)
depth = result["depth"]  # PIL image, near=bright

d = np.asarray(depth).astype(np.float32)
# normalize 0..1
d -= d.min()
if d.max() > 0:
    d /= d.max()

# mask out background using alpha so only the subject carries depth
alpha = np.asarray(Image.open(ALPHA).convert("L").resize(depth.size)).astype(np.float32) / 255.0
mask = alpha > 0.5
if mask.sum() > 0:
    # rescale depth within subject to use full range
    sub = d[mask]
    lo, hi = np.percentile(sub, 2), np.percentile(sub, 98)
    d = np.clip((d - lo) / max(1e-5, (hi - lo)), 0, 1)
# background pushed to 0 (farthest)
d = d * alpha

out = (d * 255.0).astype(np.uint8)
Image.fromarray(out, mode="L").save(OUT)
print("saved", OUT, out.shape, flush=True)
