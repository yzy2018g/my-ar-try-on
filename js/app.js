import { startCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { setStatus, showLoading, hideLoading } from "./ui.js";
import { log, step, error, led, safeGetEl } from "./debug.js";
import { drawAR } from "./renderer.js";

window.appLoaded = true;

/* =========================
   STATE
========================= */
let video, canvas, ctx, startBtn;
let pose = null;

let cloth = new Image();
let clothReady = false;

let isProcessing = false;

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", initApp);

function initApp() {
    video = safeGetEl("webcam");
    canvas = safeGetEl("arCanvas");
    startBtn = safeGetEl("startBtn");

    ctx = canvas?.getContext("2d");

    log("INIT APP READY");

    startBtn?.addEventListener("click", onStart);
}

/* =========================
   START CAMERA + POSE
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
   CLOTH SELECT → GRADIO API
========================= */
window.selectCloth = async function (src) {
    if (isProcessing) return;
    isProcessing = true;

    try {
        step("CLOTH", "load");

        showLoading("衣服去背中...");
        led("led-api", false);

        /* =========================
           1️⃣ load image
        ========================= */
        const clothBlob = await (await fetch(src)).blob();

        /* =========================
           2️⃣ upload to Gradio
        ========================= */
        const uploadForm = new FormData();
        uploadForm.append("files", clothBlob, "cloth.png");

        const uploadRes = await fetch(
            "https://michaelyo-my-ar-cloth-api.hf.space/gradio_api/upload",
            {
                method: "POST",
                body: uploadForm
            }
        );

        if (!uploadRes.ok) {
            throw new Error(`Upload failed (${uploadRes.status})`);
        }

        const uploadData = await uploadRes.json();
        const tempPath = uploadData?.[0];

        if (!tempPath) {
            throw new Error("Upload 回傳錯誤");
        }

        /* =========================
           3️⃣ call predict
        ========================= */
        const res = await fetch(
            "https://michaelyo-my-ar-cloth-api.hf.space/gradio_api/call/predict",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    data: [{
                        path: tempPath,
                        url: `https://michaelyo-my-ar-cloth-api.hf.space/file=${tempPath}`,
                        orig_name: "cloth.png",
                        size: clothBlob.size,
                        mime_type: "image/png"
                    }]
                })
            }
        );

        if (!res.ok) {
            throw new Error(`Predict failed (${res.status})`);
        }

        const { event_id } = await res.json();

        /* =========================
           4️⃣ SSE polling (FIXED 404)
        ========================= */
        let remotePath = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (!remotePath && attempts < maxAttempts) {
            attempts++;
            step("FETCH STATUS", `Try ${attempts}`);

            const statusRes = await fetch(
                `https://michaelyo-my-ar-cloth-api.hf.space/gradio_api/call/predict/${event_id}`,
                {
                    method: "GET",
                    headers: {
                        "Accept": "text/event-stream"
                    }
                }
            );

            if (!statusRes.ok) {
                throw new Error(`Status error HTTP ${statusRes.status}`);
            }

            const reader = statusRes.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let buffer = "";
            let done = false;

            while (!done) {
                const { value, done: d } = await reader.read();
                done = d;

                buffer += decoder.decode(value || new Uint8Array(), {
                    stream: true
                });

                if (buffer.includes("complete")) {
                    const match = buffer.match(/"path"\s*:\s*"([^"]+)"/);
                    if (match?.[1]) {
                        remotePath = match[1];
                        break;
                    }
                }
            }

            if (!remotePath) {
                await new Promise(r => setTimeout(r, 400));
            }
        }

        if (!remotePath) {
            throw new Error("去背超時");
        }

        /* =========================
           5️⃣ load result image
        ========================= */
        const baseUrl = "https://michaelyo-my-ar-cloth-api.hf.space";
        const url = `${baseUrl}/file=${remotePath}`;

        cloth = new Image();
        cloth.crossOrigin = "anonymous";
        cloth.src = url;

        cloth.onload = () => {
            clothReady = true;
            hideLoading();
            led("led-api", true);
            setStatus("衣服載入完成 ✓");
        };

        cloth.onerror = () => {
            throw new Error("圖片載入失敗");
        };

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
   LOOP (AR RENDER)
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
}
