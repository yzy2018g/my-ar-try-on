/* =========================
   AR RENDER MODULE (MOBILE SAFE)
========================= */

export function drawAR({
    ctx,
    video,
    canvas,
    pose,
    cloth
}) {

    if (!ctx || !video || !canvas) return;

    // 🔥 清畫面（避免殘影 / iOS 錯位）
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景畫 camera
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let lm = null;

    // pose detection
    if (pose && video.readyState >= 2) {
        try {
            const res = pose.detectForVideo(video, performance.now());
            lm = res?.landmarks?.[0] || null;
        } catch (e) {
            console.log("POSE ERROR", e);
        }
    }

    // 沒 keypoints → 繼續 loop
    if (!lm) {
        requestAnimationFrame(() =>
            drawAR({ ctx, video, canvas, pose, cloth })
        );
        return;
    }

    // cloth 是否 ready（手機安全版）
    const clothReady =
        cloth &&
        cloth.complete &&
        cloth.naturalWidth > 0 &&
        cloth.naturalHeight > 0;

    if (!clothReady) {
        requestAnimationFrame(() =>
            drawAR({ ctx, video, canvas, pose, cloth })
        );
        return;
    }

    // 肩膀 keypoints
    const l = lm[11];
    const r = lm[12];

    if (!l || !r) {
        requestAnimationFrame(() =>
            drawAR({ ctx, video, canvas, pose, cloth })
        );
        return;
    }

    const lx = l.x * canvas.width;
    const ly = l.y * canvas.height;

    const rx = r.x * canvas.width;
    const ry = r.y * canvas.height;

    // 中心點
    const midX = (lx + rx) / 2;
    const midY = (ly + ry) / 2;

    // 肩寬
    const shoulder = Math.hypot(lx - rx, ly - ry);

    // 衣服大小（可調）
    const width = shoulder * 2.2;

    const ratio =
        cloth.naturalHeight /
        cloth.naturalWidth;

    const height = width * ratio;

    const angle = Math.atan2(ly - ry, lx - rx);

    // 🔥 AR draw
    ctx.save();

    ctx.translate(
        midX,
        midY + height * 0.12
    );

    ctx.rotate(angle);

    ctx.drawImage(
        cloth,
        -width / 2,
        -height * 0.08,
        width,
        height
    );

    ctx.restore();

    // next frame
    requestAnimationFrame(() =>
        drawAR({ ctx, video, canvas, pose, cloth })
    );
}
