const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

document.getElementById("start-btn").addEventListener("click", async () => {
  const uploader = document.getElementById("uploader");
  if (uploader.files.length === 0) return alert("동영상을 업로드하세요!");

  const videoFile = uploader.files[0];

  if (!ffmpeg.isLoaded()) await ffmpeg.load();
  ffmpeg.FS("writeFile", "input.mp4", await fetchFile(videoFile));

  // 프레임 분해 (1초에 10장 기준)
  await ffmpeg.run("-i", "input.mp4", "-vf", "fps=10", "frame_%03d.png");

  const frameFiles = ffmpeg.FS("readdir", ".").filter(name => name.endsWith(".png"));

  const framesDiv = document.getElementById("frames");
  framesDiv.innerHTML = "";

  for (let file of frameFiles) {
    const data = ffmpeg.FS("readFile", file);
    const url = URL.createObjectURL(new Blob([data.buffer], { type: "image/png" }));
    const img = document.createElement("img");
    img.src = url;
    framesDiv.appendChild(img);
  }
});
