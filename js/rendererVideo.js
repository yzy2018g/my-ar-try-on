export function drawVideo(ctx, video, w, h) {
  if (!video || video.readyState < 2) return;

  ctx.drawImage(video, 0, 0, w, h);
}
