import { led } from "./debug.js";

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

        ctx.drawImage(
            cloth,
            100,
            100,
            200,
            200
        );

        led("led-render", true);

    } else {

        led("led-render", false);

    }
}
