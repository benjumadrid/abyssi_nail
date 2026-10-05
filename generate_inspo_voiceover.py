import asyncio
import edge_tts
import json
import os
import subprocess

VOICE = "en-US-JennyNeural"

SCENES = [
    {
        "id": "scene1_intro",
        "title": "WELCOME",
        "text": "Welcome to Beauty Abyssi! Here is how you can easily book your dream nail appointment online.",
        "speech_text": "Welcome to Beauty Abyssee! Here is how you can easily book your dream nail appointment online.",
        "filename": "voice_inspo_s1.mp3"
    },
    {
        "id": "scene2_catalog",
        "title": "SALON CATALOG",
        "text": "You can browse all our services for hands and feet, and book any catalog treatment with just one click.",
        "speech_text": "You can browse all our services for hands and feet, and book any catalog treatment with just one click.",
        "filename": "voice_inspo_s2.mp3"
    },
    {
        "id": "scene3_inspo_click",
        "title": "PINTEREST & TIKTOK INSPO",
        "text": "Or, if you found a design on Pinterest or TikTok, scroll to Bring Any Dream Inspo and tap Register with Inspo Image.",
        "speech_text": "Or, if you found a design on Pinterest or TikTok, scroll to Bring Any Dream Inspo and tap Register with Inspo Image.",
        "filename": "voice_inspo_s3.mp3"
    },
    {
        "id": "scene4_modal_group",
        "title": "CUSTOM & GROUP DISCOUNT",
        "text": "Your bespoke session is preselected. Coming with friends or bridal guests? Toggle Group Discount for special party rates!",
        "speech_text": "Your bespoke session is preselected. Coming with friends or bridal guests? Toggle Group Discount for special party rates!",
        "filename": "voice_inspo_s4.mp3"
    },
    {
        "id": "scene5_upload_date",
        "title": "ATTACH PHOTOS & PICK DATE",
        "text": "Attach your inspiration screenshots so our artist prepares your exact charms and colors, then pick your date and time.",
        "speech_text": "Attach your inspiration screenshots so our artist prepares your exact charms and colors, then pick your date and time.",
        "filename": "voice_inspo_s5.mp3"
    },
    {
        "id": "scene6_address",
        "title": "CLIENT DETAILS & ADDRESS",
        "text": "Enter your name, phone number, and location including your village, like Kombolcha, Shisha Bar.",
        "speech_text": "Enter your name, phone number, and location including your village, like Kombolcha, Shisha Bar.",
        "filename": "voice_inspo_s6.mp3"
    },
    {
        "id": "scene7_submit",
        "title": "SUBMIT REGISTRATION",
        "text": "Add your shape or chrome notes, and tap Confirm and Register Online to submit your booking instantly.",
        "speech_text": "Add your shape or chrome notes, and tap Confirm and Register Online to submit your booking instantly.",
        "filename": "voice_inspo_s7.mp3"
    },
    {
        "id": "scene8_confirm",
        "title": "SUCCESSFUL RESERVATION",
        "text": "You're all set! Your request is dispatched directly to our artist, and you can connect on Telegram. See you soon!",
        "speech_text": "You're all set! Your request is dispatched directly to our artist, and you can connect on Telegram. See you soon!",
        "filename": "voice_inspo_s8.mp3"
    }
]

FFMPEG_PATH = r"C:\Users\acer\AppData\Local\Programs\Python\Python314\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"

async def generate():
    os.makedirs("voice_clips", exist_ok=True)
    timing_data = []

    for item in SCENES:
        out_path = os.path.join("voice_clips", item["filename"])
        spoken = item.get("speech_text", item["text"])
        communicate = edge_tts.Communicate(spoken, VOICE, rate="+3%", pitch="+1Hz")
        await communicate.save(out_path)

        # Parse duration from ffmpeg -i stderr
        proc = subprocess.run([FFMPEG_PATH, "-i", out_path], capture_output=True, text=True)
        dur_str = "0:0:0"
        for line in proc.stderr.splitlines():
            if "Duration:" in line:
                dur_str = line.split("Duration:")[1].split(",")[0].strip()
                break

        h, m, s = dur_str.split(":")
        total_sec = float(h)*3600 + float(m)*60 + float(s)

        timing_data.append({
            "id": item["id"],
            "title": item["title"],
            "text": item["text"],
            "filename": item["filename"],
            "path": out_path,
            "duration": round(total_sec, 3)
        })
        print(f"[{item['id']}] ({total_sec:.2f}s): {spoken}")

    with open("inspo_voice_timing.json", "w", encoding="utf-8") as f:
        json.dump(timing_data, f, indent=2)

    print("Timing metadata written to inspo_voice_timing.json")

    concat_list_file = "inspo_concat.txt"
    with open(concat_list_file, "w", encoding="utf-8") as f:
        for item in timing_data:
            f.write(f"file '{os.path.abspath(item['path']).replace(chr(92), '/')}'\n")

    master_audio = "master_inspo_voiceover.mp3"
    subprocess.run([
        FFMPEG_PATH, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_file,
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        master_audio
    ], check=True)

    print(f"Master voiceover compiled to {master_audio}!")

if __name__ == "__main__":
    asyncio.run(generate())
