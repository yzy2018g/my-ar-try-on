const BASE_URL = "https://michaelyo-my-ar-cloth-api.hf.space";

// 1️⃣ upload image
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("files", file);

  const res = await fetch(`${BASE_URL}/gradio_api/upload`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data[0]; // file path
}

// 2️⃣ call model
export async function runTryOn(imagePath) {
  const res = await fetch(`${BASE_URL}/gradio_api/call/v2/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input_image: {
        path: imagePath,
        meta: { _type: "gradio.FileData" }
      }
    })
  });

  const data = await res.json();
  return data.event_id;
}

// 3️⃣ get result (SSE)
export async function getResult(eventId) {
  const res = await fetch(
    `${BASE_URL}/gradio_api/call/predict/${eventId}`
  );

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let result = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return result;
}
