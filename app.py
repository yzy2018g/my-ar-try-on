from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import threading
import requests
from PIL import Image
from io import BytesIO
from rembg import remove
import numpy as np
import cv2

app = FastAPI()

# ✅ CORS（一定要）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Req(BaseModel):
    url: str


# =========================
# 🚀 lazy load model（核心）
# =========================
model_ready = False

def warmup_model():
    global model_ready
    try:
        dummy = Image.new("RGB", (256, 256), (255, 255, 255))
        _ = remove(dummy)
        model_ready = True
        print("🔥 rembg warmup done")
    except Exception as e:
        print("warmup failed:", e)


@app.on_event("startup")
def startup():
    print("🚀 server starting...")
    threading.Thread(target=warmup_model).start()


# =========================
# image loader
# =========================
def load_image(url):
    r = requests.get(url, timeout=10)
    img = Image.open(BytesIO(r.content)).convert("RGBA")
    return img


# =========================
# 🚀 API（先回應 + 背景算）
# =========================
@app.post("/predict")
def predict(req: Req):

    # ⚡ 如果 model 還沒 ready，先回 fallback（避免 timeout）
    if not model_ready:
        return {
            "status": "warming",
            "msg": "model still loading, retry in 2s"
        }

    img = load_image(req.url)
    out = remove(img)

    if isinstance(out, np.ndarray):
        out = Image.fromarray(out)

    out = out.convert("RGBA")
    arr = np.array(out)

    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 0)

    if len(xs) == 0:
        return {"status": "error", "msg": "empty mask"}

    shoulder_ratio = (np.max(xs) - np.min(xs)) / arr.shape[1]
    offset_ratio = np.min(ys) / arr.shape[0]

    return {
        "status": "OK",
        "shoulder_ratio": float(shoulder_ratio),
        "offset_ratio": float(offset_ratio)
    }
