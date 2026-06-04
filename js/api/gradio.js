export async function selectClothAPI(src) {

    /* =========================
       1️⃣ load image
    ========================= */
    const clothBlob = await (await fetch(src)).blob();

    /* =========================
       2️⃣ upload
    ========================= */
    const uploadForm = new FormData();
    uploadForm.append("files", clothBlob, "cloth.png");

    const uploadRes = await fetch(
        "https://michaelyo-my-ar-cloth-api.hf.space/gradio_api/upload",
        {
            method: "POST",
            body: uploadForm
        }
    );

    if (!uploadRes.ok) {
        throw new Error(`Upload failed ${uploadRes.status}`);
    }

    const uploadData = await uploadRes.json();
    const tempPath = uploadData?.[0];

    if (!tempPath) {
        throw new Error("Upload return invalid");
    }

    /* =========================
       3️⃣ predict
    ========================= */
    const res = await fetch(
        "https://michaelyo-my-ar-cloth-api.hf.space/gradio_api/call/predict",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                data: [{
                    path: tempPath,
                    url: `https://michaelyo-my-ar-cloth-api.hf.space/file=${tempPath}`,
                    orig_name: "cloth.png",
                    size: clothBlob.size,
                    mime_type: "image/png"
                }]
            })
        }
    );

    if (!res.ok) {
        throw new Error(`Predict failed ${res.status}`);
    }

    const { event_id } = await res.json();

    /* =========================
       4️⃣ poll result
    ========================= */
    return await pollResult(event_id);
}

/* =========================
   🔥 SSE RESULT PARSER (FIXED)
========================= */
async function pollResult(event_id) {

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts++ < maxAttempts) {

        const res = await fetch(
            `https://michaelyo-my-ar-cloth-api.hf.space/gradio_api/call/predict/${event_id}`,
            {
                method: "GET",
                headers: {
                    "Accept": "text/event-stream"
                }
            }
        );

        if (!res.ok) {
            throw new Error(`Status ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";
        let done = false;

        while (!done) {
            const { value, done: d } = await reader.read();
            done = d;

            buffer += decoder.decode(value || new Uint8Array(), {
                stream: true
            });

            if (buffer.includes("complete")) {

                try {
                    const jsonMatch = buffer.match(/\{.*\}/s);
                    if (!jsonMatch) continue;

                    const obj = JSON.parse(jsonMatch[0]);

                    /* =========================
                       🔥 MOST IMPORTANT FIX
                    ========================= */

                    const resultUrl =
                        obj?.url ||
                        obj?.data?.[0]?.url ||
                        obj?.data?.[0]?.path ||
                        obj?.output?.url ||
                        obj?.output?.path ||
                        obj?.path;

                    if (!resultUrl) {
                        throw new Error("No valid result url");
                    }

                    return normalizeUrl(resultUrl);
                } catch (e) {
                    console.warn("parse error", e);
                }
            }
        }

        await new Promise(r => setTimeout(r, 400));
    }

    throw new Error("Timeout");
}

/* =========================
   🔥 URL NORMALIZER (SAFE)
========================= */
function normalizeUrl(path) {

    if (!path) return null;

    if (path.startsWith("http")) return path;

    let clean = path
        .replace(/^\/+/, "")
        .replace(/^tmp\/gradio\//, "")
        .replace(/^data\//, "");

    /* =========================
       ⚠️ fallback strategy order:
       1. file=
       2. gradio_api/file/
    ========================= */

    return {
        primary: `https://michaelyo-my-ar-cloth-api.hf.space/file=${clean}`,
        fallback: `https://michaelyo-my-ar-cloth-api.hf.space/gradio_api/file/${clean}`
    };
}
