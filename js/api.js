const BASE = "https://michaelyo-my-ar-cloth-api.hf.space";

/* =========================
   🧠 LOG HELPERS
========================= */
function log(tag, msg) {
    console.log(`[${tag}]`, msg);
}

/* =========================
   1️⃣ UPLOAD IMAGE（手機穩定）
========================= */
export async function uploadImage(file) {

    log("UPLOAD", "START");

    const formData = new FormData();
    formData.append("files", file);

    let res;
    try {
        res = await fetch(`${BASE}/gradio_api/upload`, {
            method: "POST",
            body: formData
        });
    } catch (err) {
        log("UPLOAD ERROR", err.message);
        throw new Error("UPLOAD FETCH FAILED");
    }

    const text = await res.text();
    log("UPLOAD RAW", text);

    let data;

    try {
        data = JSON.parse(text);
    } catch (e) {
        // ⚠️ 手機常見：不是 JSON
        log("UPLOAD PARSE FAIL", text);
        data = text;
    }

    let path = null;

    if (Array.isArray(data)) {
        path = data[0];
    } else if (typeof data === "string") {
        path = data;
    } else if (data?.files?.[0]) {
        path = data.files[0];
    } else if (data?.path) {
        path = data.path;
    }

    log("UPLOAD PATH", path);

    if (!path) {
        throw new Error("UPLOAD FAILED (no path)");
    }

    return path;
}

/* =========================
   2️⃣ RUN TRY ON
========================= */
export async function runTryOn(personPath) {

    log("RUN", "START");

    let res;

    try {
        res = await fetch(`${BASE}/gradio_api/call/v2/predict`, {
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
    } catch (err) {
        log("RUN ERROR", err.message);
        throw new Error("RUN FETCH FAILED");
    }

    const text = await res.text();
    log("RUN RAW", text);

    let data;

    try {
        data = JSON.parse(text);
    } catch (e) {
        log("RUN PARSE FAIL", text);
        throw new Error("RUN JSON PARSE FAILED");
    }

    const eventId = data?.event_id;

    log("EVENT ID", eventId);

    if (!eventId) {
        throw new Error("NO EVENT ID");
    }

    return eventId;
}

/* =========================
   3️⃣ GET RESULT（手機 safe）
========================= */
export async function getResult(eventId) {

    log("RESULT", "START");

    const url = `${BASE}/gradio_api/call/predict/${eventId}`;

    let res;

    try {
        res = await fetch(url);
    } catch (err) {
        log("RESULT ERROR", err.message);
        throw new Error("RESULT FETCH FAILED");
    }

    const text = await res.text();

    log("RESULT RAW", text);

    return text;
}

window.uploadImage = uploadImage;
window.runTryOn = runTryOn;
window.getResult = getResult;
