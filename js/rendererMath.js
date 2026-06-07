export function angleDiff(a, b) {
  let d = a - b;

  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;

  return d;
}

export function safeShoulderAngle(ls, rs, MIRROR) {
  const hasL = ls && ls.visibility > 0.5;
  const hasR = rs && rs.visibility > 0.5;

  if (hasL && hasR) {
    let dx = rs.x - ls.x;
    let dy = rs.y - ls.y;

    if (MIRROR) dx = ls.x - rs.x;

    return Math.atan2(dy, dx);
  }

  return 0;
}
