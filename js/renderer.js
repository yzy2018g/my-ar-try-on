import { midpoint, distance } from "./math.js";

let canvas, ctx;
let clothImg = new Image();

let currentCloth = "style_1.png";
let clothReady = false;

// 🔥 旋轉平滑用（非常重要）
let currentAngle = 0;

/* =========================
   初始化 renderer
========================= */
export function initRenderer() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  loadCloth(currentCloth);

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
}

/* =========================
   載入衣服圖片
========================= */
function loadCloth(src) {
  clothReady = false;

  clothImg = new Image();

  clothImg.onload = () => {
    console.log("衣服載入成功:", src);
    clothReady = true;
  };

  clothImg.onerror = () => {
    console.log("衣服載入失敗:", src);
    clothReady = false;
  };

  clothImg.src = `assets/clothes/${src}`;
}

/* =========================
   調整 canvas 大小
========================= */
function resizeCanvas() {
  const video = document.getElementById("video");
  if (!video) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
}

/* =========================
   更換衣服
========================= */
export function setCloth(src) {
  currentCloth = src;
  loadCloth(src);
}

/* =========================
   角度差計算（避免 ±π 跳動）
   👉 解決旋轉突然大跳的核心
========================= */
function angleDiff(a, b) {
  let d = a - b;

  // 把角度限制在 -PI ~ PI 之間（最短旋轉路徑）
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;

  return d;
}

/* =========================
   主渲染函式
========================= */
export function render(pose) {
  if (!pose || !clothReady) return;

  const ls = pose.leftShoulder;
  const rs = pose.rightShoulder;
  const lh = pose.leftHip;
  const rh = pose.rightHip;

  // 如果關鍵點缺失就不畫
  if (!ls || !rs || !lh || !rh) return;

  /* =========================
     1. 身體中心點計算
  ========================= */

  // 左右肩中心
  const shoulderMid = midpoint(ls, rs);

  // 左右臀中心
  const hipMid = midpoint(lh, rh);

  // 上下身體中心（整體中心）
  const center = midpoint(shoulderMid, hipMid);

  /* =========================
     2. 衣服縮放（依 torso 長度）
  ========================= */

  const torso = distance(shoulderMid, hipMid);

  const clothWidth = torso * 1.6;
  const clothHeight = clothWidth * 1.4;

  /* =========================
     3. 角度計算 + 修正
     👉 解決 90 度錯誤 + 抖動
  ========================= */

  // 肩膀方向向量（左肩 → 右肩）
  const rawAngle = Math.atan2(
    rs.y - ls.y,
    rs.x - ls.x
  );

  // 修正模型本身偏移（90度校正）
  const correctedAngle = rawAngle - Math.PI / 2;

  // 🔥 核心：角度平滑（避免 ±π 跳動）
  const diff = angleDiff(correctedAngle, currentAngle);
  currentAngle += diff * 0.15;

  /* =========================
     4. 清除畫布
  ========================= */

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* =========================
     5. Debug 顯示
  ========================= */

  const debug = document.getElementById("debugPanel");
  if (debug) {
    debug.innerText =
      "身體長度(torso): " + torso.toFixed(2) + "\n" +
      "衣服角度(angle): " + currentAngle.toFixed(2);
  }

  /* =========================
     6. 繪製衣服
  ========================= */

  ctx.save();

  // 移動到人體中心點
  ctx.translate(center.x, center.y);

  // 旋轉衣服
  ctx.rotate(currentAngle);

  // 畫衣服（以肩膀對齊為基準）
  ctx.drawImage(
    clothImg,
    -clothWidth / 2,
    -clothHeight * 0.2,
    clothWidth,
    clothHeight
  );

  ctx.restore();
}
