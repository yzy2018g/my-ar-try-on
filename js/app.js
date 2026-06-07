import { initCamera } from "./camera.js";
import { initPose } from "./pose.js";
import {
    initRenderer,
    startRenderLoop,
    setCloth,
    updateClothFromPose
} from "./renderer.js";

import { removeBackground } from "./api.js";

/* ===============================
   DEBUG 系統
================================ */
let debugLogs = [];

function log(msg) {
    const time = new Date().toLocaleTimeString();
    debugLogs.push(`[${time}] ${msg}`);

    if (debugLogs.length > 12) {
        debugLogs.shift();
    }

    renderDebug();
}

/* ===============================
   debug panel（狀態顯示）
================================ */
function renderDebug() {
    const el = document.getElementById("debugPanel");
    if (!el) return;

    el.innerText =
`[AR DEBUG]
APP: RUNNING

--- LOG ---
${debugLogs.join("\n")}`;
}

/* ===============================
   全域狀態（可選）
================================ */
let video;
let canvas;
let pose;

/* ===============================
   主程式入口
================================ */
async function main() {
    log("APP START");

    log("STEP 1 CAMERA");

    const camera = await initCamera();

    log("STEP 2 CAMERA DONE");

    video = camera.video;
    canvas = camera.canvas;

    log("STEP 3 BEFORE RENDERER");

    initRenderer(canvas, video);
    startRenderLoop();

    log("RENDERER STARTED");

    log("STEP 4 BEFORE POSE");

    pose = await initPose(video, (landmarks) => {
        updateClothFromPose(landmarks);
    });

    log("POSE READY");

    bindUI();
}

/* ===============================
   UI（按鈕）
================================ */
function bindUI() {
    const btn = document.getElementById("testBtn");
    const input = document.getElementById("fileInput");

    btn.onclick = async () => {
        log("CLICKED");

        const file = input.files[0];

        if (!file) {
            log("NO FILE");
            return;
        }

        log(`FILE OK: ${file.name}`);

        try {
            log("CALLING API...");

            // -------------------------------
            // 5. 呼叫去背 API
            // -------------------------------
            const result = await removeBackground(file);

            log("API SUCCESS");

            const url = result.data[0].url;

            log("IMAGE READY");

            // -------------------------------
            // 6. 載入衣服圖片
            // -------------------------------
            const img = new Image();
            img.src = url;

            img.onload = () => {
                setCloth(img);
                log("CLOTH SET TO RENDERER");
            };

        } catch (err) {
            log("API ERROR");
            log(err.message || String(err));
        }
    };
}

/* ===============================
   啟動
================================ */
main();
