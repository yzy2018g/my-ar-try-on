document.body.innerHTML = "JS LOADED";
import { initCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { initRenderer, render, setCloth } from "./renderer.js";

let currentPose = null;

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
   MAIN
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
    video.onloadeddata = () => resolve();
  });

  debug({ camera: "OK", video: "READY", pose: "-", render: "-" });

  initRenderer();

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
