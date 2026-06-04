/* =========================
   AR RENDER MODULE
========================= */

import { led } from "./debug.js";

export function drawAR({
    ctx,
    video,
    canvas,
    pose,
    cloth
}) {

    if (!ctx || !video || !canvas) {
        console.log("RENDER: missing ctx/video/canvas");
        return;
    }

    led("led-render", true);

    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    let lm = null;

    if (pose && video.readyState >= 2) {
        try {
            const result =
                pose.detectForVideo(
                    video,
                    performance.now()
                );

            lm = result?.landmarks?.[0] || null;

        } catch (e) {
            console.error("POSE ERROR", e);
        }
    }

    /* 圖片是否已載入 */
    const clothReady =
        cloth &&
        cloth.complete &&
        cloth.naturalWidth > 0;

    if (!clothReady) {

        requestAnimationFrame(() =>
            drawAR({
                ctx,
                video,
                canvas,
                pose,
                cloth
            })
        );

        return;
    }

    if (!lm) {

        requestAnimationFrame(() =>
            drawAR({
                ctx,
                video,
                canvas,
                pose,
                cloth
            })
        );

        return;
    }

    const l = lm[11];
    const r = lm[12];

    if (!l || !r) {

        requestAnimationFrame(() =>
            drawAR({
                ctx,
                video,
                canvas,
                pose,
                cloth
            })
        );

        return;
    }

    const lx = l.x * canvas.width;
    const ly = l.y * canvas.height;

    const rx = r.x * canvas.width;
    const ry = r.y * canvas.height;

    const midX = (lx + rx) / 2;
    const midY = (ly + ry) / 2;

    const shoulder =
        Math.hypot(
            lx - rx,
            ly - ry
        );

    const width = shoulder * 2.1;

    const ratio =
        cloth.naturalHeight /
        cloth.naturalWidth;

    const height = width * ratio;

    const angle =
        Math.atan2(
            ly - ry,
            lx - rx
        );

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

    requestAnimationFrame(() =>
        drawAR({
            ctx,
            video,
            canvas,
            pose,
            cloth
        })
    );
}
