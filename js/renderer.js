import { drawVideo } from "./rendererVideo.js";
import { drawCloth } from "./rendererCloth.js";

let canvas, ctx, video;
let clothImg = new Image();
let clothReady = false;

const MIRROR = true;

/* ==============================
   init
============================== */
export function initRenderer() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  video = document.getElementById("video");
}

/* ==============================
   render loop
============================== */
export function render(pose) {
  const w = canvas.width || 640;
  const h = canvas.height || 480;

  // 1. 清畫布（一定要做）
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // 2. 先畫 video（永遠要畫）
  if (video && video.readyState >= 2) {
    drawVideo(ctx, video, w, h);
  }

  // 3. 沒 pose 就只顯示 camera
  if (!pose) return;

  ctx.save();

  if (MIRROR) {
    ctx.scale(-1, 1);
    ctx.translate(-w, 0);
  }

  // 4. cloth 才需要 ready
  if (clothReady) {
    drawCloth(ctx, pose, clothImg, { MIRROR });
  }

  ctx.restore();
}
