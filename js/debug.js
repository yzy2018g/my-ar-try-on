/* =========================
   DEBUG MODULE
========================= */

function safeGet(id) {
    return document.getElementById(id);
}

export function log(msg) {
    console.log(msg);

    const box = safeGet("debugBox");
    if (box) {
        box.innerText += "\n" + msg;
        box.scrollTop = box.scrollHeight;
    }
}

export function step(tag, msg) {
    log(`👉 ${tag}: ${msg}`);
}

export function error(tag, msg) {
    log(`❌ ${tag}: ${msg}`);
    console.error(tag, msg);
}

export function led(id, ok) {
    const el = safeGet(id);
    if (!el) return;

    const base = el.innerText?.split(":")[0] || id;
    el.innerText = `${base}: ${ok ? "🟢" : "🔴"}`;
}

export function safeGetEl(id) {
    return document.getElementById(id);
}
