let canvas, ctx;
let clothImg = new Image();

// 目前選擇的衣服
let currentCloth = "assets/clothes/style_1.png";

// 初始化 renderer
export function initRenderer() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  clothImg.src = currentCloth;

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
}

// 更新 canvas 大小
function resizeCanvas() {
  const video = document.getElementById("video");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

// 設定衣服
export function setCloth(src) {
  currentCloth = src;
  clothImg.src = `assets/clothes/${src}`;
}

// 主 render function
export function render(pose) {
  if (!pose || !clothImg.complete) return;

  const left = pose.leftShoulder;
  const right = pose.rightShoulder;

  if (!left || !right) return;

  // 肩膀中點
  const centerX = (left.x + right.x) / 2;
  const centerY = (left.y + right.y) / 2;

  // 肩寬（像素）
  const shoulderWidth = Math.hypot(
    right.x - left.x,
    right.y - left.y
  );

  // 角度（肩膀傾斜）
  const angle = Math.atan2(
    right.y - left.y,
    right.x - left.x
  );

  // 衣服尺寸（可以調整倍率）
  const clothWidth = shoulderWidth * 2.2;
  const clothHeight = clothWidth * 1.2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  // 移動到身體中心
  ctx.translate(centerX, centerY);

  // 旋轉
  ctx.rotate(angle);

  // 畫衣服（往上移一點讓它貼身體）
  ctx.drawImage(
    clothImg,
    -clothWidth / 2,
    -clothHeight * 0.3,
    clothWidth,
    clothHeight
  );

  ctx.restore();
}
