import { drawVideo } from "./rendererVideo.js";
import { drawCloth } from "./rendererCloth.js";

let canvas, ctx;
let video;
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

  loadCloth("style_1.png");

  resize();
  window.addEventListener("resize", resize);
}

/* ==============================
   cloth loader
============================== */
function loadCloth(src) {
  clothReady = false;

  clothImg = new Image();
  clothImg.src = `assets/clothes/${src}`;

  clothImg.onload = () => {
    clothReady = true;
  };
}

/* ==============================
   resize
============================== */
function resize() {
  if (!video || !video.videoWidth) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

/* ==============================
   render loop
============================== */
export function render(pose) {
  if (!pose || !clothReady || !video) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // 🎥 背景 video
  drawVideo(ctx, video, w, h);

  ctx.save();

  if (MIRROR) {
    ctx.scale(-1, 1);
    ctx.translate(-w, 0);
  }

  // 👕 衣服
  drawCloth(ctx, pose, clothImg, { MIRROR });

  ctx.restore();
}
