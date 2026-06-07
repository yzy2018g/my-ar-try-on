import {
  midpoint,
  distance,
  angle
} from "./math.js";

let canvas, ctx;
let clothImg = new Image();

let currentCloth = "style_1.png";
let clothReady = false;

// rotation smoothing
let currentAngle = 0;

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
   UI
========================= */
export function setCloth(src) {
  currentCloth = src;
  loadCloth(src);
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
     1. body anchors
  ========================= */
  const shoulderMid = midpoint(ls, rs);
  const hipMid = midpoint(lh, rh);

  const center = midpoint(shoulderMid, hipMid);

  /* =========================
     2. scale (torso-based)
  ========================= */
  const torso = distance(shoulderMid, hipMid);
  const clothWidth = torso * 1.6;
  const clothHeight = clothWidth * 1.4;

  /* =========================
     3. FIXED ROTATION (核心修正)
     👉 解決 90 度問題
  ========================= */
  const rawAngle = angle(lh, rs);

  const targetAngle = rawAngle - Math.PI / 2;

  // smoothing（避免抖動）
  currentAngle = currentAngle * 0.8 + targetAngle * 0.2;

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

  // 🔥 anchor: top-center
  ctx.drawImage(
    clothImg,
    -clothWidth / 2,
    -clothHeight * 0.2,
    clothWidth,
    clothHeight
  );

  ctx.restore();
}
