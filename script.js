const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

const progressText = document.getElementById("progress-text");
const progressBar = document.getElementById("progress-bar");

document.getElementById("start-btn").addEventListener("click", async () => {
  const uploader = document.getElementById("uploader");
  const framesDiv = document.getElementById("frames");
  framesDiv.innerHTML = "";
  progressText.textContent = "진행률: 0%";
  progressBar.value = 0;

  if (uploader.files.length === 0) {
    alert("동영상을 업로드하세요!");
    return;
  }

  try {
    const videoFile = uploader.files[0];

    if (!ffmpeg.isLoaded()) {
      console.log("FFmpeg 로딩 중...");
      await ffmpeg.load();
      console.log("FFmpeg 로딩 완료!");
    }

    ffmpeg.setProgress(({ ratio }) => {
      const percent = Math.round(ratio * 100);
      progressText.textContent = `진행률: ${percent}%`;
      progressBar.value = percent;
    });

    ffmpeg.FS("writeFile", "input.mp4", await fetchFile(videoFile));

    await ffmpeg.run("-i", "input.mp4", "-vf", "fps=2", "frame_%03d.png");

    const frameFiles = ffmpeg.FS("readdir", ".").filter(name => name.endsWith(".png"));

    if (frameFiles.length === 0) {
      alert("프레임 추출에 실패했어요. 다른 동영상으로 시도해보세요.");
      return;
    }

    for (let file of frameFiles) {
      const data = ffmpeg.FS("readFile", file);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: "image/png" }));
      const img = document.createElement("img");
      img.src = url;
      framesDiv.appendChild(img);
    }

    progressText.textContent = `진행 완료!`;
    progressBar.value = 100;
    alert("✅ 프레임 추출이 완료되었습니다!");
  } catch (err) {
    console.error("오류 발생:", err);
    alert("⚠️ 오류가 발생했어요: " + err.message);
  }
});