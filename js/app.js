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
   CLOTH ENTRY (FINAL FIXED)
========================= */
window.selectCloth = async function (src) {
    try {
        showLoading("衣服去背中...");
        led("led-api", false);

        /* =========================
           1️⃣ get backend result url
        ========================= */
        const rawUrl = await selectClothAPI(src);

        if (!rawUrl) {
            throw new Error("API 沒回傳圖片路徑");
        }

        step("CLOTH RAW", rawUrl);

        /* =========================
           2️⃣ normalize url (keep fallback)
        ========================= */
        const finalUrl = normalizeGradioUrl(rawUrl);

        step("CLOTH FINAL", finalUrl);

        clothReady = false;

        /* =========================
           3️⃣ 🔥 FIX: use blob (NO CORS ISSUE)
        ========================= */
        const res = await fetch(finalUrl);
        if (!res.ok) {
            throw new Error("圖片下載失敗 HTTP " + res.status);
        }

        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);

        /* =========================
           4️⃣ render image
        ========================= */
        cloth = new Image();
        cloth.crossOrigin = "anonymous";

        cloth.onload = () => {
            clothReady = true;
            hideLoading();
            led("led-api", true);
            setStatus("衣服載入完成 ✓");
        };

        cloth.onerror = () => {
            error("FLOW", "blob 圖片載入失敗");
            hideLoading();
            setStatus("❌ 圖片載入失敗");
        };

        cloth.src = objectUrl;

    } catch (e) {
        error("FLOW", e.message);
        hideLoading();
        setStatus("❌ " + e.message);
    }
};

/* =========================
   🔥 URL NORMALIZER
========================= */
function normalizeGradioUrl(path) {
    if (!path) return null;

    if (path.startsWith("http")) return path;

    let clean = path
        .replace(/^\/+/, "")
        .replace(/^tmp\/gradio\//, "")
        .replace(/^data\//, "");

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
