let pose;
let video;
let onPoseCallback = null;

export async function initPose(videoElement, callback) {
  video = videoElement;
  onPoseCallback = callback;

  if (!window.Pose) {
    console.error("MediaPipe Pose not loaded");
    return;
  }

  pose = new window.Pose({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  pose.onResults(onResults);

  startCameraPipe();
}

function startCameraPipe() {
  async function detect() {
    try {
      if (video && video.readyState >= 2 && pose) {
        await pose.send({ image: video });
      }
    } catch (e) {
      console.error("pose send error:", e);
    }

    requestAnimationFrame(detect);
  }

  detect();
}

function onResults(results) {
  if (!results.poseLandmarks) return;

  const lm = results.poseLandmarks;

  const poseData = {
    leftShoulder: toXY(lm[11]),
    rightShoulder: toXY(lm[12]),
    leftHip: toXY(lm[23]),
    rightHip: toXY(lm[24])
  };

  if (onPoseCallback) {
    onPoseCallback(poseData);
  }
}

function toXY(landmark) {
  if (!landmark || !video) return null;

  return {
    x: landmark.x * video.videoWidth,
    y: landmark.y * video.videoHeight,
    z: landmark.z
  };
}
