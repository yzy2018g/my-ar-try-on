import {
  midpoint,
  distance,
  angle,
  shoulderWidth,
  torsoHeight,
  bodyCenter
} from "./math.js";

let canvas, ctx;
let clothImg = new Image();

let currentCloth = "style_1.png";
let clothReady = false;

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
   MAIN RENDER (Phase 2)
========================= */
export function render(pose) {
  if (!pose || !clothReady) return;

  const leftShoulder = pose.leftShoulder;
  const rightShoulder = pose.rightShoulder;
  const leftHip = pose.leftHip;
  const rightHip = pose.rightHip;

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

  // =========================
  // 1. anchors
  // =========================
  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);

  const center = bodyCenter(shoulderMid, hipMid, 0.45);

  // =========================
  // 2. scale (torso-based)
  // =========================
  const torso = distance(shoulderMid, hipMid);
  const clothWidth = torso * 1.6;
  const clothHeight = clothWidth * 1.4;

  // =========================
  // 3. rotation (stable torso angle)
  // =========================
  const targetAngle = angle(hipMid, shoulderMid);

  // smoothing (避免抖動)
  currentAngle = currentAngle * 0.8 + targetAngle * 0.2;

  // =========================
  // 4. clear canvas
  // =========================
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // =========================
  // 5. DEBUG (optional)
  // =========================
  const debug = document.getElementById("debugPanel");
  if (debug) {
    debug.innerText =
      "torso: " + torso.toFixed(2) + "\n" +
      "angle: " + currentAngle.toFixed(2);
  }

  // =========================
  // 6. draw cloth (stable AR)
  // =========================
  ctx.save();

  ctx.translate(center.x, center.y);
  ctx.rotate(currentAngle);

  // 🔥 anchor: top-center of cloth
  ctx.drawImage(
    clothImg,
    -clothWidth / 2,
    -clothHeight * 0.2,
    clothWidth,
    clothHeight
  );

  ctx.restore();
}
