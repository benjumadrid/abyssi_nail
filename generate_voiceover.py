import asyncio
import os
import subprocess
import edge_tts

VOICE = "en-US-JennyNeural"

SCENES = [
    {
        "id": "scene1",
        "text": "Welcome to Beauty Abyssi! Let's scroll down to explore our luxury nail and pedicure treatments."
    },
    {
        "id": "scene2_hand",
        "text": "Filter by Hand nails to browse classic manicures, gel, French tips, and cat-eye art."
    },
    {
        "id": "scene2_pedi",
        "text": "Or explore our Pedicures for relaxing foot care and luxury designs."
    },
    {
        "id": "scene2_inspo",
        "text": "Have a design from Pinterest or TikTok? We bring any custom nail photo to life!"
    },
    {
        "id": "scene3_book",
        "text": "Let's book Classic Manicure! Simply click 'Book' right on the treatment card."
    },
    {
        "id": "scene4_combo",
        "text": "Classic Manicure is selected. You can combine a Pedicure, or attach custom photo references."
    },
    {
        "id": "scene5_date",
        "text": "Choose your preferred appointment date on the calendar."
    },
    {
        "id": "scene6_details",
        "text": "Enter your full name, active phone number, and your village: Kombolcha, Shisha Ber."
    },
    {
        "id": "scene7_submit",
        "text": "Add your shape or polish notes, and tap 'Confirm & Register Online'!"
    },
    {
        "id": "scene8_confirm",
        "text": "You're officially registered! Tap 'Direct Chat' to message the artist on Telegram. Done!"
    }
]

FFMPEG_EXE = r"C:\Users\acer\AppData\Local\Programs\Python\Python314\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

async def generate():
    os.makedirs("voice_clips", exist_ok=True)
    results = []
    concat_list = []

    for s in SCENES:
        out_path = os.path.join("voice_clips", f"{s['id']}.mp3")
        # +4% rate for natural, energetic, professional pacing
        communicate = edge_tts.Communicate(s["text"], VOICE, rate="+4%")
        await communicate.save(out_path)
        
        proc = subprocess.run([FFMPEG_EXE, "-i", out_path], capture_output=True, text=True)
        dur_str = "0"
        for line in proc.stderr.splitlines():
            if "Duration:" in line:
                dur_str = line.split("Duration:")[1].split(",")[0].strip()
                break
        
        h, m, sec = dur_str.split(":")
        total_sec = float(h)*3600 + float(m)*60 + float(sec)
        results.append({
            "id": s["id"],
            "path": out_path,
            "duration": total_sec,
            "text": s["text"]
        })
        print(f"[{s['id']}] ({total_sec:.2f}s): {s['text']}")

    # Write a master audio track with gentle spacing
    # Save clips info to a JSON file for the node recorder
    import json
    with open("voice_timing.json", "w") as f:
        json.dump(results, f, indent=2)

    print("Voice clips generated and voice_timing.json saved successfully!")

if __name__ == "__main__":
    asyncio.run(generate())
