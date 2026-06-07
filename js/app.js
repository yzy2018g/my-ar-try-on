import { removeBackground } from "./api.js";
import { initCamera } from "./camera.js";
import { initPose } from "./pose.js";
import { initRenderer } from "./renderer.js";

/* ---------------- DEBUG API TEST ---------------- */
async function testClothAPI(file) {
    log("API: START");

    if (!file) {
        log("API: NO FILE");
        return null;
    }

    try {
        log(`API: FILE OK (${file.name})`);

        const result = await removeBackground(file);

        log("API: SUCCESS");

        // 印出完整回傳內容
        log("RESULT:");
        log(JSON.stringify(result));

        return result;

    } catch (err) {
        log("API: ERROR");
        log(err.message || String(err));
        return null;
    }
}

let currentPose = null;

/* ==============================
   DEBUG (UI safe)
============================== */
let debugLogs = [];
function log(msg) {
  const time = new Date().toLocaleTimeString();
  debugLogs.push(`[${time}] ${msg}`);

  // 最多保留 8 行（避免爆掉）
  if (debugLogs.length > 8) {
    debugLogs.shift();
  }

  renderDebug();
}
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

--- LOG ---
${debugLogs.join("\n")}
`;
}
function renderDebug() {
  // 你原本 debug 需要 state
  debug({
    camera: window.cameraState,
    video: window.videoState,
    pose: window.poseState,
    render: window.renderState
  });
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

  // 等 video ready
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
    item.addEventListener("click", () => {
      const cloth = item.getAttribute("data-cloth");

      debug({
        camera: "OK",
        video: "READY",
        pose: currentPose ? "LIVE" : "NULL",
        render: "RUNNING"
      });

      setCloth(cloth);

      items.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
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
   BOOTSTRAP (SAFE)
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

document.getElementById("testBtn").onclick = async () => {
  const file = document.getElementById("fileInput").files[0];

  if (!file) {
    console.log("請先選圖片");
    return;
  }

  const url = await testClothAPI(file);

  console.log("去背結果:", url);

  const img = new Image();
  img.src = url;
  document.body.appendChild(img);
};
