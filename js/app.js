import { uploadImage, runTryOn, getResult, parseResult } from "./api.js";
import { startCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { setStatus, showLoading, hideLoading } from "./ui.js";
import { log, step, error, led, safeGetEl } from "./debug.js";
import { drawAR } from "./renderer.js";

window.appLoaded = true;

const video = safeGetEl("webcam");
const canvas = safeGetEl("arCanvas");
const ctx = canvas?.getContext("2d");
const startBtn = safeGetEl("startBtn");

let pose = null;
let cloth = new Image();
let clothReady = false;
let isProcessing = false;

/* START */
startBtn?.addEventListener("click", async () => {
    try {
        setStatus("初始化...");

        pose = await initPose();
        await startCamera(video);

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        loop();
    } catch (e) {
        error("INIT", e.message);
    }
});

/* SELECT CLOTH */
window.selectCloth = async (src, el) => {

    if (isProcessing) return;
    isProcessing = true;

    try {
        showLoading("AI 試衣中...");

        const blob = await (await fetch(src)).blob();
        const clothFile = new File([blob], "cloth.jpg");

        const personFile = await captureFrame(video);

        const apiPerson = await uploadImage(personFile);
        const apiCloth = await uploadImage(clothFile);

        const eventId = await runTryOn(apiPerson);

        const raw = await getResult(eventId);
        const data = parseResult(raw);

        cloth.crossOrigin = "anonymous";
        cloth.src = data.url || data.data?.[0];

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

/* LOOP */
function loop() {
    drawAR({ ctx, video, canvas, pose, cloth, clothReady });
    requestAnimationFrame(loop);
}

/* CAPTURE */
function captureFrame(video) {
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;

    c.getContext("2d").drawImage(video, 0, 0);

    return new Promise(r =>
        c.toBlob(b => r(new File([b], "person.jpg")))
    );
}
