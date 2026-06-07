import { angleDiff, safeShoulderAngle } from "./rendererMath.js";

let currentAngle = 0;

export function drawCloth(ctx, pose, clothImg, config) {
  const { MIRROR } = config;

  const ls = pose.leftShoulder;
  const rs = pose.rightShoulder;

  if (!ls || !rs) return;

  const dx = rs.x - ls.x;
  const dy = rs.y - ls.y;

  let rawAngle = safeShoulderAngle(ls, rs, MIRROR);

  const diff = angleDiff(rawAngle, currentAngle);
  currentAngle += diff * 0.15;

  const center = {
    x: (ls.x + rs.x) / 2,
    y: (ls.y + rs.y) / 2
  };

  const width = Math.hypot(dx, dy) * 2.2;
  const height = width * 1.4;

  ctx.save();

  ctx.translate(center.x, center.y);
  ctx.rotate(currentAngle);

  ctx.drawImage(
    clothImg,
    -width / 2,
    -height * 0.2,
    width,
    height
  );

  ctx.restore();
}
