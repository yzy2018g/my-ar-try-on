// ==============================
// AR Renderer（衣服貼圖核心）
// ==============================

// canvas：畫 AR overlay 的畫布
let canvas, ctx;

// clothImg：目前載入的衣服圖片
let clothImg = new Image();

// currentCloth：目前選中的衣服檔名
let currentCloth = "style_1.png";

// clothReady：避免圖片還沒載入就 render
let clothReady = false;


// ==============================
// 初始化 renderer（綁 canvas）
// ==============================
export function initRenderer() {
  // 取得 canvas 元素
  canvas = document.getElementById("canvas");

  // 取得 2D 繪圖 context
  ctx = canvas.getContext("2d");

  // 載入預設衣服
  loadCloth(currentCloth);

  // 調整 canvas 大小
  resizeCanvas();

  // 畫面 resize 時同步 canvas
  window.addEventListener("resize", resizeCanvas);
}


// ==============================
// 載入衣服圖片（核心資源層）
// ==============================
function loadCloth(src) {
  clothReady = false;

  // 重新建立 Image（避免 cache / race condition）
  clothImg = new Image();

  // 圖片載入成功
  clothImg.onload = () => {
    console.log("CLOTH LOADED:", src);
    clothReady = true; // 允許 render
  };

  // 圖片載入失敗
  clothImg.onerror = () => {
    console.log("CLOTH FAILED:", src);
    clothReady = false;
  };

  // 設定圖片路徑（GitHub Pages assets）
  clothImg.src = `assets/clothes/${src}`;
}


// ==============================
// canvas 尺寸同步 video
// ==============================
function resizeCanvas() {
  const video = document.getElementById("video");

  if (!video) return;

  // fallback（避免 video 還沒 ready）
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;

  canvas.width = w;
  canvas.height = h;
}


// ==============================
// UI：切換衣服
// ==============================
export function setCloth(src) {
  console.log("setCloth:", src);

  currentCloth = src;
  loadCloth(src);
}


// ==============================
// AR render loop（核心疊圖邏輯）
// ==============================
export function render(pose) {
  const debug = document.getElementById("debugPanel");

  // ❗ guard：沒有 pose 或圖片未載入就不畫
  if (!pose || !clothReady) return;

  const left = pose.leftShoulder;
  const right = pose.rightShoulder;

  if (!left || !right) return;
  
  // ==============================
  // 1. 計算人體 anchor（肩膀中心）
  // ==============================
  const centerX = (left.x + right.x) / 2;

  // 🔥 往下移動（讓衣服貼胸口）
  const centerY =
    (left.y + right.y) / 2 +
    Math.hypot(right.x - left.x, right.y - left.y) * 0.3;

  // ==============================
  // 2. 計算肩寬（決定衣服大小）
  // ==============================
  const shoulderWidth = Math.hypot(
    right.x - left.x,
    right.y - left.y
  );

  // ==============================
  // 3. 計算旋轉角度（肩膀傾斜）
  // ==============================
  const angle = Math.atan2(
    right.y - left.y,
    right.x - left.x
  );

  // ==============================
  // 4. 衣服尺寸 scaling
  // ==============================
  const clothWidth = shoulderWidth * 1.8;
  const clothHeight = clothWidth * 1.3;

  // ==============================
  // DEBUG UI（手機除錯用）
  // ==============================
  if (debug) {
    debug.innerText =
      "RENDER OK\n" +
      "clothReady: " + clothReady + "\n" +
      "size: " +
      clothImg.naturalWidth +
      "x" +
      clothImg.naturalHeight;
  }

  // ==============================
  // 5. 繪製 AR cloth
  // ==============================
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  // 移動到人體 anchor
  ctx.translate(centerX, centerY);

  // 旋轉衣服（跟肩膀角度一致）
  ctx.rotate(angle);

  // 畫衣服（anchor 在肩膀附近）
  ctx.translate(centerX, centerY);

ctx.drawImage(
  clothImg,
  -clothWidth / 2,
  0,
  clothWidth,
  clothHeight
);

  ctx.restore();
}
