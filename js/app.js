import { initCamera } from "./camera.js";
import { initPose, sendPose, onPose } from "./pose.js";
import { initRenderer, updateClothFromPose, startRenderLoop, setCloth } from "./renderer.js";
import { removeBackground } from "./api.js";

/* ===============================
   DOM
================================ */
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const startBtn = document.getElementById("startBtn");
const debugPanel = document.getElementById("debugPanel");

const resetBtn = document.getElementById("btn-reset");
const screenshotBtn = document.getElementById("btn-screenshot");

/* ===============================
   STATE
================================ */
let running = false;
let poseReady = false;

/* ===============================
   DEBUG
================================ */
function debug(msg) {
    console.log(msg);
    if (debugPanel) debugPanel.innerText = msg;
}

/* ===============================
   START AR PIPELINE
================================ */
async function startAR() {
    if (running) return;
    running = true;

    debug("APP: starting...");

    /* 1️⃣ camera */
    await initCamera(video);
    debug("CAMERA: ready");

    /* 2️⃣ pose */
    await initPose();
    onPose(updateClothFromPose);
    debug("POSE: ready");

    /* 3️⃣ renderer */
    initRenderer(canvas, video);
    startRenderLoop();
    debug("RENDER: running");

    /* 4️⃣ pose loop */
    loopPose();

    debug("APP: running");
}

/* ===============================
   POSE LOOP
================================ */
async function loopPose() {
    async function loop() {
        if (!running) return;

        await sendPose(video);

        requestAnimationFrame(loop);
    }

    loop();
}

/* ===============================
   CLOTH SELECT
================================ */
function initClothUI() {
    const items = document.querySelectorAll(".cloth-item");

    items.forEach((item) => {
        item.addEventListener("click", async () => {
            const path = item.dataset.cloth;

            debug("CLOTH loading: " + path);

            const img = new Image();

            // 🔥 可選：如果你要去背 API
            // const file = await fetch(path).then(r => r.blob());
            // const url = await removeBackground(file);
            // img.src = url || path;

            img.src = path;

            img.onload = () => {
                setCloth(img);
                debug("CLOTH ready");
            };
        });
    });
}

/* ===============================
   RESET
================================ */
function reset() {
    location.reload();
}

/* ===============================
   SCREENSHOT
================================ */
function screenshot() {
    const data = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = data;
    a.download = "ar.png";
    a.click();
}

/* ===============================
   INIT UI
================================ */
function initUI() {
    startBtn.addEventListener("click", startAR);

    resetBtn.addEventListener("click", reset);

    screenshotBtn.addEventListener("click", screenshot);

    initClothUI();
}

/* ===============================
   BOOT
================================ */
function boot() {
    debug("BOOT ready");
    initUI();
}

boot();
