let currentAngle = 0;

/* ==============================
   角度差（避免 180° 突變）
============================== */
export function angleDiff(a, b) {
  let d = a - b;

  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;

  return d;
}

/* ==============================
   肩膀角度（安全版）
============================== */
export function safeShoulderAngle(ls, rs, MIRROR) {
  const hasL = ls && ls.visibility > 0.5;
  const hasR = rs && rs.visibility > 0.5;

  if (!hasL || !hasR) {
    return currentAngle; // fallback
  }

  let dx = rs.x - ls.x;
  let dy = rs.y - ls.y;

  if (MIRROR) dx = ls.x - rs.x;

  return Math.atan2(dy, dx);
}

/* ==============================
   平滑角度（核心穩定）
============================== */
export function smoothAngle(target) {
  const diff = angleDiff(target, currentAngle);
  currentAngle += diff * 0.15;

  return currentAngle;
}
