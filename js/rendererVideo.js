export function drawVideo(ctx, video, w, h) {
  if (!video) return;

  ctx.drawImage(video, 0, 0, w, h);
}
