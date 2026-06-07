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

    if (!canvas) {
        console.error("❌ canvas is null");
        return;
    }

    if (!video) {
        console.error("❌ video is null");
        return;
    }

    ctx = canvas.getContext("2d");

    if (!ctx) {
        console.error("❌ ctx is null");
        return;
    }

    // 🔥 強制對齊 video size（非常重要）
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

    console.log("🧥 Cloth set");
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

    // 🔥 一定要看到這個（確認 loop 活著）
    console.log("RENDER LOOP ALIVE");

    // background
    try {
        ctx.drawImage(video, 0, 0, w, h);
    } catch (e) {
        console.error("video draw error", e);
    }

    // 🔥 debug 永遠先跑（不要被 return 擋掉）
    arDebug();

    // cloth check（修正重點）
    if (!clothReady) return;
    if (!clothImg || clothImg.naturalWidth === 0) return;

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
   AR DEBUG（一定會顯示）
================================ */
function arDebug() {
    const el = document.getElementById("debugPanel");
    if (!el) return;

    el.innerText =
`[AR DEBUG]

CLOTH READY: ${clothReady}
IMG LOADED: ${clothImg?.complete}
NATURAL WIDTH: ${clothImg?.naturalWidth}
X: ${clothX.toFixed(3)}
Y: ${clothY.toFixed(3)}
SCALE: ${clothScale.toFixed(3)}
ANGLE: ${(clothAngle * 180 / Math.PI).toFixed(1)}°
`;
}
