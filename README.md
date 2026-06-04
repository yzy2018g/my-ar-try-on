# 📱 AR 智慧動態試衣間

一個純前端 AR 試衣系統  
使用 Mediapipe 姿態偵測 + Canvas 即時將衣服套到人體上  
後端 API 僅負責「衣服去背」

---

# 🚀 系統架構

## 🧠 前端負責
- 攝影機影像擷取
- 人體姿態偵測（Mediapipe）
- AR 衣服貼合渲染（Canvas 2D）
- 使用者介面與狀態管理

## ☁️ API（只負責去背）

https://michaelyo-my-ar-cloth-api.hf.space

### 功能
- 上傳衣服圖片
- 回傳透明背景衣服圖片（PNG）

### ❌ 不負責
- 試穿合成
- 人體生成
- AR 渲染

---

# 📦 使用方式

## 1️⃣ 開啟網站

https://yzy2018g.github.io/my-ar-filter/

---

## 2️⃣ 點選衣服

流程如下：

### STEP 1 - 上傳衣服
前端把衣服圖片傳到 API 去背

### STEP 2 - API 回傳結果
API 回傳：

透明背景衣服圖片（PNG）

### STEP 3 - 前端進行 AR 套用
- 偵測肩膀位置
- 計算衣服角度與大小
- 即時畫在人體上

---

# 🧠 核心流程

使用者點選衣服 ↓ 前端上傳圖片 ↓ API 去除背景 ↓ 回傳透明衣服圖片 ↓ 前端即時渲染到人體

---

# 🔌 API 規格

## 📤 上傳衣服

POST /gradio_api/upload

### 輸入

file：圖片（jpg / png）

### 輸出

/tmp/gradio/xxx/cloth.png

---

## 🧼 去背 API（自建功能）

POST /process_cloth

### 輸入

form-data： file：衣服圖片

### 輸出
```json
{
  "url": "https://.../transparent.png"
}
```

---

# 🎯 前端技術

- 人體姿態偵測（Mediapipe）
- Canvas 2D 即時渲染
- 高效動畫迴圈（requestAnimationFrame）
- 模組化 JavaScript 架構
- 非同步圖片處理流程

---

# 🧩 AR 渲染邏輯

## 肩膀偵測點
- 左肩：第 11 點
- 右肩：第 12 點

## 計算方式
- 中心點：左右肩中間
- 肩寬：兩點距離
- 角度：肩線方向

## 繪製方式

```js id="draw01"
畫布繪製(衣服圖片, x, y, 寬度, 高度)


---

⚡ 設計優化重點

API 只負責去背（輕量化）

前端負責所有 AR 運算

使用高效動畫迴圈確保流暢

衣服圖片可快取避免重複下載



---

📁 專案結構

/js
  app.js        主程式（包含 captureFrame）
  api.js        API 呼叫（去背服務）
  renderer.js   AR渲染
  camera.js     攝影機控制
  pose.js       姿態偵測
  ui.js         介面控制
  debug.js      除錯工具

/assets
  cloth.png
  style_1.png
  style_2.png

/index.html
/style.css


---

🟢 系統狀態

模組	狀態

攝影機	正常
姿態偵測	正常
去背 API	正常
AR渲染	正常
試衣效果	正常



---

💡 設計理念

把 AI 計算移到後端 API（去背）

前端只負責即時互動與畫面渲染

降低延遲，提高流暢度

模組化設計方便維護與擴充



---

📌 未來可升級方向

更精準肩線校正（讓衣服更貼身）

支援多人同時試衣

改用 WebGL 提升效能

增加衣服摺皺與光影效果


---
