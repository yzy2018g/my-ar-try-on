import { uploadImage, runTryOn, getResult, parseResult } from "./api.js";
import { startCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { setStatus, showLoading, hideLoading } from "./ui.js";
import { log, step, error, led, safeGetEl } from "./debug.js";
import { drawAR } from "./renderer.js";
import { captureFrame } from "./utils/capture.js";

window.appLoaded = true;

let video, canvas, ctx, startBtn;
let pose = null;
let cloth = new Image();
let clothReady = false;
let isProcessing = false;

window.addEventListener("DOMContentLoaded", initApp);

function initApp() {
    video = safeGetEl("webcam");
    canvas = safeGetEl("arCanvas");
    startBtn = safeGetEl("startBtn");

    ctx = canvas?.getContext("2d");

    log("INIT APP READY");

    startBtn?.addEventListener("click", onStart);
}

async function onStart() {
    try {
        step("CLICK", "OK");

        startBtn.style.display = "none";
        setStatus("初始化...");

        pose = await initPose();
        await startCamera(video);

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        setStatus("READY ✓");
        loop();

    } catch (e) {
        error("INIT", e.message);
    }
}

window.selectCloth = async (src) => {

    const clothBlob = await (await fetch(src)).blob();

    const form = new FormData();
    form.append("file", clothBlob);

    const res = await fetch(API + "/process_cloth", {
        method: "POST",
        body: form
    });

    const data = await res.json();

    cloth.src = data.url;
    clothReady = true;
};

function loop() {
    drawAR({ ctx, video, canvas, pose, cloth, clothReady });
    requestAnimationFrame(loop);
}
