export function setStatus(msg) {
    document.getElementById("sysStatus").textContent = msg;
}

export function showLoading(msg) {
    const el = document.getElementById("loadingStatus");
    el.style.display = "block";
    el.textContent = msg;
}

export function hideLoading() {
    document.getElementById("loadingStatus").style.display = "none";
}
