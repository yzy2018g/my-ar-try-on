export function drawVideo(ctx, video, w, h) {
  // ❗ video 還沒 ready 直接 skip（避免 crash）
  if (!video || video.readyState < 2) return;

  ctx.drawImage(video, 0, 0, w, h);
}
