const BASE = "https://michaelyo-my-ar-cloth-api.hf.space";

/* =========================
   🔥 1. UPLOAD (100% safe)
========================= */
export async function uploadImage(file) {

    const formData = new FormData();
    formData.append("files", file);

    console.log("UPLOAD START");

    const res = await fetch(`${BASE}/gradio_api/upload`, {
        method: "POST",
        body: formData
    });

    const text = await res.text();

    console.log("UPLOAD RAW TEXT:", text);

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error("UPLOAD NOT JSON: " + text);
    }

    // 🧠 超寬鬆解析（手機必備）
    let path = null;

    if (Array.isArray(data)) {
        path = data[0];
    } else if (typeof data === "string") {
        path = data;
    } else if (data?.[0]) {
        path = data[0];
    } else if (data?.files?.[0]) {
        path = data.files[0];
    } else if (data?.path) {
        path = data.path;
    }

    console.log("UPLOAD PARSED PATH:", path);

    if (!path) {
        throw new Error("UPLOAD FAILED: no path");
    }

    return path;
}

/* =========================
   🔥 2. RUN MODEL
   ⚠️ 先用最簡版本避免炸
========================= */
export async function runTryOn(personPath) {

    console.log("RUN TRYON START");

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

    console.log("RUN RAW:", data);

    if (!data || !data.event_id) {
        throw new Error("NO event_id");
    }

    return data.event_id;
}

/* =========================
   🔥 3. GET RESULT (SSE SAFE)
========================= */
export async function getResult(eventId) {

    console.log("GET RESULT START");

    const res = await fetch(`${BASE}/gradio_api/call/predict/${eventId}`);

    if (!res.body) {
        throw new Error("NO STREAM BODY (mobile issue)");
    }

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
