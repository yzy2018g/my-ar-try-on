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
   CLOTH SELECT → API REMOVE BG
========================= */
window.selectCloth = async function (src) {

    if (isProcessing) return;
    isProcessing = true;

    try {
        step("CLOTH", "load");

        showLoading("衣服去背中...");
        led("led-api", false);

        /* 1️⃣ load cloth image */
        const clothBlob = await (await fetch(src)).blob();

        /* 2️⃣ upload cloth to API (Gradio predict) */
        // 首先將圖片上傳到 Gradio 的臨時上傳區，取得臨時檔名
        const uploadForm = new FormData();
        uploadForm.append("files", clothBlob, "cloth.png");
        
        const uploadRes = await fetch("https://michaelyo-my-ar-cloth-api.hf.space/gradio_api/upload", {
            method: "POST",
            body: uploadForm
        });
        
        if (!uploadRes.ok) throw new Error("Gradio 上傳臨時檔失敗");
        const uploadData = await uploadRes.json();
        const tempPath = uploadData[0]; // 取得類似 "/tmp/gradio/xxx.png"
        
        // 發起 Gradio 任務預測
        const res = await fetch(
            "https://michaelyo-my-ar-cloth-api.hf.space/gradio_api/call/predict",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
            throw new Error("API 發起去背任務失敗");
        }

        const { event_id } = await res.json();
        
        /* 💡 核心修正點：使用多重嘗試輪詢機制（Polling），確保拿到 complete 狀態 */
        let remotePath = null;
        let attempts = 0;
        const maxAttempts = 5; // 最多重複確認 5 次（每次相隔 500ms）

        while (!remotePath && attempts < maxAttempts) {
            attempts++;
            step("FETCH STATUS", `Try ${attempts}`);

            const statusRes = await fetch(`https://michaelyo-my-ar-cloth-api.hf.space/gradio_api/call/predict/status/${event_id}`);
            
            if (!statusRes.ok) throw new Error("向後端查詢狀態失敗");
            
            const statusText = await statusRes.text();

            // 當 Gradio 回傳的串流內文包含 complete 事件時，才解析路徑
            if (statusText.includes("complete")) {
                const match = statusText.match(/"path"\s*:\s*"([^"]+)"/);
                if (match && match[1]) {
                    remotePath = match[1];
                    break;
                }
            }
            
            // 如果這輪沒拿到結果，等待 500 毫秒後再試
            if (!remotePath && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        if (!remotePath) {
            throw new Error("去背處理逾時或無法解析圖片路徑");
        }
        
        // 拼接成完整的圖片存取網址
        const baseUrl = "https://michaelyo-my-ar-cloth-api.hf.space";
        const url = `${baseUrl}/file=${remotePath}`;

        /* 3️⃣ apply cloth */
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
            throw new Error("CLOTH LOAD FAIL");
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
