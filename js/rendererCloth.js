import { safeShoulderAngle, smoothAngle } from "./rendererMath.js";

/* ==============================
   畫衣服
============================== */
export function drawCloth(ctx, pose, clothImg, config) {
  const { MIRROR } = config;

  const ls = pose.leftShoulder;
  const rs = pose.rightShoulder;
  const lh = pose.leftHip;
  const rh = pose.rightHip;

  if (!ls || !rs) return;

  /* ==============================
     肩膀中心（anchor）
  ============================== */
  const center = {
    x: (ls.x + rs.x) / 2,
    y: (ls.y + rs.y) / 2
  };

  /* ==============================
     肩寬
  ============================== */
  const dx = rs.x - ls.x;
  const dy = rs.y - ls.y;

  const shoulderWidth = Math.hypot(dx, dy);

  /* ==============================
     cloth size
  ============================== */
  const width = shoulderWidth * 2.2;
  const height = width * 1.4;

  /* ==============================
     angle
  ============================== */
  const rawAngle = safeShoulderAngle(ls, rs, MIRROR, 0);
  const angle = smoothAngle(rawAngle);

  /* ==============================
     draw cloth
  ============================== */
  ctx.save();

  ctx.translate(center.x, center.y);
  ctx.rotate(angle);

  ctx.drawImage(
    clothImg,
    -width / 2,
    -height * 0.2,
    width,
    height
  );

  ctx.restore();
}
