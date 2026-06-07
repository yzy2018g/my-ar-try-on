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
   INIT RENDERER（防炸版）
================================ */
export function initRenderer(c, v) {
    if (!c) {
        console.error("❌ canvas is null");
        return;
    }

    if (!v) {
        console.error("❌ video is null");
        return;
    }

    canvas = c;
    ctx = canvas.getContext("2d");
    video = v;

    if (!ctx) {
        console.error("❌ ctx is null");
        return;
    }

    console.log("✅ Renderer init OK");
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
   RENDER LOOP（防炸版）
================================ */
export function render() {
    if (!ctx || !video) return;

    const w = canvas.width || 640;
    const h = canvas.height || 480;

    // video 背景
    try {
        ctx.drawImage(video, 0, 0, w, h);
    } catch (e) {
        console.error("video draw error", e);
    }

    if (!clothReady || !clothImg.complete) return;

    const x = clothX * w;
    const y = clothY * h;

    const cw = clothImg.width * clothScale;
    const ch = clothImg.height * clothScale;

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

   arDebug();
}

/* ===============================
   LOOP（一定不會卡死版）
================================ */
export function startRenderLoop() {
    function loop() {
        try {
            render();
        } catch (e) {
            console.error("render loop error:", e);
        }

        requestAnimationFrame(loop);
    }

    console.log("🎬 Render loop started");
    loop();
}

function arDebug() {
    const el = document.getElementById("debugPanel");
    if (!el) return;

    el.innerText =
`[AR DEBUG]

CLOTH READY: ${clothReady}
IMG LOADED: ${clothImg?.complete}
X: ${clothX.toFixed(3)}
Y: ${clothY.toFixed(3)}
SCALE: ${clothScale.toFixed(3)}
ANGLE: ${(clothAngle * 180 / Math.PI).toFixed(1)}°
`;
}
