// removeBg.js
const HF_API =
  "https://api-inference.huggingface.co/models/briaai/RMBG-1.4";

const HF_TOKEN = "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";

export async function removeBackground(imageUrl) {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();

    const apiRes = await fetch(HF_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/octet-stream"
      },
      body: blob
    });

    if (!apiRes.ok) {
      console.error(await apiRes.text());
      return imageUrl; // fallback
    }

    const resultBlob = await apiRes.blob();
    return URL.createObjectURL(resultBlob);

  } catch (err) {
    console.error("removeBg error:", err);
    return imageUrl;
  }
}
