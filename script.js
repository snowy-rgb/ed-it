const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

document.getElementById("start-btn").addEventListener("click", async () => {
  const uploader = document.getElementById("uploader");
  const framesDiv = document.getElementById("frames");
  framesDiv.innerHTML = "";

  if (uploader.files.length === 0) {
    alert("동영상을 업로드하세요!");
    return;
  }

  try {
    const videoFile = uploader.files[0];

    // ffmpeg.wasm 불러오기
    if (!ffmpeg.isLoaded()) {
      console.log("FFmpeg 로딩 중...");
      await ffmpeg.load();
      console.log("FFmpeg 로딩 완료!");
    }

    // 비디오 파일 준비
    ffmpeg.FS("writeFile", "input.mp4", await fetchFile(videoFile));

    // 프레임 추출 (1초에 10프레임)
    await ffmpeg.run("-i", "input.mp4", "-vf", "fps=10", "frame_%03d.png");

    // 추출된 프레임 읽기
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

    alert("프레임 추출 완료!");
  } catch (err) {
    console.error("오류 발생:", err);
    alert("⚠️ 오류가 발생했어요: " + err.message);
  }
});
