let currentAngle = 0;

/* ==============================
   角度差（避免 180° 跳動）
============================== */
export function angleDiff(a, b) {
  let d = a - b;

  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;

  return d;
}

/* ==============================
   安全肩膀角度
   👉 防止 missing keypoints crash
============================== */
export function safeShoulderAngle(ls, rs, MIRROR, fallback = 0) {
  const hasL = ls && ls.visibility > 0.5;
  const hasR = rs && rs.visibility > 0.5;

  if (hasL && hasR) {
    let dx = rs.x - ls.x;
    let dy = rs.y - ls.y;

    if (MIRROR) dx = ls.x - rs.x;

    return Math.atan2(dy, dx);
  }

  return fallback;
}

/* ==============================
   角度平滑（輸出穩定 angle）
============================== */
export function smoothAngle(target) {
  const diff = angleDiff(target, currentAngle);
  currentAngle += diff * 0.15;

  return currentAngle;
}
