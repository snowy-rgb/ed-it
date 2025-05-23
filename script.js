  const selfieSegmentation = new SelfieSegmentation.SelfieSegmentation({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
    }
  });

  selfieSegmentation.setOptions({
    modelSelection: 1,
  });

  selfieSegmentation.onResults((results) => {
    console.log(results);
  });

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// 진행률 텍스트 추가
const progressText = document.createElement("div");
progressText.style.marginTop = "10px";
progressText.style.fontSize = "16px";
progressText.innerText = "진행률: 0%";
document.body.appendChild(progressText);


selfieSegmentation.setOptions({
  modelSelection: 1,
});

selfieSegmentation.onResults((results) => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-in";
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
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

        // 🔁 진행률 계산
        const progress = Math.floor((video.currentTime / video.duration) * 100);
        progressText.innerText = `진행률: ${progress}%`;

        requestAnimationFrame(render);
      } else {
        // 완료 메시지
        progressText.innerText = "✅ 처리 완료!";
      }
    };
    render();
  };
});

// 로그 출력 함수
function logToScreen(type, message) {
  const logEl = document.getElementById("log-output");
  const prefix = type === 'error' ? '❌ ERROR:' :
                 type === 'warn'  ? '⚠️ WARN:'  : '📗 LOG:';
  logEl.innerText += `${prefix} ${message}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

// 기존 콘솔 함수 보존
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

// console 함수 덮어쓰기
console.log = (...args) => {
  originalConsole.log(...args);
  logToScreen("log", args.join(" "));
};

console.warn = (...args) => {
  originalConsole.warn(...args);
  logToScreen("warn", args.join(" "));
};

console.error = (...args) => {
  originalConsole.error(...args);
  logToScreen("error", args.join(" "));
};

// 예: 처리 시작 시 메시지
console.log("💡 배경 제거기 시작됨");
