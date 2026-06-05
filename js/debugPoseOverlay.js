let el = null;

export function initPoseDebug() {
    el = document.createElement("div");

    el.style.position = "fixed";
    el.style.top = "10px";
    el.style.right = "10px";
    el.style.zIndex = "9999";
    el.style.background = "rgba(0,0,0,0.7)";
    el.style.color = "#00ff00";
    el.style.padding = "8px";
    el.style.fontSize = "12px";
    el.style.fontFamily = "monospace";
    el.style.borderRadius = "6px";

    document.body.appendChild(el);
}

export function updatePoseDebug(poseResult) {

    if (!el) return;

    if (!poseResult?.landmarks?.length) {
        el.innerText = "NO POSE";
        return;
    }

    const lm = poseResult.landmarks[0];

    const l = lm[11];
    const r = lm[12];

    if (!l || !r) {
        el.innerText = "NO SHOULDER";
        return;
    }

    el.innerText =
`LEFT
x=${l.x.toFixed(3)}
y=${l.y.toFixed(3)}

RIGHT
x=${r.x.toFixed(3)}
y=${r.y.toFixed(3)}`;
}
