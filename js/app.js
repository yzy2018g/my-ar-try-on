import { startCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { setStatus, showLoading, hideLoading } from "./ui.js";
import { log, step, error, led, safeGetEl } from "./debug.js";
import { drawAR } from "./renderer.js";
import { selectClothAPI } from "./api/gradio.js";

window.appLoaded = true;

let video, canvas, ctx, startBtn;
let pose = null;

let cloth = new Image();
let clothReady = false;

window.addEventListener("DOMContentLoaded", initApp);

function initApp() {
    video = safeGetEl("webcam");
    canvas = safeGetEl("arCanvas");
    startBtn = safeGetEl("startBtn");

    ctx = canvas.getContext("2d");

    log("INIT APP READY");

    startBtn.addEventListener("click", onStart);
}

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
   CLOTH ENTRY (FIXED)
========================= */
window.selectCloth = async function (src) {
    try {
        showLoading("衣服去背中...");
        led("led-api", false);

        const rawUrl = await selectClothAPI(src);

        if (!rawUrl) {
            throw new Error("API 沒回傳圖片路徑");
        }

        step("CLOTH URL", rawUrl);

        const finalUrl = normalizeGradioUrl(rawUrl);

        step("CLOTH FINAL", finalUrl);

        clothReady = false;

        cloth = new Image();
        cloth.crossOrigin = "anonymous";

        /* =========================
           IMPORTANT: preload check
        ========================= */
        cloth.onload = () => {
            clothReady = true;
            hideLoading();
            led("led-api", true);
            setStatus("衣服載入完成 ✓");
        };

        cloth.onerror = (e) => {
            console.error("IMAGE LOAD FAIL:", finalUrl);
            error("FLOW", "圖片載入失敗: " + finalUrl);
            hideLoading();
            setStatus("❌ 圖片載入失敗");
        };

        cloth.src = finalUrl;

    } catch (e) {
        error("FLOW", e.message);
        hideLoading();
        setStatus("❌ " + e.message);
    }
};

/* =========================
   🔥 FIX: Gradio URL NORMALIZER
========================= */
function normalizeGradioUrl(path) {
    if (!path) return null;

    // already full url
    if (path.startsWith("http")) return path;

    // clean internal formats
    let clean = path
        .replace(/^\/+/, "")
        .replace(/^tmp\/gradio\//, "")
        .replace(/^data\//, "");

    // 🔥 most stable endpoint for HF Gradio
    return `https://michaelyo-my-ar-cloth-api.hf.space/file=${clean}`;
}

/* =========================
   LOOP
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
