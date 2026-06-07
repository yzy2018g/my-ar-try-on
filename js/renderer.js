let canvas, ctx;
let video;

let clothImg = new Image();
let clothReady = false;

// transform state
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

    const setup = () => {
        const w = video.videoWidth;
        const h = video.videoHeight;

        if (!w || !h) {
            requestAnimationFrame(setup);
            return;
        }

        canvas.width = w;
        canvas.height = h;

        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.zIndex = "2";
    };

    if (video.readyState >= 2) {
        setup();
    } else {
        video.onloadedmetadata = setup;
    }
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

    // center point (normalized)
    const cx = (ls.x + rs.x) / 2;
    const cy = (ls.y + rs.y) / 2;

    // smoothing position
    clothX = clothX * 0.7 + cx * 0.3;
    clothY = clothY * 0.7 + cy * 0.3;

    // angle (NO hack, keep stable first)
    clothAngle = Math.atan2(rs.y - ls.y, rs.x - ls.x);

    // scale based on shoulder distance
    const dx = rs.x - ls.x;
    const dy = rs.y - ls.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    clothScale = dist * 3.0;
}

/* ===============================
   RENDER
================================ */
export function render() {
    if (!ctx || !canvas || !video) return;

    const w = canvas.width;
    const h = canvas.height;

    // clear frame (IMPORTANT)
    ctx.clearRect(0, 0, w, h);

    // draw video background
    ctx.drawImage(video, 0, 0, w, h);

    const x = clothX * w;
    const y = clothY * h;

    /* ================= DEBUG POINTS ================= */

    // center marker
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // pose point
    ctx.fillStyle = "yellow";
    ctx.fillRect(x - 5, y - 5, 10, 10);

    /* ================= CLOTH RENDER ================= */

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

    // bounding box debug
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
   DEBUG PANEL
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
