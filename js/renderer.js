import { midpoint, distance } from "./math.js";

let canvas, ctx;
let clothImg = new Image();

let currentCloth = "style_1.png";
let clothReady = false;

// 🔥 平滑角度（避免抖動）
let currentAngle = 0;

/* =========================
   初始化
========================= */
export function initRenderer() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  loadCloth(currentCloth);

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
}

/* =========================
   載入衣服
========================= */
function loadCloth(src) {
  clothReady = false;

  clothImg = new Image();

  clothImg.onload = () => {
    console.log("CLOTH LOADED:", src);
    clothReady = true;
  };

  clothImg.onerror = () => {
    console.log("CLOTH FAILED:", src);
    clothReady = false;
  };

  clothImg.src = `assets/clothes/${src}`;
}

/* =========================
   resize canvas
========================= */
function resizeCanvas() {
  const video = document.getElementById("video");
  if (!video) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
}

/* =========================
   換衣服
========================= */
export function setCloth(src) {
  currentCloth = src;
  loadCloth(src);
}

/* =========================
   角度 wrap（防 180°跳動）
========================= */
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/* =========================
   MAIN RENDER
========================= */
export function render(pose) {
  if (!pose || !clothReady) return;

  const ls = pose.leftShoulder;
  const rs = pose.rightShoulder;
  const lh = pose.leftHip;
  const rh = pose.rightHip;

  if (!ls || !rs || !lh || !rh) return;

  /* =========================
     1. anchor
  ========================= */
  const shoulderMid = midpoint(ls, rs);
  const hipMid = midpoint(lh, rh);
  const center = midpoint(shoulderMid, hipMid);

  /* =========================
     2. scale
  ========================= */
  const torso = distance(shoulderMid, hipMid);
  const clothWidth = torso * 1.6;
  const clothHeight = clothWidth * 1.4;

  /* =========================
     3. angle (FIXED VERSION)
     - 解 180° flip
     - 解 90° offset
     - 防 camera mirroring
  ========================= */

  const dx = rs.x - ls.x;
  const dy = rs.y - ls.y;

  // 基礎角度
  let rawAngle = Math.atan2(dy, dx);

  // 🔥 解 180°翻轉（鏡像/左右反轉問題）
  if (dx < 0) {
    rawAngle += Math.PI;
  }

  // 🔥 90°修正（衣服直立對齊）
  const correctedAngle = rawAngle - Math.PI / 2;

  // 🔥 平滑（用 circular interpolation）
  const diff = angleDiff(correctedAngle, currentAngle);
  currentAngle += diff * 0.15;

  /* =========================
     4. clear canvas
  ========================= */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* =========================
     5. debug
  ========================= */
  const debug = document.getElementById("debugPanel");
  if (debug) {
    debug.innerText =
      "torso: " + torso.toFixed(2) + "\n" +
      "angle: " + currentAngle.toFixed(2);
  }

  /* =========================
     6. draw cloth
  ========================= */
  ctx.save();

  ctx.translate(center.x, center.y);
  ctx.rotate(currentAngle);

  ctx.drawImage(
    clothImg,
    -clothWidth / 2,
    -clothHeight * 0.2,
    clothWidth,
    clothHeight
  );

  ctx.restore();
}
