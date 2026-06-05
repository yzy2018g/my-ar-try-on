import { startCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { setStatus, showLoading, hideLoading } from "./ui.js";
import { log, step, error, led, safeGetEl } from "./debug.js";
import { drawAR } from "./renderer.js";
import { selectClothAPI } from "./api/gradio.js";
import {
    initPoseDebug,
    updatePoseDebug
} from "./debugPoseOverlay.js";

window.appLoaded = true;

let video, canvas, ctx, startBtn;
let pose = null;

let cloth = new Image();
let clothReady = false;

let currentPrimary = null;
let currentFallback = null;

window.addEventListener("DOMContentLoaded", initApp);

function initApp() {
    video = safeGetEl("webcam");
    canvas = safeGetEl("arCanvas");
    startBtn = safeGetEl("startBtn");

    ctx = canvas.getContext("2d");

    log("INIT APP READY");

    startBtn.addEventListener("click", onStart);

    initPoseDebug();
}

/* =========================
   INIT
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
   CLOTH ENTRY (FIXED FINAL)
========================= */
window.selectCloth = async function (src) {
    try {
        showLoading("衣服去背中...");
        led("led-api", false);

        const raw = await selectClothAPI(src);

        if (!raw) {
            throw new Error("API 沒回傳圖片");
        }

        /* =========================
           normalize result
        ========================= */
        const result = normalizeResult(raw);

        currentPrimary = result.primary;
        currentFallback = result.fallback;

        step("CLOTH PRIMARY", currentPrimary);
        step("CLOTH FALLBACK", currentFallback);

        clothReady = false;

        loadImage(currentPrimary);

    } catch (e) {
        error("FLOW", e.message);
        hideLoading();
        setStatus("❌ " + e.message);
    }
};

/* =========================
   IMAGE LOADER (SAFE)
========================= */
function loadImage(url) {

    cloth = new Image();
    cloth.crossOrigin = "anonymous";

    cloth.onload = () => {
        clothReady = true;
        hideLoading();
        led("led-api", true);
        setStatus("衣服載入完成 ✓");
    };

    cloth.onerror = () => {

        console.warn("primary failed:", url);

        if (currentFallback && url !== currentFallback) {
            step("FALLBACK TRY", currentFallback);
            loadImage(currentFallback);
        } else {
            error("FLOW", "圖片載入失敗");
            hideLoading();
            setStatus("❌ 圖片載入失敗");
        }
    };

    cloth.src = url;
}

/* =========================
   NORMALIZER (MATCH API)
========================= */
function normalizeResult(raw) {

    if (typeof raw === "string") {
        return {
            primary: raw,
            fallback: raw.replace("/file=", "/gradio_api/file/")
        };
    }

    return {
        primary: raw?.primary || raw?.url || raw?.data?.[0]?.url || raw?.path,
        fallback: raw?.fallback || null
    };
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

    updatePoseDebug(poseResult);
}
