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

function resizeCanvas() {
  const video = document.getElementById("video");

  if (!video) return;

  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;

  canvas.width = w;
  canvas.height = h;
}

export function setCloth(src) {
  console.log("setCloth:", src);
  currentCloth = src;
  loadCloth(src);
}

export function render(pose) {
  const debug = document.getElementById("debugPanel");

  if (!pose || !clothReady) return;

  const left = pose.leftShoulder;
  const right = pose.rightShoulder;

  if (!left || !right) return;

  // ====== BODY ANCHOR ======
  const centerX = (left.x + right.x) / 2;

  // 🔥 關鍵修正：往下移（避免衣服太高/上下錯）
  const centerY =
    (left.y + right.y) / 2 + Math.hypot(right.x - left.x, right.y - left.y) * 0.3;

  const shoulderWidth = Math.hypot(
    right.x - left.x,
    right.y - left.y
  );

  const angle = Math.atan2(
    right.y - left.y,
    right.x - left.x
  );

  const clothWidth = shoulderWidth * 1.8;
  const clothHeight = clothWidth * 1.3;

  // ====== DEBUG ======
  if (debug) {
    debug.innerText =
      "RENDER OK\n" +
      "clothReady: " + clothReady + "\n" +
      "size: " + clothImg.naturalWidth + "x" + clothImg.naturalHeight;
  }

  // ====== DRAW ======
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  // 🔥 關鍵：anchor 改成「肩膀上方」
  ctx.drawImage(
    clothImg,
    -clothWidth / 2,
    0,
    clothWidth,
    clothHeight
  );

  ctx.restore();
}
