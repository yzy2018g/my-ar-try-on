# AR Virtual Try-On

基於 GitHub Pages + Hugging Face 的網頁 AR 試衣系統。

專案目標

使用者透過手機或電腦瀏覽器即可：

1. 開啟相機
2. 選擇服裝
3. 自動取得去背服裝素材
4. 將服裝即時套用到自身影像
5. 預覽試穿效果
6. 截圖保存結果

---

系統架構

GitHub Pages (Frontend)
│
├─ Camera
├─ Pose Detection
├─ AR Renderer
├─ Clothes Selector
│
└─ Hugging Face API (Backend)
      │
      ├─ Clothing Extraction
      ├─ Background Removal
      ├─ Human Body Removal
      └─ Transparent PNG Output

---

使用流程

開啟網站
    ↓
允許相機權限
    ↓
選擇服裝
    ↓
後端處理服裝素材
    ↓
回傳透明 PNG
    ↓
前端載入服裝
    ↓
依照人體姿勢進行 AR 疊加
    ↓
即時預覽試穿效果

---

前端架構

Camera Manager

負責：

- 開啟相機
- 切換鏡頭
- 取得即時影像

---

Pose Detector

使用 MediaPipe Pose。

取得人體關鍵點：

- Left Shoulder
- Right Shoulder
- Left Hip
- Right Hip

用途：

- 計算衣服位置
- 計算衣服大小
- 計算身體旋轉角度

---

Clothes Selector

負責：

- 顯示服裝清單
- 顯示服裝預覽圖
- 處理服裝切換
- 呼叫後端 API

資料格式：

{
    id: "shirt_01",
    name: "White T-Shirt",
    preview: "thumb.jpg",
    source: "style_1.png"
}

---

AR Renderer

使用 Canvas。

根據人體關鍵點計算：

- X Position
- Y Position
- Width
- Height
- Rotation

並將透明服裝 PNG 即時繪製於人體上。

---

使用者介面規劃

┌───────────────────────────┐
│        AR Try-On          │
├───────────────────────────┤
│                           │
│       Camera View         │
│                           │
│      AR Clothing Layer    │
│                           │
├───────────────────────────┤
│ [👕] [👔] [🧥] [👗]        │
│                           │
│ 每個按鈕顯示服裝預覽圖      │
├───────────────────────────┤
│ Screenshot   Reset        │
└───────────────────────────┘

---

後端架構

使用 Hugging Face Space 提供 API。

API

POST /process_cloth

輸入：

{
    "image_url": "https://..."
}

輸出：

{
    "success": true,
    "cloth_url": "https://.../cloth.png"
}

---

服裝處理流程

服裝原圖
    ↓
背景去除
    ↓
人體移除
    ↓
保留純服裝
    ↓
輸出透明 PNG

---

服裝快取策略

避免每次切換服裝都重新執行 AI 推論。

首次：

原始圖片
    ↓
AI 處理
    ↓
透明 PNG

後續：

直接讀取透明 PNG

提升載入速度並降低 Hugging Face 運算成本。

---

技術規劃

Frontend

- HTML5
- CSS3
- JavaScript ES6
- Canvas
- MediaPipe Pose

Backend

- Python
- Gradio API
- Hugging Face Spaces
- PIL
- OpenCV

AI Processing

- Background Removal
- Human Parsing
- Clothing Segmentation

---

開發里程碑

Phase 1

- Camera
- Pose Detection
- AR Overlay

完成基本試衣功能。

---

Phase 2

- Clothing Selector
- API Integration

完成服裝切換。

---

Phase 3

- Clothing Extraction
- Human Removal

提升服裝品質。

---

Phase 4

- Screenshot
- Mobile Optimization
- UI Enhancement

完成產品化體驗。

---

Future Features

- 多件服裝分類
- 長袖／短袖自動適配
- AI 尺寸估計
- AI 服裝推薦
- 試穿歷史紀錄
- 推薦網路服裝產品
