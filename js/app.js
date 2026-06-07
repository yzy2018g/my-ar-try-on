import { initCamera } from "./camera.js";
import { initPose, sendPose, onPose } from "./pose.js";
import { initRenderer, updateClothFromPose, startRenderLoop, setCloth } from "./renderer.js";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

async function start() {
    await initCamera(video);

    await initPose();
    onPose(updateClothFromPose);

    initRenderer(canvas, video);

    startRenderLoop();

    loopPose();
}

async function loopPose() {
    async function loop() {
        await sendPose(video);
        requestAnimationFrame(loop);
    }
    loop();
}
