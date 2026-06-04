import { led } from "./debug.js";

export function drawAR({
    ctx,
    video,
    canvas,
    poseResult,
    cloth,
    clothReady
}) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (
        !clothReady ||
        !poseResult?.landmarks?.length
    ) {
        led("led-render", false);
        return;
    }

    const lm = poseResult.landmarks[0];

    const leftShoulder = lm[11];
    const rightShoulder = lm[12];

    if (!leftShoulder || !rightShoulder) {
        led("led-render", false);
        return;
    }

    const lx = leftShoulder.x * canvas.width;
    const ly = leftShoulder.y * canvas.height;

    const rx = rightShoulder.x * canvas.width;
    const ry = rightShoulder.y * canvas.height;

    const centerX = (lx + rx) / 2;
    const centerY = (ly + ry) / 2;

    const shoulderWidth = Math.hypot(rx - lx, ry - ly);

    const width = shoulderWidth * 2;
    const height = width * 1.2;

    ctx.drawImage(
        cloth,
        centerX - width / 2,
        centerY - height * 0.2,
        width,
        height
    );

    led("led-render", true);
}
