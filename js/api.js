import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@1/dist/index.min.js";

let client = null;

export async function initAPI() {

    console.log("INIT API");

    client = await Client.connect(
        "michaelyo/my-ar-cloth-api"
    );

    console.log("CLIENT CONNECTED");
}

export async function removeBackground(imageFile) {

    try {

        if (!client) {
            console.log("NO CLIENT -> CONNECT");
            await initAPI();
        }

        console.log("START PREDICT");

        const result = await client.predict(
            "/predict",
            {
                input_image: imageFile
            }
        );

        console.log("PREDICT OK");

        return result;

    } catch(err) {

        console.error("API ERROR", err);

        throw err;
    }
}
