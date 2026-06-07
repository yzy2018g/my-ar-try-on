let canvas, ctx;
let video;

let clothImg = new Image();
let clothReady = false;

// transform
let clothX = 0;
let clothY = 0;
let clothAngle = 0;
let clothScale = 1;

/* ===============================
   INIT RENDERER
================================ */
export function initRenderer(c, v) {
    canvas = c;
    video = v;

    if (!canvas || !video) {
        console.error("❌ canvas or video missing");
        return;
    }

    ctx = canvas.getContext("2d");

    function setupCanvas() {
        const w = video.videoWidth;
        const h = video.videoHeight;

        // ❗ fallback，避免 0x0
        const cw = w > 0 ? w : 640;
        const ch = h > 0 ? h : 480;

        // 👉 real pixel size（AR 正確關鍵）
        canvas.width = cw;
        canvas.height = ch;

        // 👉 CSS size（畫面顯示）
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";

        // 👉 debug：避免被蓋掉（如果你還看不到就打開）
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.zIndex = "2";
        canvas.style.pointerEvents = "none";

        console.log("✅ Canvas ready:", cw, ch);
    }

    // 👉 video 還沒 ready 就等
    if (video.readyState >= 2) {
        setupCanvas();
    } else {
        video.onloadedmetadata = setupCanvas;
    }

    // 🔥 最後保險：強制顯示測試（可刪）
    ctx.fillStyle = "rgba(255,0,0,0.2)";
    ctx.fillRect(0, 0, 50, 50);
}

/* ===============================
   SET CLOTH
================================ */
export function setCloth(img) {
    clothImg = img;
    clothReady = true;
}

/* ===============================
   POSE UPDATE
================================ */
export function updateClothFromPose(landmarks) {
    if (!landmarks) return;

    const ls = landmarks[11];
    const rs = landmarks[12];
    if (!ls || !rs) return;

    // smoothing
    clothX = clothX * 0.7 + ((ls.x + rs.x) / 2) * 0.3;
    clothY = clothY * 0.7 + ((ls.y + rs.y) / 2) * 0.3;

    // angle
    let rawAngle = Math.atan2(rs.y - ls.y, rs.x - ls.x);
    if (Math.abs(rawAngle) > Math.PI / 2) rawAngle += Math.PI;
    clothAngle = rawAngle;

    // scale
    const dx = rs.x - ls.x;
    const dy = rs.y - ls.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    clothScale = dist * 2.5;
}

/* ===============================
   RENDER
================================ */
export function render() {
    if (!ctx || !video) return;

    const w = canvas.width;
    const h = canvas.height;

    // background
    ctx.drawImage(video, 0, 0, w, h);

    const x = clothX * w;
    const y = clothY * h;

    /* ================= DEBUG POINTS ================= */

    // red center
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // yellow pose point
    ctx.fillStyle = "yellow";
    ctx.fillRect(x - 5, y - 5, 10, 10);

    /* ================= CLOTH CHECK ================= */

    if (!clothReady || !clothImg || clothImg.naturalWidth === 0) {
        drawDebug();
        return;
    }

    const baseW = clothImg.naturalWidth;
    const baseH = clothImg.naturalHeight;

    const cw = baseW * clothScale;
    const ch = baseH * clothScale;

    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(clothAngle);

    // green bounding box
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;
    ctx.strokeRect(-cw / 2, -ch / 2, cw, ch);

    ctx.drawImage(clothImg, -cw / 2, -ch / 2, cw, ch);

    ctx.restore();

    drawDebug();
}

/* ===============================
   LOOP
================================ */
export function startRenderLoop() {
    function loop() {
        render();
        requestAnimationFrame(loop);
    }
    loop();
}

/* ===============================
   DEBUG UI (on canvas)
================================ */
function drawDebug() {
    if (!ctx || !canvas) return;

    ctx.save();

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, 260, 160);

    ctx.fillStyle = "white";
    ctx.font = "14px monospace";

    const lines = [
        `CLOTH: ${clothReady ? "YES" : "NO"}`,
        `IMG: ${clothImg?.naturalWidth || 0}x${clothImg?.naturalHeight || 0}`,
        `SCALE: ${clothScale.toFixed(3)}`,
        `ANGLE: ${(clothAngle * 180 / Math.PI).toFixed(1)}`,
        `POS: ${clothX.toFixed(2)}, ${clothY.toFixed(2)}`
    ];

    let y = 20;
    for (const l of lines) {
        ctx.fillText(l, 10, y);
        y += 20;
    }

    ctx.restore();
}
