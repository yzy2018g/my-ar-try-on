import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@1/dist/index.min.js";

let client = null;

export async function initAPI() {
    client = await Client.connect("michaelyo/my-ar-cloth-api");
}

export async function removeBackground(imageFile) {
    if (!client) await initAPI();

    return await client.predict("/predict", {
        input_image: imageFile
    });
}
