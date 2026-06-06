import { initCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { initRenderer, render, setCloth } from "./renderer.js";

let currentPose = null;

async function main() {
  console.log("Starting AR Try-On...");

  // 1. 初始化 Camera
  const video = await initCamera();
  if (!video) {
    console.error("Camera init failed");
    return;
  }

  // 2. 初始化 Renderer
  initRenderer();

  // 3. 初始化 Pose（把資料丟回來）
  await initPose(video, (poseData) => {
    currentPose = poseData;
  });

  // 4. 綁定衣服切換 UI
  setupClothesUI();

  // 5. Render Loop
  function loop() {
    if (currentPose) {
      render(currentPose);
    }
    requestAnimationFrame(loop);
  }

  loop();
}

// 衣服切換 UI
function setupClothesUI() {
  const items = document.querySelectorAll(".cloth-item");

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const cloth = item.getAttribute("data-cloth");

      console.log("Switch cloth:", cloth);

      setCloth(cloth);

      // UI highlight
      items.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
    });
  });

  // Reset button（先保留）
  const resetBtn = document.getElementById("btn-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      console.log("Reset clicked");
    });
  }

  // Screenshot（Phase 1 先空）
  const shotBtn = document.getElementById("btn-screenshot");
  if (shotBtn) {
    shotBtn.addEventListener("click", () => {
      console.log("Screenshot clicked (not implemented yet)");
    });
  }
}

// 啟動
main();
