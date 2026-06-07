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

    if (!canvas || !video) {
        console.error("❌ canvas or video is null");
        return;
    }

    ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    console.log("✅ Renderer init OK");
}

/* ===============================
   SET CLOTH
================================ */
export function setCloth(img) {
    clothImg = img;
    clothReady = true;

    console.log("🧥 Cloth set OK");
}

/* ===============================
   POSE UPDATE
================================ */
export function updateClothFromPose(landmarks) {
    if (!landmarks) return;

    const ls = landmarks[11];
    const rs = landmarks[12];

    if (!ls || !rs) return;

    clothX = (ls.x + rs.x) / 2;
    clothY = (ls.y + rs.y) / 2;

    clothAngle = Math.atan2(
        rs.y - ls.y,
        rs.x - ls.x
    );

    const dx = rs.x - ls.x;
    const dy = rs.y - ls.y;

    clothScale = Math.sqrt(dx * dx + dy * dy) * 2.2;
}

/* ===============================
   RENDER LOOP
================================ */
export function render() {
    if (!ctx || !video) return;

    const w = canvas.width;
    const h = canvas.height;

    // 🔥 永遠畫背景
    ctx.drawImage(video, 0, 0, w, h);

    // 🔥 DEBUG（一定要先顯示）
    arDebug();

    // 🔴 測試點（一定會看到，用來判斷 canvas 是否正常）
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 8, 0, Math.PI * 2);
    ctx.fill();

    // cloth check（不阻止 debug）
    if (!clothReady) {
        console.log("cloth not ready");
        return;
    }

    if (!clothImg || clothImg.naturalWidth === 0) {
        console.log("cloth not loaded");
        return;
    }

    const x = clothX * w;
    const y = clothY * h;

    const cw = clothImg.width * clothScale;
    const ch = clothImg.height * clothScale;

    console.log("DRAW CLOTH", { x, y, clothScale });

    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(clothAngle);

    ctx.drawImage(
        clothImg,
        -cw / 2,
        -ch / 2,
        cw,
        ch
    );

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

    console.log("🎬 Render loop started");
    loop();
}

/* ===============================
   DEBUG PANEL
================================ */
function arDebug() {
    const el = document.getElementById("debugPanel");
    if (!el) return;

    el.innerText =
`[AR DEBUG]

CLOTH READY: ${clothReady}
IMG WIDTH: ${clothImg?.naturalWidth}
X: ${clothX.toFixed(3)}
Y: ${clothY.toFixed(3)}
SCALE: ${clothScale.toFixed(3)}
ANGLE: ${(clothAngle * 180 / Math.PI).toFixed(1)}°
`;
}
