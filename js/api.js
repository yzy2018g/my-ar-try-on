const BASE = "https://michaelyo-my-ar-cloth-api.hf.space";

/* =========================
   1️⃣ UPLOAD IMAGE (手機穩定版)
========================= */
export async function uploadImage(file) {

    const formData = new FormData();
    formData.append("files", file);

    const res = await fetch(`${BASE}/gradio_api/upload`, {
        method: "POST",
        body: formData
    });

    const text = await res.text(); // ⚠️ 手機避免 json crash

    console.log("UPLOAD RAW:", text);

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error("UPLOAD JSON parse failed: " + text);
    }

    // ✅ 兼容多種回傳格式
    const path =
        Array.isArray(data) ? data[0] :
        data?.[0] ||
        data?.files?.[0] ||
        data?.path;

    if (!path) {
        throw new Error("UPLOAD failed: no file path");
    }

    return path;
}

/* =========================
   2️⃣ RUN TRY ON
========================= */
export async function runTryOn(personPath) {

    const res = await fetch(`${BASE}/gradio_api/call/v2/predict`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            input_image: {
                path: personPath,
                meta: { _type: "gradio.FileData" }
            }
        })
    });

    const data = await res.json();

    console.log("RUN TRYON RAW:", data);

    if (!data?.event_id) {
        throw new Error("No event_id from API");
    }

    return data.event_id;
}

/* =========================
   3️⃣ GET RESULT (SSE safe)
========================= */
export async function getResult(eventId) {

    const res = await fetch(
        `${BASE}/gradio_api/call/predict/${eventId}`
    );

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let text = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
    }

    console.log("RESULT RAW:", text);

    return text;
}
