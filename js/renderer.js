/**
 * ==============================
 * AR Renderer（穩定修正版）
 * ==============================
 */

let canvas;
let ctx;
let clothImg = new Image();
let currentCloth = "style_1.png";
let clothReady = false;

const MIRROR = true; // 自拍鏡像

/* =========================
   初始化
========================= */
export function initRenderer() {
  canvas = document.getElementById("canvas");

  if (!canvas) {
    console.error("[Renderer] canvas not found");
    return;
  }

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
    console.log("[Renderer] CLOTH LOADED:", src);
    clothReady = true;
  };

  clothImg.onerror = () => {
    console.error("[Renderer] CLOTH FAILED:", src);
    clothReady = false;
  };

  clothImg.src = src; // ⚠️ 你已經傳完整 path（app.js）
}

/* =========================
   resize
========================= */
function resizeCanvas() {
  const video = document.getElementById("video");
  if (!video || !canvas) return;

  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;

  canvas.width = w;
  canvas.height = h;
}

/* =========================
   切換衣服
========================= */
export function setCloth(src) {
  currentCloth = src;
  loadCloth(src);
}

/* =========================
   render loop
========================= */
export function render(pose) {
  if (!canvas || !ctx) return;
  if (!pose) return;

  const left = pose.leftShoulder;
  const right = pose.rightShoulder;

  if (!left || !right) return;

  /* =========================
     clear
  ========================= */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* =========================
     debug shoulders
  ========================= */
  ctx.fillStyle = "red";
  ctx.fillRect(left.x - 5, left.y - 5, 10, 10);

  ctx.fillStyle = "blue";
  ctx.fillRect(right.x - 5, right.y - 5, 10, 10);

  if (!clothReady) return;

  /* =========================
     shoulder center
  ========================= */
  const centerX = (left.x + right.x) / 2;
  const centerY = (left.x + right.y) / 2; // safe fallback

  const shoulderCenterY = (left.y + right.y) / 2;

  /* =========================
     shoulder width
  ========================= */
  const shoulderWidth = Math.hypot(
    right.x - left.x,
    right.y - left.y
  );

  const clothWidth = shoulderWidth * 2.1;
  const clothHeight = clothWidth * 1.35;

  /* =========================
     ⭐ 核心修正：領口上提
     =========================
     原本錯誤：centerY
     修正：往上拉 0.25 身體比例
  ========================= */
  const offsetY = clothHeight * 0.25;

  const drawX = centerX - clothWidth / 2;
  const drawY = shoulderCenterY - offsetY;

  /* =========================
     draw cloth
  ========================= */
  ctx.drawImage(
    clothImg,
    drawX,
    drawY,
    clothWidth,
    clothHeight
  );
}
