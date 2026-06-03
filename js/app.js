window.appLoaded = true;
console.log("APP LOADED OK");

/* =========================
   SAFE IMPORT
========================= */
const uploadImage = window.uploadImage;
const runTryOn = window.runTryOn;
const getResult = window.getResult;

/* fallback protection */
if (!uploadImage || !runTryOn || !getResult) {
    console.warn("API MODULE NOT READY");
}

/* =========================
   IMPORT UI / AI
========================= */
import { startCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { setStatus, showLoading, hideLoading } from "./ui.js";

/* =========================
   DEBUG SYSTEM (SAFE)
========================= */
function safeGet(id) {
    return document.getElementById(id);
}

function log(msg) {
    console.log(msg);

    const box = safeGet("debugBox");
    if (box) {
        box.innerText += "\n" + msg;
        box.scrollTop = box.scrollHeight;
    }
}

function step(tag, msg) {
    log(`👉 ${tag}: ${msg}`);
}

function error(tag, msg) {
    log(`❌ ${tag}: ${msg}`);
    console.error(tag, msg);
}

function led(id, ok) {
    const el = safeGet(id);
    if (!el) return;

    const base = el.innerText?.split(":")[0] || id;
    el.innerText = `${base}: ${ok ? "🟢" : "🔴"}`;
}

/* =========================
   DOM SAFE INIT
========================= */
const video = safeGet("webcam");
const canvas = safeGet("arCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const startBtn = safeGet("startBtn");

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
if (startBtn) {
    startBtn.addEventListener("click", async () => {

        step("CLICK", "OK");

        startBtn.style.display = "none";
        setStatus("初始化 AI 模型...");

        try {
            pose = await initPose();
            led("led-pose", true);
            step("POSE", "OK");

            await startCamera(video);
            led("led-camera", true);
            step("CAMERA", "OK");

            if (video) {
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
            }

            setStatus("系統就緒 ✓");
            step("SYSTEM", "READY");

            loop();

        } catch (err) {
            error("INIT", err.message);
        }
    });
}

/* =========================
   CAPTURE
========================= */
function captureFrame(video) {

    if (!video) throw new Error("NO VIDEO");

    const c = document.createElement("canvas");
    c.width = video.videoWidth || 640;
    c.height = video.videoHeight || 480;

    const cctx = c.getContext("2d");
    cctx.drawImage(video, 0, 0);

    return new Promise(resolve => {
        c.toBlob(blob => {
            resolve(new File([blob], "person.jpg", { type: "image/jpeg" }));
        }, "image/jpeg");
    });
}

/* =========================
   SELECT CLOTH (CRASH SAFE)
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

        /* safe UI */
        const items = document.querySelectorAll(".preview-box img");
        if (items?.forEach) {
            items.forEach(i => i.classList.remove("active"));
        }

        if (el?.classList) {
            el.classList.add("active");
        }

        showLoading("AI 試衣中...");

        /* STEP 1 */
        step("STEP 1", "load cloth");

        const res = await fetch(src);
        const blob = await res.blob();
        const clothFile = new File([blob], "cloth.jpg", { type: blob.type });

        /* STEP 2 */
        step("STEP 2", "capture");

        const personFile = await captureFrame(video);

        /* STEP 3 */
        step("STEP 3", "upload person");

        const personPath = await uploadImage(personFile);
        step("PERSON", personPath || "NULL");

        if (!personPath) throw new Error("person upload failed");

        /* STEP 4 */
        step("STEP 4", "upload cloth");

        const clothPath = await uploadImage(clothFile);
        step("CLOTH", clothPath || "NULL");

        if (!clothPath) throw new Error("cloth upload failed");

        /* STEP 5 */
        step("STEP 5", "run AI");

        const eventId = await runTryOn(personPath);
        step("EVENT", eventId || "NULL");

        if (!eventId) throw new Error("no eventId");

        /* STEP 6 */
        step("STEP 6", "result");

        const rawResult = await getResult(eventId);
        step("RAW", rawResult ? "OK" : "NULL");

        /* STEP 7 */
        step("STEP 7", "parse");

        let data = null;
        try {
            const match = rawResult?.match(/\{.*\}/s);
            data = match ? JSON.parse(match[0]) : null;
        } catch (e) {
            error("PARSE", e.message);
        }

        const url = data?.url || data?.data?.[0];

        if (!url) throw new Error("no image url");

        cloth.crossOrigin = "anonymous";
        cloth.src = url;

        cloth.onload = () => {
            clothReady = true;
            hideLoading();
            led("led-api", true);
            step("SUCCESS", "DONE");
            setStatus("AI 試衣成功 ✓");
        };

    } catch (err) {
        error("API FLOW", err.message);
        hideLoading();
        led("led-api", false);
        setStatus("❌ " + err.message);

    } finally {
        isProcessing = false;
    }
};

/* =========================
   LOOP
========================= */
function loop() {

    if (!ctx || !video) return;

    led("led-render", true);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let lm = null;

    if (pose && video.readyState >= 2) {
        try {
            const res = pose.detectForVideo(video, performance.now());
            lm = res.landmarks?.[0] || null;
        } catch (e) {}
    }

    if (clothReady && lm) {

        const l = lm[11];
        const r = lm[12];

        const lx = l.x * canvas.width;
        const ly = l.y * canvas.height;
        const rx = r.x * canvas.width;
        const ry = r.y * canvas.height;

        const midX = (lx + rx) / 2;
        const midY = (ly + ry) / 2;

        const shoulder = Math.hypot(lx - rx, ly - ry);

        const width = shoulder * 2.1;
        const ratio = cloth.naturalHeight / cloth.naturalWidth;
        const height = width * ratio;

        const angle = Math.atan2(ly - ry, lx - rx);

        ctx.save();
        ctx.translate(midX, midY + height * 0.12);
        ctx.rotate(angle);
        ctx.drawImage(cloth, -width / 2, -height * 0.08, width, height);
        ctx.restore();
    }

    requestAnimationFrame(loop);
}
