import { initCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { initRenderer, render, setCloth } from "./renderer.js";

let currentPose = null;

/* ---------------- DEBUG ---------------- */
function debug(msg) {
  const el = document.getElementById("debugPanel");
  if (el) el.innerText = msg;
  console.log(msg);
}

/* ---------------- MAIN ---------------- */
async function main() {
  debug("APP START");

  // 1. Camera
  const video = await initCamera();
  if (!video) {
    debug("CAMERA FAIL");
    return;
  }
  debug("CAMERA OK");

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
    if (currentPose) {
      render(currentPose);
    }
    requestAnimationFrame(loop);
  }

  loop();
}

/* ---------------- UI ---------------- */
function setupClothesUI() {
  const items = document.querySelectorAll(".cloth-item");

  debug("cloth items: " + items.length);

  if (!items || items.length === 0) {
    debug("NO CLOTH ITEMS FOUND");
    return;
  }

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const cloth = item.getAttribute("data-cloth");

      debug("CLICK: " + cloth);

      setCloth(cloth);

      items.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
    });
  });

  const resetBtn = document.getElementById("btn-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      debug("RESET CLICKED");
      currentPose = null;
    });
  }

  const shotBtn = document.getElementById("btn-screenshot");
  if (shotBtn) {
    shotBtn.addEventListener("click", () => {
      debug("SCREENSHOT (not implemented)");
    });
  }
}

/* ---------------- BOOTSTRAP（重點修正）---------------- */
window.addEventListener("DOMContentLoaded", () => {
  main();
});
