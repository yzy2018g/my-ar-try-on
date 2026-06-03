export async function startCamera(video) {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
        },
        audio: false
    });

    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = async () => {
            await video.play();
            resolve();
        };
    });
}
