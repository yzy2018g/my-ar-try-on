export function drawVideo(ctx, video, w, h) {
  if (!video || video.readyState < 2) return;

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  // 保持比例 fill canvas（cover）
  const scale = Math.max(w / vw, h / vh);

  const sw = vw * scale;
  const sh = vh * scale;

  const sx = (w - sw) / 2;
  const sy = (h - sh) / 2;

  ctx.drawImage(video, sx, sy, sw, sh);
}
