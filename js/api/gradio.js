export async function selectClothAPI(src) {

    const clothBlob = await (await fetch(src)).blob();

    /* =========================
       upload
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
        throw new Error(`Upload failed (${uploadRes.status})`);
    }

    const uploadData = await uploadRes.json();
    const tempPath = uploadData?.[0];

    if (!tempPath) {
        throw new Error("Upload format error");
    }

    /* =========================
       predict
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
        throw new Error(`Predict failed (${res.status})`);
    }

    const { event_id } = await res.json();

    /* =========================
       SSE polling
    ========================= */
    return await pollResult(event_id);
}

/* =========================
   FIXED SSE (no 404)
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
            throw new Error(`Status error ${res.status}`);
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
                const match = buffer.match(/"path"\s*:\s*"([^"]+)"/);
                if (match?.[1]) {
                    console.log("RAW PATH =", match[1]);
                    return match[1];
                }
            }
        }

        await new Promise(r => setTimeout(r, 400));
    }

    throw new Error("Timeout");
}
