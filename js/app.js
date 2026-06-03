window.appLoaded = true;
console.log("APP LOADED OK");

import { startCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { uploadImage, runTryOn, getResult } from "./api.js";
import { setStatus, showLoading, hideLoading } from "./ui.js";

/* =========================
   📱 MOBILE DEBUG PANEL
========================= */
function debugStep(msg) {
    console.log("[STEP]", msg);

    const box = document.getElementById("debugBox");
    if (box) {
        box.innerText += "👉 " + msg + "\n";
        box.scrollTop = box.scrollHeight;
    }

    setStatus(msg);
}

function debugError(msg) {
    console.error("[ERROR]", msg);

    const box = document.getElementById("debugBox");
    if (box) {
        box.innerText += "❌ " + msg + "\n";
    }

    setStatus("❌ " + msg);
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

/* =========================
   START
========================= */
startBtn.addEventListener("click", async () => {

    debugStep("CLICK OK");

    startBtn.style.display = "none";
    debugStep("初始化 AI 模型...");

    try {
        pose = await initPose();
        led("led-pose", true);
        debugStep("POSE OK");

        await startCamera(video);
        led("led-camera", true);
        debugStep("CAMERA OK");

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        debugStep("系統就緒 ✓");

        loop();

    } catch (err) {
        debugError("INIT FAIL: " + err.message);
    }
});

/* =========================
   CAPTURE
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
   CLOTH + API FLOW (DEBUG HEAVY)
========================= */
window.selectCloth = async function (src, el) {

    debugStep("SELECT: " + src);
    led("led-api", false);

    document.querySelectorAll(".preview-box img")
        .forEach(i => i.classList.remove("active"));
    el.classList.add("active");

    showLoading("AI 試衣中...");

    try {
        debugStep("STEP 1: loading cloth");

        const res = await fetch(src);
        const blob = await res.blob();
        const clothFile = new File([blob], "cloth.jpg", { type: blob.type });

        debugStep("STEP 2: capture person");

        const personFile = await captureFrame(video);

        debugStep("STEP 3: upload person");

        const personPath = await uploadImage(personFile);
        debugStep("personPath OK");

        debugStep("STEP 4: upload cloth");

        const clothPath = await uploadImage(clothFile);
        debugStep("clothPath OK");

        debugStep("STEP 5: run AI");

        const eventId = await runTryOn(personPath);
        debugStep("eventId: " + eventId);

        debugStep("STEP 6: waiting result");

        const rawResult = await getResult(eventId);

        debugStep("RAW RESULT RECEIVED");

        const jsonMatch = rawResult.match(/\{.*\}/s);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        const url = data?.url || data?.data?.[0];

        if (!url) throw new Error("NO IMAGE URL");

        debugStep("STEP 7: render image");

        cloth.crossOrigin = "anonymous";
        cloth.src = url;

        cloth.onload = () => {
            clothReady = true;
            hideLoading();
            led("led-api", true);
            debugStep("SUCCESS ✓");
        };

    } catch (err) {
        hideLoading();
        led("led-api", false);
        debugError(err.message);
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
