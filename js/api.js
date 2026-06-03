const BASE = "https://michaelyo-my-ar-cloth-api.hf.space";

/* =========================
   UPLOAD
========================= */
export async function uploadImage(file) {

    const formData = new FormData();
    formData.append("files", file);

    const res = await fetch(`${BASE}/gradio_api/upload`, {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    let path = null;

    if (Array.isArray(data)) path = data[0];
    else if (typeof data === "string") path = data;
    else if (data?.[0]) path = data[0];
    else if (data?.path) path = data.path;

    if (!path) throw new Error("UPLOAD FAIL");

    return path;
}

/* =========================
   RUN
========================= */
export async function runTryOn(personPath) {

    const res = await fetch(`${BASE}/gradio_api/call/v2/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            input_image: {
                path: personPath,
                meta: { _type: "gradio.FileData" }
            }
        })
    });

    const data = await res.json();

    if (!data?.event_id) {
        throw new Error("NO EVENT ID");
    }

    return data.event_id;
}

/* =========================
   RESULT
========================= */
export async function getResult(eventId) {

    const res = await fetch(`${BASE}/gradio_api/call/predict/${eventId}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let text = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
    }

    return text;
}

/* =========================
   🔥 CRITICAL: window injection
========================= */
window.uploadImage = uploadImage;
window.runTryOn = runTryOn;
window.getResult = getResult;

console.log("API JS LOADED OK");
