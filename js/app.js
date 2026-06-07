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

    // -------------------------------
    // 1. 初始化 camera
    // -------------------------------
    const camera = await initCamera();
    video = camera.video;
    canvas = camera.canvas;

    log("CAMERA READY");

    // -------------------------------
    // 2. 初始化 renderer
    // -------------------------------
    initRenderer(canvas, video);
    startRenderLoop();

    log("RENDERER STARTED");

    // -------------------------------
    // 3. 初始化 pose
    // -------------------------------
    pose = await initPose(video, (landmarks) => {
        // 每一幀 pose 更新
        updateClothFromPose(landmarks);
    });

    log("POSE READY");

    // -------------------------------
    // 4. 綁定 UI
    // -------------------------------
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
