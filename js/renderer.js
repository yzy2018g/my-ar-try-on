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
  if (!pose || !clothReady) return;

  const w = canvas.width || 640;
  const h = canvas.height || 480;

  // reset
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // background
  drawVideo(ctx, video, w, h);

  ctx.save();

  if (MIRROR) {
    ctx.scale(-1, 1);
    ctx.translate(-w, 0);
  }

  // cloth
  drawCloth(ctx, pose, clothImg, { MIRROR });

  ctx.restore();
}
