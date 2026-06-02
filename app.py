from fastapi import FastAPI
from pydantic import BaseModel
from rembg import remove
from PIL import Image
import requests
from io import BytesIO
import numpy as np
import cv2

app = FastAPI()

class Req(BaseModel):
    url: str


def load_image(url):
    r = requests.get(url, timeout=10)
    img = Image.open(BytesIO(r.content)).convert("RGBA")
    return img


@app.get("/")
def home():
    return {"status": "ok", "msg": "AR API running"}


@app.post("/predict")
def predict(req: Req):

    try:
        img = load_image(req.url)

        # remove bg
        out = remove(img)

        if not isinstance(out, Image.Image):
            out = Image.fromarray(out)

        out = out.convert("RGBA")

        arr = np.array(out)
        alpha = arr[:, :, 3]

        ys, xs = np.where(alpha > 0)

        if len(ys) == 0:
            return {"status": "error"}

        top = np.min(ys)
        bottom = np.max(ys)
        h = bottom - top

        shoulder_y = int(top + h * 0.1)

        row = alpha[shoulder_y]
        xs_row = np.where(row > 0)[0]

        left = np.min(xs_row) if len(xs_row) else np.min(xs)
        right = np.max(xs_row) if len(xs_row) else np.max(xs)

        shoulder_ratio = (right - left) / arr.shape[1]
        offset_ratio = shoulder_y / arr.shape[0]

        return {
            "status": "OK",
            "shoulder": float(shoulder_ratio),
            "offset": float(offset_ratio),
        }

    except Exception as e:
        return {"status": "error", "msg": str(e)}
