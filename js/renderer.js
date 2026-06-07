// ===============================
// AR Renderer（衣服貼人體核心模組）
// 功能：
// 1. 顯示攝影機畫面
// 2. 根據 pose 把衣服貼到人體
// 3. 控制位置 / 旋轉 / 大小
// ===============================

let canvas, ctx;   // 畫布與繪圖環境
let video;         // camera 畫面

// 衣服圖片
let clothImg = new Image();
let clothReady = false;

// ===============================
// 衣服的變換參數（核心）
// ===============================

// 衣服中心位置（0~1 正規化座標）
let clothX = 0;
let clothY = 0;

// 衣服旋轉角度（弧度）
let clothAngle = 0;

// 衣服縮放比例
let clothScale = 1;

/* ===============================
   初始化 Renderer
   - 接收 canvas + video
   - 建立 2D 畫布 context
================================ */
export function initRenderer(c, v) {
    canvas = c;
    ctx = canvas.getContext("2d");
    video = v;
}

/* ===============================
   設定衣服圖片
   - API 回來的去背 PNG 會丟進來
   - 用來當作 AR overlay
================================ */
export function setCloth(img) {
    clothImg = img;
    clothReady = true;
}

/* ===============================
   更新 Pose → 計算衣服位置
   landmarks 來源：MediaPipe Pose
   11 = 左肩
   12 = 右肩
================================ */
export function updateClothFromPose(landmarks) {
    if (!landmarks) return;

    const ls = landmarks[11]; // 左肩
    const rs = landmarks[12]; // 右肩

    // 如果偵測不到肩膀就不更新
    if (!ls || !rs) return;

    // -------------------------------
    // 1. 計算衣服中心點（肩膀中間）
    // -------------------------------
    clothX = (ls.x + rs.x) / 2;
    clothY = (ls.y + rs.y) / 2;

    // -------------------------------
    // 2. 計算衣服旋轉角度
    //    用肩膀連線方向當作身體方向
    // -------------------------------
    clothAngle = Math.atan2(
        rs.y - ls.y,
        rs.x - ls.x
    );

    // -------------------------------
    // 3. 計算衣服大小（肩寬）
    // -------------------------------
    const dx = rs.x - ls.x;
    const dy = rs.y - ls.y;

    const shoulderDist = Math.sqrt(dx * dx + dy * dy);

    // 2.2 是經驗值（可微調）
    clothScale = shoulderDist * 2.2;
}

/* ===============================
   真正的渲染流程（每一幀執行）
================================ */
export function render() {
    if (!ctx || !video) return;

    const w = canvas.width;
    const h = canvas.height;

    // -------------------------------
    // 1. 畫背景（攝影機畫面）
    // -------------------------------
    ctx.drawImage(video, 0, 0, w, h);

    // 如果還沒載入衣服就停止
    if (!clothReady || !clothImg.complete) return;

    // -------------------------------
    // 2. 把 normalized 座標轉成像素
    // -------------------------------
    const x = clothX * w;
    const y = clothY * h;

    // 衣服大小
    const cw = clothImg.width * clothScale;
    const ch = clothImg.height * clothScale;

    // -------------------------------
    // 3. 開始畫衣服（重點）
    // -------------------------------
    ctx.save(); // 保存畫布狀態

    // 移動畫布到人體中心點
    ctx.translate(x, y);

    // 讓衣服跟著人體旋轉
    ctx.rotate(clothAngle);

    // 畫去背衣服
    ctx.drawImage(
        clothImg,
        -cw / 2,  // 左上角修正（讓中心對齊）
        -ch / 2,
        cw,
        ch
    );

    ctx.restore(); // 還原畫布狀態
}

/* ===============================
   啟動 render loop（動畫循環）
================================ */
export function startRenderLoop() {
    function loop() {
        render();
        requestAnimationFrame(loop);
    }
    loop();
}
