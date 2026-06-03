import { startCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { removeBackground } from "./api.js";
import { setStatus, showLoading, hideLoading } from "./ui.js";

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
    startBtn.style.display = "none";
    setStatus("初始化 AI 模型...");

    // 1. Pose
    pose = await initPose();

    setStatus("開啟相機...");
    await startCamera(video);

    // canvas 尺寸初始化
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    setStatus("系統就緒 ✓");
    loop();
});

/* =========================
   CLOTH SELECT + API
========================= */
window.selectCloth = async function (src, el) {

    document.querySelectorAll(".preview-box img")
        .forEach(i => i.classList.remove("active"));
    el.classList.add("active");

    showLoading("AI 去背中...");

    try {
        const res = await fetch(src);
        const blob = await res.blob();
        const file = new File([blob], src, { type: blob.type });

        const result = await removeBackground(file);

        const url = result.data?.[0]?.url || result.data?.[0];

        cloth.crossOrigin = "anonymous";
        cloth.src = url;

        cloth.onload = () => {
            clothReady = true;
            hideLoading();
            setStatus(pose ? "試穿成功 ✓ 請面向鏡頭" : "試穿成功（無骨架模式）");
        };

    } catch (err) {
        console.error(err);
        hideLoading();
        setStatus("❌ 去背失敗：" + err.message);
    }
};

/* =========================
   RENDER LOOP
========================= */
function loop() {

    // 畫背景（鏡頭）
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let lm = null;

    // pose detection
    if (pose && video.readyState >= 2) {
        try {
            const res = pose.detectForVideo(video, performance.now());
            lm = res.landmarks?.[0] || null;
        } catch (e) {}
    }

    /* =========================
       A. AI + 骨架貼衣
    ========================= */
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

        ctx.drawImage(
            cloth,
            -width / 2,
            -height * 0.08,
            width,
            height
        );

        ctx.restore();
    }

    /* =========================
       B. fallback（無 pose）
    ========================= */
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
