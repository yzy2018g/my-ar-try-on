import { initCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { initRenderer, render, setCloth } from "./renderer.js";

let currentPose = null;

function debug(msg) {
  const el = document.getElementById("debugPanel");
  if (el) el.innerText = msg;
  console.log(msg);
}

/* ==============================
   MAIN
============================== */
async function main() {
  debug("APP START");

  // 1. Camera
  const video = await initCamera();
  if (!video) {
    debug("CAMERA FAIL");
    return;
  }

  debug("CAMERA OK");

  // 🔥 等 video ready（很重要）
  await new Promise(resolve => {
    if (video.videoWidth > 0) return resolve();
    video.onloadedmetadata = () => resolve();
  });

  // 2. Renderer
  initRenderer();
  debug("RENDERER OK");

  // 3. Pose
  await initPose(video, (poseData) => {
    currentPose = poseData;
  });

  debug("POSE OK");

  // 4. UI
  setupClothesUI();
  debug("UI READY");

  // 5. Render loop
  function loop() {
    if (currentPose) render(currentPose);
    requestAnimationFrame(loop);
  }

  loop();
}

/* ==============================
   UI
============================== */
function setupClothesUI() {
  const items = document.querySelectorAll(".cloth-item");

  if (!items.length) {
    debug("NO CLOTH ITEMS FOUND");
    return;
  }

  items.forEach(item => {
    item.addEventListener("click", () => {
      const cloth = item.getAttribute("data-cloth");

      debug("CLICK: " + cloth);

      setCloth(cloth);

      items.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
    });
  });

  document.getElementById("btn-reset")?.addEventListener("click", () => {
    debug("RESET");
    currentPose = null;
  });

  document.getElementById("btn-screenshot")?.addEventListener("click", () => {
    debug("SCREENSHOT");
  });
}

/* ==============================
   BOOTSTRAP（修正重點）
============================== */
window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");

  startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    await main();
  });
});
