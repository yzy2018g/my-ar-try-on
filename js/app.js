import { uploadImage, runTryOn, getResult } from "./api.js";
import { startCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { setStatus, showLoading, hideLoading } from "./ui.js";
import { log, step, error, led, safeGetEl } from "./debug.js";
import { drawAR } from "./renderer.js";

window.appLoaded = true;

/* =========================
   STATE
========================= */
let video, canvas, ctx, startBtn;
let pose = null;
let cloth = new Image();
let clothReady = false;
let isProcessing = false;

/* =========================
   INIT APP (FIX: DOM SAFE)
========================= */
window.addEventListener("DOMContentLoaded", initApp);

function initApp() {
    video = safeGetEl("webcam");
    canvas = safeGetEl("arCanvas");
    startBtn = safeGetEl("startBtn");

    ctx = canvas?.getContext("2d");

    log("INIT APP READY");

    if (!startBtn) {
        error("DOM", "startBtn not found");
        return;
    }

    startBtn.addEventListener("click", onStart);
}

/* =========================
   START CAMERA + POSE
========================= */
async function onStart() {
    try {
        step("CLICK", "OK");
        setStatus("初始化...");

        startBtn.style.display = "none";

        pose = await initPose();
        led("led-pose", true);

        await startCamera(video);
        led("led-camera", true);

        if (canvas && video) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
        }

        setStatus("READY ✓");
        step("SYSTEM", "READY");

        loop();

    } catch (e) {
        error("INIT", e.message);
        setStatus("❌ INIT FAIL");
    }
}

/* =========================
   CLOTH SELECT
========================= */
window.selectCloth = async function (src, el) {

    if (isProcessing) return;
    isProcessing = true;

    try {
        showLoading("AI 試衣中...");
        led("led-api", false);

        /* UI */
        document.querySelectorAll(".preview-box img")
            .forEach(i => i.classList.remove("active"));
        el?.classList?.add("active");

        /* STEP 1: cloth */
        step("STEP 1", "load cloth");
        const blob = await (await fetch(src)).blob();
        const clothFile = new File([blob], "cloth.jpg");

        /* STEP 2: person */
        step("STEP 2", "capture");
        const personFile = await captureFrame(video);

        /* STEP 3: upload */
        const personPath = await uploadImage(personFile);
        const clothPath = await uploadImage(clothFile);

        if (!personPath || !clothPath) {
            throw new Error("UPLOAD FAIL");
        }

        /* STEP 4: run */
        const eventId = await runTryOn(personPath);
        if (!eventId) throw new Error("NO EVENT");

        /* STEP 5: result */
        const raw = await getResult(eventId);
        const data = parseResult(raw);

        const url = data?.url || data?.data?.[0];
        if (!url) throw new Error("NO IMAGE URL");

        /* APPLY CLOTH */
        cloth.crossOrigin = "anonymous";
        cloth.src = url;

        cloth.onload = () => {
            clothReady = true;
            hideLoading();
            led("led-api", true);
            setStatus("AI 試衣成功 ✓");
        };

        cloth.onerror = () => {
            throw new Error("IMAGE LOAD FAIL");
        };

    } catch (e) {
        error("FLOW", e.message);
        hideLoading();
        led("led-api", false);
        setStatus("❌ " + e.message);

    } finally {
        isProcessing = false;
    }
};

/* =========================
   LOOP (SAFE)
========================= */
function loop() {
    if (!ctx || !video || !canvas) return;

    try {
        drawAR({
            ctx,
            video,
            canvas,
            pose,
            cloth,
            clothReady
        });
    } catch (e) {
        error("RENDER", e.message);
    }

    requestAnimationFrame(loop);
}

/* =========================
   CAPTURE
========================= */
function captureFrame(video) {
    if (!video) throw new Error("NO VIDEO");

    const c = document.createElement("canvas");
    c.width = video.videoWidth || 640;
    c.height = video.videoHeight || 480;

    c.getContext("2d").drawImage(video, 0, 0);

    return new Promise(resolve => {
        c.toBlob(blob => {
            resolve(new File([blob], "person.jpg"));
        }, "image/jpeg");
    });
}

/* =========================
   PARSE SAFE
========================= */
function parseResult(raw) {
    try {
        const match = raw?.match(/\{.*\}/s);
        return match ? JSON.parse(match[0]) : null;
    } catch (e) {
        error("PARSE", e.message);
        return null;
    }
}
