export function drawAR({
    ctx,
    video,
    canvas,
    pose,
    cloth,
    clothReady
}) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (clothReady && cloth) {
        ctx.drawImage(cloth, 100, 100, 200, 200);
    }
}
