#!/usr/bin/env python3
"""接缝检查图：把每个换镜点前后的连续帧排成一行，看交接顺不顺。

  python3 scripts/seam_sheet.py <成片.mp4> <期名> [--offset 片段起始秒]   → out/<期名>-seams.jpg

每行 7 帧：切点前 0.3、0.1 秒，切点后 0.03、0.1、0.2、0.3、0.5 秒。
重点看切点后 0.1–0.3 秒：有没有两镜叠在一起、发灰溶解、残影、窗口空着。
只比首尾两张静帧查不出这些。
"""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OFFS = (-0.3, -0.1, 0.033, 0.1, 0.2, 0.3, 0.5)
video, name = Path(sys.argv[1]), sys.argv[2]
offset = float(sys.argv[sys.argv.index("--offset") + 1]) if "--offset" in sys.argv else 0.0
shots = json.loads((ROOT / "public/episodes" / name / "episode.json").read_text())["shots"]
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)]))
seams = [(a, b) for a, b in zip(shots, shots[1:]) if 0.35 < b["start"] - offset < dur - 0.55]
if not seams: sys.exit("这段成片里没有换镜点")
TW, TH, LAB = 216, 384, 150
font = None
for candidate in list((ROOT / "public/fonts").rglob("*.ttf")) + list((ROOT / "public/fonts").rglob("*.otf")):
    try:
        font = ImageFont.truetype(str(candidate), 20)
        break
    except OSError:
        continue
if font is None:
    sys.exit("未找到可用字体；请先在 template 中运行 npm run setup，再生成接缝图。")

sheet = Image.new("RGB", (LAB + TW * len(OFFS), (TH + 28) * len(seams)), "white"); d = ImageDraw.Draw(sheet)
for r, (a, b) in enumerate(seams):
    y = r * (TH + 28); t0 = b["start"]
    d.text((6, y + 40), f'{a["id"]}\n→ {b["id"]}\n{t0:.2f}s', font=font, fill=(16, 36, 58))
    for c, o in enumerate(OFFS):
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t0 - offset + o:.3f}", "-i", str(video), "-frames:v", "1", "-vf", f"scale={TW}:{TH}", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
        if raw:
            from io import BytesIO
            sheet.paste(Image.open(BytesIO(raw)).convert("RGB"), (LAB + c * TW, y + 24))
        d.text((LAB + c * TW + 6, y + 2), f"{o:+.2f}s", font=font, fill=(200, 60, 40) if 0 < o <= 0.3 else (86, 103, 124))
out = ROOT / "out" / f"{name}-seams.jpg"
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out, quality=88)
print(out, f"（{len(seams)} 个接缝）")
