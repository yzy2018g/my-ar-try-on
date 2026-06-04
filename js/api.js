const BASE = "https://michaelyo-my-ar-cloth-api.hf.space";

/* =========================
   SMALL HELPERS
========================= */
function safeJson(data) {
    try {
        return typeof data === "string" ? JSON.parse(data) : data;
    } catch {
        return data;
    }
}

/* =========================
   UPLOAD (ROBUST)
========================= */
export async function uploadImage(file) {

    if (!file) throw new Error("NO FILE");

    const formData = new FormData();
    formData.append("files", file);

    const res = await fetch(`${BASE}/gradio_api/upload`, {
        method: "POST",
        body: formData
    });

    if (!res.ok) {
        throw new Error("UPLOAD HTTP FAIL");
    }

    const data = await res.json();

    const path =
        data?.[0] ||
        data?.path ||
        data?.data?.[0] ||
        (Array.isArray(data) ? data[0] : null);

    if (!path) {
        throw new Error("UPLOAD PARSE FAIL");
    }

    return path;
}

/* =========================
   RUN TRY ON (ROBUST)
========================= */
export async function runTryOn(personPath) {

    if (!personPath) throw new Error("NO PERSON PATH");

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

    if (!res.ok) {
        throw new Error("RUN HTTP FAIL");
    }

    const data = await res.json();

    const eventId =
        data?.event_id ||
        data?.hash ||
        data?.id;

    if (!eventId) {
        throw new Error("NO EVENT ID");
    }

    return eventId;
}

/* =========================
   GET RESULT (STREAM SAFE)
========================= */
export async function getResult(eventId) {

    if (!eventId) throw new Error("NO EVENT ID");

    const res = await fetch(`${BASE}/gradio_api/call/predict/${eventId}`);

    if (!res.ok) {
        throw new Error("RESULT HTTP FAIL");
    }

    if (!res.body) {
        throw new Error("EMPTY STREAM");
    }

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
   PARSE RESULT (SAFE)
========================= */
export function parseResult(raw) {

    if (!raw) return null;

    try {
        const jsonMatch = raw.match(/\{.*\}/s);
        if (!jsonMatch) return null;

        return safeJson(jsonMatch[0]);

    } catch (e) {
        console.error("PARSE FAIL", e);
        return null;
    }
}

export async function removeBackground(file) {

    const formData = new FormData();
    formData.append("files", file);

    const res = await fetch(`${BASE}/gradio_api/remove_bg`, {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    const url = data?.url || data?.data?.[0];

    if (!url) throw new Error("NO BG RESULT");

    return url;
}

/* =========================
   WINDOW INJECTION (SAFE)
========================= */
window.uploadImage = uploadImage;
window.runTryOn = runTryOn;
window.getResult = getResult;
window.parseResult = parseResult;

window.API_READY = true;

console.log("API JS LOADED OK (STABLE VERSION)");
