export function setStatus(text) {
    const el = document.getElementById("sysStatus");
    if (!el) return;
    el.innerText = text;
}

/* =========================
   SAFE LOADING (關鍵修復)
========================= */
export function showLoading(text) {
    const el = document.getElementById("loading");

    if (!el) {
        console.warn("loading element missing");
        return;
    }

    el.innerText = text || "Loading...";
    el.style.display = "block";
}

export function hideLoading() {
    const el = document.getElementById("loading");

    if (!el) {
        console.warn("loading element missing");
        return;
    }

    el.style.display = "none";
}
