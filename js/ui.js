export function setStatus(text) {
    const el = document.getElementById("sysStatus");

    if (!el) {
        console.warn("sysStatus missing");
        return;
    }

    el.innerText = text;
}

export function showLoading(msg) {
    const el = document.getElementById("loadingStatus");
    el.style.display = "block";
    el.textContent = msg;
}

export function hideLoading() {
    document.getElementById("loadingStatus").style.display = "none";
}
