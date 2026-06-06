let video;

export async function initCamera() {
  video = document.getElementById("video");

  if (!video) {
    console.error("Video element not found");
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user", // 前鏡頭
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    video.srcObject = stream;

    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });

    console.log("Camera started");
    return video;

  } catch (err) {
    console.error("Camera error:", err);
    return null;
  }
}
