let canvas, ctx;
let clothImg = new Image();

let currentCloth = "style_1.png";

export function initRenderer() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  loadCloth(currentCloth);

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
}

/* 🔥 統一 loading（重點修正） */
function loadCloth(src) {
  console.log("loading cloth:", src);

  clothImg = new Image();

  clothImg.onload = () => {
    console.log("CLOTH LOADED:", src);
  };

  clothImg.onerror = () => {
    console.log("CLOTH FAILED:", src);
  };

  clothImg.src = `assets/clothes/${src}`;
}

function resizeCanvas() {
  const video = document.getElementById("video");

  if (!video) return;

  // 🔥 強制同步尺寸（避免 0x0）
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
  if (!pose) return;

  const left = pose.leftShoulder;
  const right = pose.rightShoulder;

  if (!left || !right) return;

  // 🔥 debug（用畫面顯示，不靠 console）
  const debug = document.getElementById("debugPanel");
  if (debug) {
    debug.innerText =
      "RENDER OK\ncloth:" +
      clothImg.src +
      "\nsize:" +
      clothImg.naturalWidth +
      "x" +
      clothImg.naturalHeight;
  }

  const centerX = (left.x + right.x) / 2;
  const centerY = (left.y + right.y) / 2;

  const shoulderWidth = Math.hypot(
    right.x - left.x,
    right.y - left.y
  );

  const angle = Math.atan2(
    right.y - left.y,
    right.x - left.x
  );

  const clothWidth = shoulderWidth * 2.2;
  const clothHeight = clothWidth * 1.2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  ctx.drawImage(
    clothImg,
    -clothWidth / 2,
    -clothHeight * 0.3,
    clothWidth,
    clothHeight
  );

  ctx.restore();
}
