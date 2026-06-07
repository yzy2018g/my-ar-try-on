/**
 * ==============================
 * AR Renderer（安全穩定版）
 * ==============================
 * ❗ 重點設計：
 * 1. 不在 import 階段碰 DOM（避免 ES module crash）
 * 2. 所有 canvas/video 都在 initRenderer() 才取得
 * 3. render() 永遠防 null（避免 runtime crash）
 * 4. 適合 GitHub Pages / 手機環境
 */

/* =========================
   全域變數（延遲初始化）
========================= */
let canvas;          // 畫布 DOM（延遲取得）
let ctx;             // canvas 2D context
let clothImg = new Image(); // 當前衣服圖片
let currentCloth = "style_1.png";
let clothReady = false;

const MIRROR = true; // 是否鏡像（自拍模式）

/* =========================
   初始化 Renderer（⚠️ 必須在 app.js 呼叫）
========================= */
export function initRenderer() {
  // ⚠️ 這裡才碰 DOM（避免 import 時 crash）
  canvas = document.getElementById("canvas");

  // 安全檢查（避免 null 直接炸）
  if (!canvas) {
    console.error("[Renderer] canvas not found");
    return;
  }

  ctx = canvas.getContext("2d");

  // 載入初始衣服
  loadCloth(currentCloth);

  // 初始化 canvas 尺寸
  resizeCanvas();

  // 當螢幕改變時重新調整（手機旋轉）
  window.addEventListener("resize", resizeCanvas);
}

/* =========================
   載入衣服圖片
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

  // 注意 assets 路徑必須正確（GitHub Pages 很常錯）
  clothImg.src = `assets/clothes/${src}`;
}

/* =========================
   Canvas 尺寸同步 video
========================= */
function resizeCanvas() {
  const video = document.getElementById("video");

  // ⚠️ video 或 canvas 還沒 ready 就直接 return
  if (!video || !canvas) return;

  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;

  canvas.width = w;
  canvas.height = h;
}

/* =========================
   UI：切換衣服
========================= */
export function setCloth(src) {
  currentCloth = src;
  loadCloth(src);
}

/* =========================
   主渲染函式（每 frame 呼叫）
========================= */
export function render(pose) {
  // ⚠️ 防 crash：任何一個沒準備好都直接跳過
  if (!canvas || !ctx) return;
  if (!pose) return;

  const left = pose.leftShoulder;
  const right = pose.rightShoulder;

  // ⚠️ 沒肩膀資料就不畫
  if (!left || !right) return;

  /* =========================
     1. 清畫布（每 frame 必做）
  ========================= */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* =========================
     2. debug：畫肩膀點（方便你看 pose 是否正常）
  ========================= */
  ctx.fillStyle = "red";
  ctx.fillRect(left.x - 5, left.y - 5, 10, 10);

  ctx.fillStyle = "blue";
  ctx.fillRect(right.x - 5, right.y - 5, 10, 10);

  /* =========================
     3. 衣服還沒載好 → 只畫 debug 點
  ========================= */
  if (!clothReady) return;

  /* =========================
     4. 計算衣服位置（肩膀中心）
  ========================= */
  const centerX = (left.x + right.x) / 2;
  const centerY = (left.y + right.y) / 2;

  /* =========================
     5. 計算肩寬 → 當作衣服 scale 基準
  ========================= */
  const shoulderWidth = Math.hypot(
    right.x - left.x,
    right.y - left.y
  );

  const clothWidth = shoulderWidth * 2.0;
  const clothHeight = clothWidth * 1.3;

  /* =========================
     6. 畫衣服（先不做旋轉，避免 bug）
  ========================= */
  ctx.drawImage(
    clothImg,
    centerX - clothWidth / 2,
    centerY - clothHeight * 0.15,
    clothWidth,
    clothHeight
  );
}
