let canvas, ctx;
let clothImg = new Image();

// 只存檔名，不帶路徑（重點修正）
let currentCloth = "style_1.png";

export function initRenderer() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  clothImg.src = `assets/clothes/${currentCloth}`;

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
}

function resizeCanvas() {
  const video = document.getElementById("video");

  if (!video || video.videoWidth === 0) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

export function setCloth(src) {
  console.log("setCloth:", src);

  currentCloth = src;

  clothImg.onload = () => {
    console.log("cloth loaded:", src);
  };

  clothImg.src = `assets/clothes/${src}`;
}

export function render(pose) {
  if (!pose) return;
  if (!clothImg || clothImg.naturalWidth === 0) return;

  const left = pose.leftShoulder;
  const right = pose.rightShoulder;

  if (!left || !right) return;

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
