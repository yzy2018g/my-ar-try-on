let canvas, ctx;
let video;

let clothImg = new Image();
let clothReady = false;

// cloth transform
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

    if (!canvas || !video) return;

    ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 100, 100);
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

    // smoothing（避免抖動）
    clothX = clothX * 0.7 + ((ls.x + rs.x) / 2) * 0.3;
    clothY = clothY * 0.7 + ((ls.y + rs.y) / 2) * 0.3;

    // angle（簡單穩定）
    let rawAngle = Math.atan2(rs.y - ls.y, rs.x - ls.x);
    if (Math.abs(rawAngle) > Math.PI / 2) rawAngle += Math.PI;
    clothAngle = rawAngle;

    // scale（修正成畫面比例）
    const dx = rs.x - ls.x;
    const dy = rs.y - ls.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    clothScale = dist * 2.5;
}

/* ===============================
   RENDER LOOP
================================ */
export function render() {
    if (!ctx || !video) return;

    const w = canvas.width;
    const h = canvas.height;

    // background
    ctx.drawImage(video, 0, 0, w, h);

    const x = clothX * w;
    const y = clothY * h;

    // 🔥 DEBUG 點（一定要在 x/y 後面）
    ctx.fillStyle = "yellow";
    ctx.fillRect(x - 5, y - 5, 10, 10);

    drawDebugOverlay();

    // center test point
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // cloth check
    if (!clothReady || !clothImg || clothImg.naturalWidth === 0) {
        return;
    }

    const baseW = clothImg.naturalWidth;
    const baseH = clothImg.naturalHeight;

    const cw = baseW * clothScale;
    const ch = baseH * clothScale;

    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(clothAngle);

    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;
    ctx.strokeRect(-cw / 2, -ch / 2, cw, ch);

    ctx.drawImage(clothImg, -cw / 2, -ch / 2, cw, ch);

    ctx.restore();
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
   DEBUG OVERLAY（畫面內 debug）
================================ */
function drawDebugOverlay() {
    if (!ctx || !canvas) return;

    const w = canvas.width;

    ctx.save();

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, 280, 170);

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

    // shoulder point
    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(clothX * w, clothY * canvas.height, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}
