import { SelfieSegmentation } from 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js';

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const selfieSegmentation = new SelfieSegmentation({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
});

selfieSegmentation.setOptions({
  modelSelection: 1, // 0: 빠름, 1: 더 정확
});

selfieSegmentation.onResults((results) => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // segmentationMask를 먼저 그림 (사람이 흰색, 배경이 검정색)
  ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

  // 배경 제거를 위해 사람 부분만 남김
  ctx.globalCompositeOperation = "source-in";
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  // 설정 초기화
  ctx.globalCompositeOperation = "source-over";
});

document.getElementById("uploader").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  video.src = URL.createObjectURL(file);
  video.play();

  video.onplay = () => {
    const render = async () => {
      if (!video.paused && !video.ended) {
        await selfieSegmentation.send({ image: video });
        requestAnimationFrame(render);
      }
    };
    render();
  };
});