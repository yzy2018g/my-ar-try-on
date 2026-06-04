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
   INIT
========================= */
window.addEventListener("DOMContentLoaded", initApp);

function initApp() {
    video = safeGetEl("webcam");
    canvas = safeGetEl("arCanvas");
    startBtn = safeGetEl("startBtn");

    ctx = canvas?.getContext("2d");

    log("INIT APP READY");

    startBtn?.addEventListener("click", onStart);
}

/* =========================
   START CAMERA + POSE
========================= */
async function onStart() {
    try {
        step("CLICK", "OK");

        startBtn.style.display = "none";
        setStatus("初始化 AI 模型...");

        pose = await initPose();
        led("led-pose", true);

        await startCamera(video);
        led("led-camera", true);

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        setStatus("READY ✓");

        loop();

    } catch (e) {
        error("INIT", e.message);
        setStatus("INIT FAIL");
    }
}

/* =========================
   CLOTH SELECT → API REMOVE BG
========================= */
window.selectCloth = async function (src) {

    if (isProcessing) return;
    isProcessing = true;

    try {
        step("CLOTH", "load");

        showLoading("衣服去背中...");
        led("led-api", false);

        /* 1️⃣ load cloth image */
        const clothBlob = await (await fetch(src)).blob();

        /* 2️⃣ upload cloth to API (REMOVE BG) */
        const form = new FormData();
        form.append("file", clothBlob, "cloth.png");

        const res = await fetch(
            "https://michaelyo-my-ar-cloth-api.hf.space/remove_bg",
            {
                method: "POST",
                body: form
            }
        );

        if (!res.ok) {
            throw new Error("API REMOVE BG FAIL");
        }

        const data = await res.json();

        const url = data?.url || data?.data?.[0];

        if (!url) {
            throw new Error("NO CLOTH URL");
        }

        /* 3️⃣ apply cloth */
        cloth = new Image();
        cloth.crossOrigin = "anonymous";
        cloth.src = url;

        cloth.onload = () => {
            clothReady = true;
            hideLoading();
            led("led-api", true);
            setStatus("衣服載入完成 ✓");
        };

        cloth.onerror = () => {
            throw new Error("CLOTH LOAD FAIL");
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
   LOOP (AR RENDER)
========================= */
function loop() {

    if (!ctx || !video || !canvas) return;

    drawAR({
        ctx,
        video,
        canvas,
        pose,
        cloth,
        clothReady
    });

    requestAnimationFrame(loop);
}
