import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@1/dist/index.min.js";

let client = null;

export async function initAPI() {
    if (!client) {
        client = await Client.connect(
            "michaelyo/my-ar-cloth-api"
        );
    }
}

export async function removeBackground(file) {
    await initAPI();

    const result = await client.predict(
        "/predict",
        {
            input_image: file
        }
    );

    return result;
}
