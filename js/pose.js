let pose;
let video;
let onPoseCallback = null;

// 初始化 Pose
export async function initPose(videoElement, callback) {
  video = videoElement;
  onPoseCallback = callback;

  const { Pose, POSE_LANDMARKS, POSE_CONNECTIONS } = window;

  pose = new Pose({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
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

// 送 video frame 給 MediaPipe
function startCameraPipe() {
  async function detect() {
    if (video.readyState >= 2) {
      await pose.send({ image: video });
    }
    requestAnimationFrame(detect);
  }

  detect();
}

// Pose 結果處理
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

// landmark → pixel
function toXY(landmark) {
  if (!landmark) return null;

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  return {
    x: landmark.x * videoWidth,
    y: landmark.y * videoHeight,
    z: landmark.z
  };
}
