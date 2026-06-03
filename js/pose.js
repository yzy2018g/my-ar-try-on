export async function initPose() {
    if (!window.vision) return null;

    const { PoseLandmarker, FilesetResolver } = window.vision;

    const resolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
    );

    return await PoseLandmarker.createFromOptions(resolver, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite.task",
            delegate: "GPU"
        },
        runningMode: "VIDEO"
    });
}
