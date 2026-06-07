let canvas, ctx;
let clothImg = new Image();

let currentCloth = "style_1.png";
let clothReady = false;

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
   Canvas size
========================= */
function resizeCanvas() {
  const video = document.getElementById("video");

  if (!video) return;

  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;

  canvas.width = w;
  canvas.height = h;
}

/* =========================
   UI
========================= */
export function setCloth(src) {
  currentCloth = src;
  loadCloth(src);
}

/* =========================
   DEBUG + RENDER CORE
========================= */
export function render(pose) {
  if (!pose) return;

  const left = pose.leftShoulder;
  const right = pose.rightShoulder;

  if (!left || !right) return;

  const debug = document.getElementById("debugPanel");

  // 🔥 1. 清畫面
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* =========================
     2. 畫肩膀點（最重要 debug）
  ========================= */
  ctx.fillStyle = "red";
  ctx.fillRect(left.x - 5, left.y - 5, 10, 10);

  ctx.fillStyle = "blue";
  ctx.fillRect(right.x - 5, right.y - 5, 10, 10);

  /* =========================
     3. debug panel
  ========================= */
  if (debug) {
    debug.innerText =
      "LEFT: " + left.x + "," + left.y + "\n" +
      "RIGHT: " + right.x + "," + right.y + "\n" +
      "clothReady: " + clothReady;
  }

  /* =========================
     4. 如果衣服沒載好 → 停
  ========================= */
  if (!clothReady) return;

  /* =========================
     5. 計算中心點
  ========================= */
  const centerX = (left.x + right.x) / 2;
  const centerY = (left.y + right.y) / 2;

  const shoulderWidth = Math.hypot(
    right.x - left.x,
    right.y - left.y
  );

  const clothWidth = shoulderWidth * 2.0;
  const clothHeight = clothWidth * 1.3;

  /* =========================
     6. 畫衣服（先不旋轉）
  ========================= */
  ctx.drawImage(
    clothImg,
    centerX - clothWidth / 2,
    centerY,
    clothWidth,
    clothHeight
  );
}
