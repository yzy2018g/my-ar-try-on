import { initCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { initRenderer, render, setCloth } from "./renderer.js";
import { handleClothChange } from "./clothPipeline.js";

let currentPose = null;

/* ==============================
   DEBUG (UI safe)
============================== */
function debug(state) {
  const el = document.getElementById("debugPanel");
  if (!el) return;

  el.innerText =
`[AR DEBUG]
APP: RUNNING

CAMERA: ${state.camera || "?"}
VIDEO: ${state.video || "?"}
POSE: ${state.pose || "?"}
RENDER: ${state.render || "?"}
`;
}

/* ==============================
   MAIN PIPELINE
============================== */
async function main() {
  debug({ camera: "INIT", video: "-", pose: "-", render: "-" });

  const video = await initCamera();

  if (!video) {
    debug({ camera: "FAIL", video: "-", pose: "-", render: "-" });
    return;
  }

  debug({ camera: "OK", video: "WAITING", pose: "-", render: "-" });

  await new Promise(resolve => {
    if (video.readyState >= 2) return resolve();
    video.onloadeddata = () => resolve();
  });

  debug({ camera: "OK", video: "READY", pose: "-", render: "-" });

  initRenderer();

  debug({ camera: "OK", video: "READY", pose: "INIT", render: "READY" });

  await initPose(video, (poseData) => {
    currentPose = poseData;

    debug({
      camera: "OK",
      video: "READY",
      pose: poseData ? "LIVE" : "NULL",
      render: "RUNNING"
    });
  });

  debug({
    camera: "OK",
    video: "READY",
    pose: "INIT",
    render: "RUNNING"
  });

  /* ==============================
     RENDER LOOP
  ============================== */
  function loop() {
    if (currentPose) {
      render(currentPose);
    }
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
    debug({ camera: "-", video: "-", pose: "NO CLOTH UI", render: "-" });
    return;
  }

  items.forEach(item => {
    item.addEventListener("click", async () => {
      const cloth = item.getAttribute("data-cloth");

      debug({
        camera: "OK",
        video: "READY",
        pose: currentPose ? "LIVE" : "NULL",
        render: "LOADING CLOTH"
      });

      // 🔥 核心：先去背再套用
      await handleClothChange(cloth);

      items.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      debug({
        camera: "OK",
        video: "READY",
        pose: currentPose ? "LIVE" : "NULL",
        render: "RUNNING"
      });
    });
  });

  document.getElementById("btn-reset")?.addEventListener("click", () => {
    currentPose = null;

    debug({
      camera: "OK",
      video: "READY",
      pose: "RESET",
      render: "RUNNING"
    });
  });

  document.getElementById("btn-screenshot")?.addEventListener("click", () => {
    debug({
      camera: "OK",
      video: "READY",
      pose: currentPose ? "LIVE" : "NULL",
      render: "RUNNING"
    });
  });
}

/* ==============================
   BOOTSTRAP
============================== */
window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");

  if (!startBtn) {
    console.error("startBtn not found");
    return;
  }

  setupClothesUI();

  startBtn.addEventListener("click", async () => {
    startBtn.style.display = "none";
    await main();
  });
});
