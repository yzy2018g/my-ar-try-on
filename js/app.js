import { uploadImage, runTryOn, getResult } from "./api.js";
import { startCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { setStatus, showLoading, hideLoading } from "./ui.js";
import { log, step, error, led, safeGetEl } from "./debug.js";
import { drawAR } from "./renderer.js";

window.appLoaded = true;
console.log("APP LOADED OK");


/* =========================
   DOM
========================= */
const video = safeGetEl("webcam");
const canvas = safeGetEl("arCanvas");
const ctx = canvas?.getContext("2d");
const startBtn = safeGetEl("startBtn");

/* =========================
   STATE
========================= */
let pose = null;
let cloth = new Image();
let clothReady = false;
let isProcessing = false;

/* =========================
   START
========================= */
startBtn?.addEventListener("click", async () => {

    step("CLICK", "OK");

    startBtn.style.display = "none";
    setStatus("初始化 AI 模型...");

    try {
        pose = await initPose();
        led("led-pose", true);

        await startCamera(video);
        led("led-camera", true);

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        setStatus("系統就緒 ✓");
        step("SYSTEM", "READY");

        drawAR({ ctx, video, canvas, pose, cloth, clothReady });

    } catch (err) {
        error("INIT", err.message);
    }
});

/* =========================
   CAPTURE
========================= */
function captureFrame(video) {
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;

    const cctx = c.getContext("2d");
    cctx.drawImage(video, 0, 0);

    return new Promise(resolve => {
        c.toBlob(blob => {
            resolve(new File([blob], "person.jpg", { type: "image/jpeg" }));
        }, "image/jpeg");
    });
}

/* =========================
   SELECT CLOTH
========================= */
window.selectCloth = async function (src, el) {

    if (isProcessing) {
        step("IGNORE", src);
        return;
    }

    isProcessing = true;

    step("SELECT", src);
    led("led-api", false);

    try {
        const api = getAPI();

        const res = await fetch(src);
        const blob = await res.blob();
        const clothFile = new File([blob], "cloth.jpg", { type: blob.type });

        const personFile = await captureFrame(video);

        const personPath = await api.uploadImage(personFile);
        const clothPath = await api.uploadImage(clothFile);

        const eventId = await api.runTryOn(personPath);

        const raw = await api.getResult(eventId);

        const match = raw?.match(/\{.*\}/s);
        const data = match ? JSON.parse(match[0]) : null;

        const url = data?.url || data?.data?.[0];

        cloth.crossOrigin = "anonymous";
        cloth.src = url;

        cloth.onload = () => {
            clothReady = true;
            hideLoading();
            led("led-api", true);
            setStatus("AI 試衣成功 ✓");
        };

    } catch (e) {
        error("FLOW", e.message);
        hideLoading();
    }

    isProcessing = false;
};
