window.appLoaded = true;
console.log("APP LOADED OK");

import { startCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { uploadImage, runTryOn, getResult } from "./api.js";
import { setStatus, showLoading, hideLoading } from "./ui.js";

/* =========================
   📱 DEBUG SYSTEM
========================= */
function log(msg) {
    console.log(msg);
    const box = document.getElementById("debugBox");
    if (box) {
        box.innerText += msg + "\n";
        box.scrollTop = box.scrollHeight;
    }
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

/* 🚨 防連點關鍵 */
let isProcessing = false;

/* =========================
   START
========================= */
startBtn.addEventListener("click", async () => {

    log("👉 CLICK OK");

    startBtn.style.display = "none";
    setStatus("初始化 AI 模型...");

    try {
        pose = await initPose();
        led("led-pose", true);
        log("👉 POSE OK");

        await startCamera(video);
        led("led-camera", true);
        log("👉 CAMERA OK");

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        setStatus("系統就緒 ✓");
        log("👉 SYSTEM READY");

        loop();

    } catch (err) {
        log("❌ INIT ERROR: " + err.message);
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
   CLOTH SELECT + AI FLOW
========================= */
window.selectCloth = async function (src, el) {

    /* 🚨 防連點 */
    if (isProcessing) {
        log("⚠️ 忽略重複點擊: " + src);
        return;
    }

    isProcessing = true;

    log("👉 SELECT: " + src);
    led("led-api", false);

    document.querySelectorAll(".preview-box img")
        .forEach(i => i.classList.remove("active"));
    el.classList.add("active");

    showLoading("AI 試衣中...");

    try {
        /* STEP 1 */
        log("STEP 1: load cloth");

        const res = await fetch(src);
        const blob = await res.blob();
        const clothFile = new File([blob], "cloth.jpg", { type: blob.type });

        /* STEP 2 */
        log("STEP 2: capture person");

        const personFile = await captureFrame(video);

        /* STEP 3 */
        log("STEP 3: upload person");

        const personPath = await uploadImage(personFile);
        if (!personPath) throw new Error("person upload failed");

        log("✔ person uploaded");

        /* STEP 4 */
        log("STEP 4: upload cloth");

        const clothPath = await uploadImage(clothFile);
        if (!clothPath) throw new Error("cloth upload failed");

        log("✔ cloth uploaded");

        /* STEP 5 */
        log("STEP 5: run AI");

        const eventId = await runTryOn(personPath);
        if (!eventId) throw new Error("eventId missing");

        log("eventId: " + eventId);

        /* STEP 6 */
        log("STEP 6: waiting result");

        const rawResult = await getResult(eventId);

        log("RAW RESULT RECEIVED");

        /* parse */
        const jsonMatch = rawResult.match(/\{.*\}/s);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        const url = data?.url || data?.data?.[0];

        if (!url) throw new Error("no output image");

        /* STEP 7 */
        log("STEP 7: render result");

        cloth.crossOrigin = "anonymous";
        cloth.src = url;

        cloth.onload = () => {
            clothReady = true;
            hideLoading();
            led("led-api", true);
            log("👉 SUCCESS ✓");
            setStatus("AI 試衣成功 ✓");
        };

    } catch (err) {
        console.error(err);
        log("❌ ERROR: " + err.message);

        hideLoading();
        led("led-api", false);
        setStatus("❌ " + err.message);

    } finally {
        /* 🚨 解鎖 */
        isProcessing = false;
    }
};

/* =========================
   LOOP (AR RENDER)
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
