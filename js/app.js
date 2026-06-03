window.appLoaded = true;
console.log("APP LOADED OK");

import { startCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { uploadImage, runTryOn, getResult } from "./api.js";
import { setStatus, showLoading, hideLoading } from "./ui.js";

/* =========================
   DEBUG
========================= */
function log(msg) {
    console.log(msg);
    const box = document.getElementById("debugBox");
    if (box) box.innerText += msg + "\n";
}

function led(id, ok) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = el.innerText.split(":")[0] + ": " + (ok ? "🟢" : "🔴");
}

window.log = log;

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
   START SYSTEM
========================= */
startBtn.addEventListener("click", async () => {

    log("CLICK OK");

    startBtn.style.display = "none";
    setStatus("初始化 AI 模型...");

    pose = await initPose();
    led("led-pose", true);

    await startCamera(video);
    led("led-camera", true);

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    setStatus("系統就緒 ✓");

    loop();
});

/* =========================
   CAPTURE FRAME (person image)
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
   CLOTH SELECT + AI TRY-ON
========================= */
window.selectCloth = async function (src, el) {

    log("SELECT CLOTH: " + src);
    led("led-api", false);

    document.querySelectorAll(".preview-box img")
        .forEach(i => i.classList.remove("active"));
    el.classList.add("active");

    showLoading("AI 試衣中...");

    try {
        /* 1️⃣ load cloth image */
        const res = await fetch(src);
        const blob = await res.blob();
        const clothFile = new File([blob], "cloth.jpg", { type: blob.type });

        /* 2️⃣ capture person */
        const personFile = await captureFrame(video);

        /* 3️⃣ upload both */
        const personPath = await uploadImage(personFile);
        const clothPath = await uploadImage(clothFile);

        /* 4️⃣ run AI model */
        const eventId = await runTryOn(personPath, clothPath);

        /* 5️⃣ get result */
        const rawResult = await getResult(eventId);

        log("RAW RESULT: " + rawResult);

        /* 6️⃣ parse result */
        const jsonMatch = rawResult.match(/\{.*\}/s);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        const url = data?.url || data?.data?.[0];

        if (!url) throw new Error("No output image url");

        /* 7️⃣ render cloth */
        cloth.crossOrigin = "anonymous";
        cloth.src = url;

        cloth.onload = () => {
            clothReady = true;
            hideLoading();
            led("led-api", true);
            setStatus("AI 試衣成功 ✓");
        };

    } catch (err) {
        console.error(err);
        log("ERROR: " + err.message);

        hideLoading();
        led("led-api", false);
        setStatus("❌ AI 試衣失敗：" + err.message);
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

    else if (clothReady && !lm) {

        const width = canvas.width * 0.55;
        const ratio = cloth.naturalHeight / cloth.naturalWidth;
        const height = width * ratio;

        ctx.drawImage(
            cloth,
            (canvas.width - width) / 2,
            (canvas.height - height) / 2 + 30,
            width,
            height
        );
    }

    requestAnimationFrame(loop);
}
