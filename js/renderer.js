import { midpoint, distance } from "./math.js";

let canvas, ctx;
let clothImg = new Image();

let currentCloth = "style_1.png";
let clothReady = false;

// 🔥 smoothing
let currentAngle = 0;
let modeSmooth = 0;

/* =========================
   自拍鏡頭設定（很重要）
========================= */
const MIRROR = true;

/* =========================
   init
========================= */
export function initRenderer() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  loadCloth(currentCloth);

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
}

/* =========================
   load cloth
========================= */
function loadCloth(src) {
  clothReady = false;

  clothImg = new Image();

  clothImg.onload = () => {
    clothReady = true;
  };

  clothImg.src = `assets/clothes/${src}`;
}

/* =========================
   resize
========================= */
function resizeCanvas() {
  const video = document.getElementById("video");
  if (!video) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
}

/* =========================
   change cloth
========================= */
export function setCloth(src) {
  currentCloth = src;
  loadCloth(src);
}

/* =========================
   angle diff
========================= */
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/* =========================
   visibility check
========================= */
function hasValidLowerBody(lh, rh) {
  return (
    lh &&
    rh &&
    lh.visibility > 0.5 &&
    rh.visibility > 0.5
  );
}

/* =========================
   render
========================= */
export function render(pose) {
  if (!pose || !clothReady) return;

  const ls = pose.leftShoulder;
  const rs = pose.rightShoulder;
  const lh = pose.leftHip;
  const rh = pose.rightHip;

  if (!ls || !rs) return;

  /* =========================
     mirror-safe direction
  ========================= */
  let dx = rs.x - ls.x;
  let dy = rs.y - ls.y;

  // 🔥 自拍鏡頭修正（核心）
  if (MIRROR) dx = -dx;

  const rawAngle = Math.atan2(dy, dx);

  /* =========================
     anchor
  ========================= */
  const shoulderMid = midpoint(ls, rs);
  const hipMid = midpoint(lh, rh);

  const fullBody = hasValidLowerBody(lh, rh);

  /* =========================
     mode smoothing
  ========================= */
  modeSmooth += fullBody ? 0.08 : -0.08;
  modeSmooth = Math.max(0, Math.min(1, modeSmooth));

  const useUpperBody = modeSmooth < 0.5;

  let center;
  let clothWidth;
  let clothHeight;

  /* =========================
     scale + anchor
  ========================= */
  if (useUpperBody) {
    const shoulderWidth = distance(ls, rs);

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

    center = midpoint(shoulderMid, hipMid);
  }

  /* =========================
     angle correction
  ========================= */
  let targetAngle = rawAngle - Math.PI / 2;

  const diff = angleDiff(targetAngle, currentAngle);
  currentAngle += diff * 0.15;

  /* =========================
     draw
  ========================= */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* =========================
     debug
  ========================= */
  const debug = document.getElementById("debugPanel");
  if (debug) {
    debug.innerText =
      "mode: " + (useUpperBody ? "UPPER" : "FULL") + "\n" +
      "angle: " + currentAngle.toFixed(2);
  }

  /* =========================
     render cloth
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
