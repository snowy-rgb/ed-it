const selfieSegmentation = new SelfieSegmentation({
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

// 🟡 1. 캔버스에서 비디오 스트림 가져오기
const stream = canvas.captureStream();
const recordedChunks = [];
let recorder = null;

// 🟡 2. 녹화기 초기화
function startRecording() {
  recordedChunks.length = 0;
  recorder = new MediaRecorder(stream, { mimeType: "video/webm" });

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  recorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    // 다운로드 링크 생성
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "output_video.webm";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    console.log("🎬 변환된 영상 다운로드 완료!");
  };

  recorder.start();
  console.log("🎥 녹화 시작!");
}

// 🟡 3. 녹화 종료
function stopRecording() {
  if (recorder && recorder.state === "recording") {
    recorder.stop();
  }
}

video.onplay = () => {
  // ⬇️ 여기서 stream을 새로 가져와야 안전함!
  const stream = canvas.captureStream();
  recordedChunks.length = 0;
  recorder = new MediaRecorder(stream, { mimeType: "video/webm" });

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  recorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    convertWebMtoMP4(blob); // ← 이 부분!

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "output_video.webm";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    console.log("🎬 변환된 영상 다운로드 완료!");
  };

  recorder.start();
  console.log("🎥 녹화 시작!");

  // 렌더 시작
  const render = async () => {
    if (!video.paused && !video.ended) {
      await selfieSegmentation.send({ image: video });

      const progress = Math.floor((video.currentTime / video.duration) * 100);
      progressText.innerText = `진행률: ${progress}%`;

      requestAnimationFrame(render);
    } else {
      progressText.innerText = "✅ 처리 완료!";
      recorder.stop(); // 녹화 종료
    }
  };

  render();
};

console.log('loaded')
document.getElementById("downloadBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "canvas_snapshot.png"; // 저장될 파일명
  link.href = canvas.toDataURL("image/png"); // canvas → PNG URL
  link.click(); // 자동 클릭으로 다운로드
});

import { createFFmpeg, fetchFile } from 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.2/dist/esm/index.js';
const ffmpeg = createFFmpeg({ log: true });

async function convertWebMtoMP4(webmBlob) {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  const webmData = await fetchFile(webmBlob);
  ffmpeg.FS('writeFile', 'input.webm', webmData);

  await ffmpeg.run('-i', 'input.webm', 'output.mp4');

  const mp4Data = ffmpeg.FS('readFile', 'output.mp4');
  const mp4Blob = new Blob([mp4Data.buffer], { type: 'video/mp4' });
  const mp4Url = URL.createObjectURL(mp4Blob);

  // 다운로드 링크 자동 생성
  const a = document.createElement('a');
  a.href = mp4Url;
  a.download = 'converted_video.mp4';
  a.click();

  console.log('🎥 MP4 변환 완료 및 다운로드!');
}


