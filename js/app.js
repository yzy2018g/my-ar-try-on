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
        showLoading("衣服去背中...");
        
        // 建立 Gradio 所需的 JSON Payload 格式
        // 注意：Gradio 接收圖片通常需要將 Blob 轉為 Base64 或透過內部 Uploader，
        // 但最快且支援跨網域的方法是直接傳送符合 Gradio 規格的 JSON。
        
        // 首先，我們需要先將圖片上傳到 Gradio 的臨時上傳區，取得臨時檔名
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
        
        // 輪詢（Polling）或直接請求結果
        // 由於 rembg 處理速度快，直接請求狀態
        const statusRes = await fetch(`https://michaelyo-my-ar-cloth-api.hf.space/gradio_api/call/predict/status/${event_id}`);
        
        if (!statusRes.ok) throw new Error("取得去背結果失敗");
        
        // Gradio 返回的是 SSE 流事件文字，我們需要解析出內部資料
        const statusText = await statusRes.text();
        
        // 從回傳的文字中解析出經由 rembg 處理完的圖片路徑
        // Gradio 成功時會包含 data: [{"path": "..."}]
        const match = statusText.match(/"path"\s*:\s*"([^"]+)"/);
        if (!match || !match[1]) {
            throw new Error("無法解析去背後的圖片路徑");
        }
        
        // 拼接成完整的圖片存取網址
        const baseUrl = "https://michaelyo-my-ar-cloth-api.hf.space";
        const url = `${baseUrl}/file=${match[1]}`;


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
