//
// ==============================
// AR Math Utilities (Phase 2)
// 人體座標 / 向量 / anchor 計算
// ==============================
//

// ------------------------------
// 1. 兩點距離
// ------------------------------
export function distance(a, b) {
  if (!a || !b) return 0;

  return Math.hypot(
    b.x - a.x,
    b.y - a.y
  );
}

// ------------------------------
// 2. 兩點中點
// ------------------------------
export function midpoint(a, b) {
  if (!a || !b) return { x: 0, y: 0 };

  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

// ------------------------------
// 3. 向量角度（a → b）
// ------------------------------
export function angle(a, b) {
  if (!a || !b) return 0;

  return Math.atan2(
    b.y - a.y,
    b.x - a.x
  );
}

// ------------------------------
// 4. 簡單 clamp（避免爆值）
// ------------------------------
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ------------------------------
// 5. torso height（肩 → 髖）
/*
  用於衣服 scale
*/
// ------------------------------
export function torsoHeight(leftHip, rightHip, leftShoulder, rightShoulder) {
  const hipMid = midpoint(leftHip, rightHip);
  const shoulderMid = midpoint(leftShoulder, rightShoulder);

  return distance(hipMid, shoulderMid);
}

// ------------------------------
// 6. shoulder width
// ------------------------------
export function shoulderWidth(leftShoulder, rightShoulder) {
  return distance(leftShoulder, rightShoulder);
}

// ------------------------------
// 7. body center anchor（核心 anchor）
// ------------------------------
export function bodyCenter(shoulderMid, hipMid, ratio = 0.5) {
  return {
    x: shoulderMid.x + (hipMid.x - shoulderMid.x) * ratio,
    y: shoulderMid.y + (hipMid.y - shoulderMid.y) * ratio
  };
}
