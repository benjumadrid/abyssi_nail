import json
import subprocess
import os

FFMPEG_EXE = r"C:\Users\acer\AppData\Local\Programs\Python\Python314\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

def build():
    with open("voice_timing.json") as f:
        timing = json.load(f)

    with open("voice_concat.txt", "w") as f:
        for item in timing:
            p = os.path.abspath(item["path"]).replace("\\", "/")
            f.write(f"file '{p}'\n")

    cmd = [
        FFMPEG_EXE, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", "voice_concat.txt",
        "-c", "copy",
        "master_voiceover.mp3"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print("master_voiceover.mp3 generated successfully!")
    else:
        print("Error:", res.stderr)

if __name__ == "__main__":
    build()
