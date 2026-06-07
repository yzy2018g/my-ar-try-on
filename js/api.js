import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@1/dist/index.min.js";

let client = null;

/* ===============================
   INIT
================================ */
export async function initAPI() {
    if (client) return client;

    client = await Client.connect(
        "michaelyo/my-ar-cloth-api"
    );

    return client;
}

/* ===============================
   REMOVE BG
================================ */
export async function removeBackground(file) {
    try {
        const c = await initAPI();

        const result = await c.predict("/predict", {
            input_image: file
        });

        // 🔥 Gradio standard output fix
        const outputUrl =
            result?.data?.[0] ||
            result?.[0] ||
            null;

        if (!outputUrl) {
            console.warn("API: empty result", result);
            return null;
        }

        return outputUrl;

    } catch (err) {
        console.error("API ERROR:", err);
        return null;
    }
}
