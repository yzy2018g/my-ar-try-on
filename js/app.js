window.appLoaded = true;
console.log("APP LOADED OK");

/* =========================
   IMPORT (建議已用 window api.js)
========================= */
const uploadImage = window.uploadImage;
const runTryOn = window.runTryOn;
const getResult = window.getResult;

import { startCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { setStatus, showLoading, hideLoading } from "./ui.js";

/* =========================
   📱 DEBUG SYSTEM（手機強化）
========================= */
function log(msg) {
    console.log(msg);

    const box = document.getElementById("debugBox");
    if (box) {
        box.innerText += msg + "\n";
        box.scrollTop = box.scrollHeight;
    }
}

function step(tag, msg) {
    const text = `👉 ${tag}: ${msg}`;
    log(text);
}

function error(tag, msg) {
    const text = `❌ ${tag}: ${msg}`;
    log(text);
    console.error(text);
}

function led(id, ok) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = el.innerText.split(":")[0] + ": " + (ok ? "🟢" : "🔴");
}

/* =========================
   DOM
========================= */
const video = document.getElementById("webcam");
const canvas = document.getElementById("arCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");

/* =========================
   STATE
========================= */
let pose = null;
let cloth = new Image();
let clothReady = false;
let isProcessing = false;

/* =========================
   START SYSTEM
========================= */
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

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        setStatus("系統就緒 ✓");
        step("SYSTEM", "READY");

        loop();

    } catch (err) {
        error("INIT", err.message);
    }
});

/* =========================
   CAPTURE PERSON FRAME
========================= */
function captureFrame(video) {
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;

    const ctx = c.getContext("2d");
    ctx.drawImage(video, 0, 0);

    return new Promise(resolve => {
        c.toBlob(blob => {
            resolve(new File([blob], "person.jpg", { type: "image/jpeg" }));
        }, "image/jpeg");
    });
}

/* =========================
   CLOTH SELECT + API FLOW
========================= */
window.selectCloth = async function (src, el) {

    if (isProcessing) {
        step("IGNORE", src);
        return;
    }

    isProcessing = true;

    step("SELECT", src);
    led("led-api", false);

    document.querySelectorAll(".preview-box img")
        .forEach(i => i.classList.remove("active"));
    el.classList.add("active");

    showLoading("AI 試衣中...");

    try {
        /* STEP 1 */
        step("STEP 1", "load cloth");

        const res = await fetch(src);
        const blob = await res.blob();
        const clothFile = new File([blob], "cloth.jpg", { type: blob.type });

        /* STEP 2 */
        step("STEP 2", "capture person");

        const personFile = await captureFrame(video);

        /* STEP 3 */
        step("STEP 3", "upload person");

        const personPath = await uploadImage(personFile);
        step("PERSON PATH", personPath || "NULL");

        if (!personPath) throw new Error("person upload failed");

        /* STEP 4 */
        step("STEP 4", "upload cloth");

        const clothPath = await uploadImage(clothFile);
        step("CLOTH PATH", clothPath || "NULL");

        if (!clothPath) throw new Error("cloth upload failed");

        /* STEP 5 */
        step("STEP 5", "run AI");

        const eventId = await runTryOn(personPath);
        step("EVENT ID", eventId || "NULL");

        if (!eventId) throw new Error("no eventId");

        /* STEP 6 */
        step("STEP 6", "get result");

        const rawResult = await getResult(eventId);
        step("RAW RESULT", rawResult ? "OK" : "NULL");

        /* STEP 7 */
        step("STEP 7", "parse result");

        const jsonMatch = rawResult.match(/\{.*\}/s);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        const url = data?.url || data?.data?.[0];

        if (!url) throw new Error("no image url");

        cloth.crossOrigin = "anonymous";
        cloth.src = url;

        cloth.onload = () => {
            clothReady = true;
            hideLoading();
            led("led-api", true);
            step("SUCCESS", "AI TRY-ON DONE");
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
