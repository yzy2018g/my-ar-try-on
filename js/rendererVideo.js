export function drawVideo(ctx, video, w, h) {
  const vw = video?.videoWidth || w || 640;
  const vh = video?.videoHeight || h || 480;

  if (!video || video.readyState < 2) return;

  ctx.drawImage(video, 0, 0, vw, vh);
}
