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

window.selectCloth = async function (src, el) {

    if (isProcessing) return;
    isProcessing = true;

    try {
        showLoading("AI 試衣中...");

        const personFile = await captureFrame(video);

        const clothBlob = await (await fetch(src)).blob();
        const clothFile = new File([clothBlob], "cloth.jpg");

        const personPath = await uploadImage(personFile);
        const clothPath = await uploadImage(clothFile);

        const eventId = await runTryOn(personPath);

        const raw = await getResult(eventId);
        const data = parseResult(raw);

        const url = data?.url || data?.data?.[0];

        cloth.crossOrigin = "anonymous";
        cloth.src = url;

        cloth.onload = () => {
            clothReady = true;
            hideLoading();
            setStatus("OK");
        };

    } catch (e) {
        error("FLOW", e.message);
    }

    isProcessing = false;
};

function loop() {
    drawAR({ ctx, video, canvas, pose, cloth, clothReady });
    requestAnimationFrame(loop);
}
