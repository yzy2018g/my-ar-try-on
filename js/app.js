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

    try {

        startBtn.style.display = "none";

        setStatus("初始化 AI 模型...");

        pose = await initPose();
        led("led-pose", true);
        step("POSE", "OK");

        await startCamera(video);
        led("led-camera", true);
        step("CAMERA", "OK");

        if (canvas && video) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
        }

        setStatus("系統就緒 ✓");
        step("SYSTEM", "READY");

        loop();

    } catch (err) {

        error("INIT", err.message);

        setStatus("❌ 初始化失敗");
    }
});

/* =========================
   CAPTURE FRAME
========================= */
function captureFrame(video) {

    if (!video) {
        throw new Error("NO VIDEO");
    }

    const c = document.createElement("canvas");

    c.width = video.videoWidth || 640;
    c.height = video.videoHeight || 480;

    const cctx = c.getContext("2d");

    cctx.drawImage(video, 0, 0);

    return new Promise((resolve, reject) => {

        c.toBlob(blob => {

            if (!blob) {
                reject(new Error("CAPTURE FAILED"));
                return;
            }

            resolve(
                new File(
                    [blob],
                    "person.jpg",
                    { type: "image/jpeg" }
                )
            );

        }, "image/jpeg");

    });
}

/* =========================
   CLOTH SELECT
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

        showLoading("AI 試衣中...");

        document
            .querySelectorAll(".preview-box img")
            .forEach(img => img.classList.remove("active"));

        el?.classList?.add("active");

        /* STEP 1 */
        step("STEP 1", "load cloth");

        const res = await fetch(src);

        if (!res.ok) {
            throw new Error("FETCH CLOTH FAILED");
        }

        const blob = await res.blob();

        const clothFile = new File(
            [blob],
            "cloth.jpg",
            { type: blob.type || "image/png" }
        );

        /* STEP 2 */
        step("STEP 2", "capture person");

        const personFile = await captureFrame(video);

        /* STEP 3 */
        step("STEP 3", "upload person");

        const personPath = await uploadImage(personFile);

        step("PERSON", personPath || "NULL");

        if (!personPath) {
            throw new Error("person upload failed");
        }

        /* STEP 4 */
        step("STEP 4", "upload cloth");

        const clothPath = await uploadImage(clothFile);

        step("CLOTH", clothPath || "NULL");

        if (!clothPath) {
            throw new Error("cloth upload failed");
        }

        /* STEP 5 */
        step("STEP 5", "run AI");

        const eventId = await runTryOn(personPath);

        step("EVENT", eventId || "NULL");

        if (!eventId) {
            throw new Error("no event id");
        }

        /* STEP 6 */
        step("STEP 6", "get result");

        const raw = await getResult(eventId);

        step("RAW", raw ? "OK" : "NULL");

        /* STEP 7 */
        step("STEP 7", "parse");

        let data = null;

        try {

            const match = raw?.match(/\{.*\}/s);

            data = match
                ? JSON.parse(match[0])
                : null;

        } catch (e) {

            error("PARSE", e.message);
        }

        const url =
            data?.url ||
            data?.data?.[0];

        if (!url) {
            throw new Error("no image url");
        }

        cloth = new Image();

        cloth.crossOrigin = "anonymous";

        cloth.onload = () => {

            clothReady = true;

            hideLoading();

            led("led-api", true);

            step("SUCCESS", "DONE");

            setStatus("AI 試衣成功 ✓");
        };

        cloth.onerror = () => {

            throw new Error("image load failed");
        };

        cloth.src = url;

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
   LOOP
========================= */
function loop() {

    try {

        drawAR({
            ctx,
            video,
            canvas,
            pose,
            cloth
        });

    } catch (e) {

        error("RENDER", e.message);
    }

    requestAnimationFrame(loop);
}
