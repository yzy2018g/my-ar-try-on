import { midpoint, distance } from "./math.js";

let canvas, ctx;
let clothImg = new Image();

let currentCloth = "style_1.png";
let clothReady = false;

// 🔥 smoothing
let currentAngle = 0;
let modeSmooth = 0;

// ==============================
// 自拍鏡頭
// ==============================
const MIRROR = true;

/* ==============================
   初始化
============================== */
export function initRenderer() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  loadCloth(currentCloth);

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
}

/* ==============================
   載入衣服
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
function resizeCanvas() {
  const video = document.getElementById("video");
  if (!video) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
}

/* ==============================
   angle smoothing
============================== */
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/* ==============================
   shoulder safe angle
   ------------------------------
   ✔ 有雙肩 → 正常
   ✔ 缺一肩 → 用 fallback
   ✔ 全缺 → return 0
============================== */
function safeShoulderAngle(ls, rs) {
  const hasL = ls && ls.visibility > 0.5;
  const hasR = rs && rs.visibility > 0.5;

  // =========================
  // ① 雙肩正常
  // =========================
  if (hasL && hasR) {
    let dx = rs.x - ls.x;
    let dy = rs.y - ls.y;

    if (MIRROR) dx = ls.x - rs.x;

    return Math.atan2(dy, dx);
  }

  // =========================
  // ② 只剩左肩（用 body 方向猜）
  // =========================
  if (hasL && !hasR) {
    return 0; // fallback：水平
  }

  // =========================
  // ③ 只剩右肩（同理）
  // =========================
  if (!hasL && hasR) {
    return 0;
  }

  // =========================
  // ④ 完全沒有
  // =========================
  return currentAngle;
}

/* ==============================
   render
============================== */
export function render(pose) {
  if (!pose || !clothReady) return;

  const ls = pose.leftShoulder;
  const rs = pose.rightShoulder;
  const lh = pose.leftHip;
  const rh = pose.rightHip;

  if (!ls && !rs) return;

  /* ==============================
     anchor
  ============================== */
  const shoulderMid = midpoint(ls, rs);

  const hipMid = midpoint(lh, rh);

  const fullBody =
    lh && rh &&
    lh.visibility > 0.5 &&
    rh.visibility > 0.5;

  /* ==============================
     mode smoothing
  ============================== */
  modeSmooth += fullBody ? 0.08 : -0.08;
  modeSmooth = Math.max(0, Math.min(1, modeSmooth));

  const useUpperBody = modeSmooth < 0.5;

  let center;
  let clothWidth;
  let clothHeight;

  /* ==============================
     scale + anchor
  ============================== */
  if (useUpperBody) {
    const shoulderWidth =
      ls && rs ? distance(ls, rs) : 100;

    clothWidth = shoulderWidth * 2.2;
    clothHeight = clothWidth * 1.4;

    center = {
      x: shoulderMid.x,
      y: shoulderMid.y + clothHeight * 0.25
    };
  } else {
    const torso = distance(shoulderMid, hipMid);

    clothWidth = torso * 1.6;
    clothHeight = clothWidth * 1.4;

    center = shoulderMid;
  }

  /* ==============================
     angle（安全版）
  ============================== */
  let rawAngle = safeShoulderAngle(ls, rs);

  let targetAngle = rawAngle; // 👉 不再亂 -π/2

  /* ==============================
     smoothing
  ============================== */
  const diff = angleDiff(targetAngle, currentAngle);
  currentAngle += diff * 0.15;

  /* ==============================
     draw
  ============================== */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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
