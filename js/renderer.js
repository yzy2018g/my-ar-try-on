export function drawAR({
    ctx,
    video,
    canvas,
    pose,
    cloth,
    clothReady
}) {

    if (!ctx || !video) return;

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

            const res =
                pose.detectForVideo(
                    video,
                    performance.now()
                );

            lm = res.landmarks?.[0] || null;

        } catch (e) {}
    }

    if (!clothReady || !lm) {
        return;
    }

    const l = lm[11];
    const r = lm[12];

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

    const height =
        width * ratio;

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
}
