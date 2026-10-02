#!/usr/bin/env python3
"""从一条配音生成一期骨架（不依赖其他视频工具）。

用法：
  python3 scripts/from_audio.py <配音 wav/m4a/mp3/mp4> <期名> [--title 标题] [--prompt "专有名词，用逗号分隔"]

会生成 public/episodes/<期名>/：
  narration.m4a   配音
  envelope.json   响度包络（时间轴 / 配音页里的真实波形用）
  episode.json    字幕、按句切好的镜头（template 先写 "TODO"）、每个字的时间（_words）

接下来：给每个镜头选模板、填 props；`at` 从 _words 里查关键词的时间。

转写后端按顺序尝试：faster-whisper → mlx-whisper（Apple 芯片）→ openai-whisper，装了哪个用哪个。
--prompt 只在专有名词总被听错时再加：提示词里的词如果正好是配音的结尾内容，转写可能提前停（脚本会检查并自动重试）。
转写会有同音错字，生成后请通读一遍 captions 并改正专有名词。
"""
import argparse, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("audio"); ap.add_argument("episode")
ap.add_argument("--title", default=None); ap.add_argument("--prompt", default="")
ap.add_argument("--lang", default="zh"); ap.add_argument("--max-chars", type=int, default=18)
ap.add_argument("--pause", type=float, default=0.45, help="转写没有句号时，按多长的停顿切镜头（秒）")
a = ap.parse_args()

out = ROOT / "public/episodes" / a.episode
out.mkdir(parents=True, exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.audio, "-vn", "-c:a", "aac", "-b:a", "192k", str(out / "narration.m4a")], check=True)
subprocess.run([sys.executable, str(ROOT / "scripts/envelope.py"), a.audio, str(out / "envelope.json")], check=True)
wav = out / "_asr.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.audio, "-vn", "-ac", "1", "-ar", "16000", str(wav)], check=True)
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.audio]))


def transcribe(prompt):
    """返回 [(字或词, start, end), ...]"""
    try:
        from faster_whisper import WhisperModel
        segs, _ = WhisperModel("small").transcribe(str(wav), language=a.lang, word_timestamps=True, initial_prompt=prompt or None)
        return [(w.word.strip(), w.start, w.end) for s in segs for w in s.words if w.word.strip()]
    except ImportError:
        pass
    try:
        import mlx_whisper
        r = mlx_whisper.transcribe(str(wav), path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language=a.lang,
                                   word_timestamps=True, initial_prompt=prompt or None)
        return [(w["word"].strip(), w["start"], w["end"]) for s in r["segments"] for w in s["words"] if w["word"].strip()]
    except ImportError:
        pass
    try:
        import whisper
        r = whisper.load_model("small").transcribe(str(wav), language=a.lang, word_timestamps=True, initial_prompt=prompt or None)
        return [(w["word"].strip(), w["start"], w["end"]) for s in r["segments"] for w in s["words"] if w["word"].strip()]
    except ImportError:
        sys.exit("没有找到转写后端：pip install faster-whisper（或 mlx-whisper / openai-whisper）")


words = transcribe(a.prompt)
# 覆盖率检查：提示词里的词如果正好出现在配音结尾，转写可能提前停。漏掉超过 2 秒就去掉提示词重来。
if a.prompt and words and dur - words[-1][2] > 2.0:
    print(f"! 转写在 {words[-1][2]:.1f}s 就停了（配音 {dur:.1f}s），去掉 --prompt 重新转写")
    words = transcribe("")
if words and dur - words[-1][2] > 2.0:
    print(f"! 注意：转写只到 {words[-1][2]:.1f}s，配音有 {dur:.1f}s，结尾可能漏字，请手动补 captions")


def pauses(min_len):
    """配音里的真实停顿 [(start, end), ...]"""
    o = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", a.audio, "-af", f"silencedetect=n=-35dB:d={min_len}", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", o)]
    en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", o)]
    return list(zip(st, en))


wav.unlink(missing_ok=True)
END, PUN = r"[。？！?!]$", r"[，。？！、,.?!：:；;]"

# 按句切镜头：有句号用句号；转写没给句号时，按配音里的停顿切（--pause 秒，默认 0.45）
sents, cur = [], []
if any(re.search(END, w[0]) for w in words[:-1]):
    for w in words:
        cur.append(w)
        if re.search(END, w[0]): sents.append(cur); cur = []
    if cur: sents.append(cur)
else:
    cuts = sorted((s + e) / 2 for s, e in pauses(a.pause) if 0.2 < s and e < dur - 0.2)
    k = 0
    for w in words:
        mid = (w[1] + w[2]) / 2
        while k < len(cuts) and mid > cuts[k]:
            if cur: sents.append(cur); cur = []
            k += 1
        cur.append(w)
    if cur: sents.append(cur)
    # 太短的句子（不到 1.5 秒）并到前一句
    merged = []
    for s_ in sents:
        if merged and s_[-1][2] - s_[0][1] < 1.5: merged[-1] += s_
        else: merged.append(s_)
    sents = merged

# 字幕：按标点断行，超长再对半
caps = []
def plain(ws): return re.sub(PUN, "", "".join(x[0] for x in ws))
def emit(ws):
    if not ws: return
    if len(plain(ws)) <= a.max_chars or len(ws) < 2:
        caps.append({"text": re.sub(PUN + "+$", "", "".join(x[0] for x in ws)), "start": round(ws[0][1], 3), "end": round(ws[-1][2], 3)}); return
    # 超长：优先在中段最大的停顿处拆，没有明显停顿才对半
    lo, hi = max(1, len(ws) // 4), max(2, len(ws) * 3 // 4)
    k = max(range(lo, hi + 1), key=lambda i: ws[i][1] - ws[i - 1][2]) if hi < len(ws) else len(ws) // 2
    emit(ws[:k]); emit(ws[k:])
for s in sents:
    clause = []
    for w in s:
        clause.append(w)
        if re.search(PUN + "$", w[0]): emit(clause); clause = []
    emit(clause)

shots = []
for i, s in enumerate(sents):
    end = sents[i + 1][0][1] if i + 1 < len(sents) else dur
    shots.append({"id": f"s{i + 1:02d}", "template": "TODO", "start": round(s[0][1] if i else 0.0, 3), "end": round(end, 3),
                  "props": {"_口播": "".join(x[0] for x in s)}})

ep = {"id": a.episode, "title": a.title or a.episode, "duration": round(dur, 3),
      "audio": "narration.m4a", "envelope": "envelope.json",
      "voiceStart": round(words[0][1], 3) if words else 0,
      "app": {"title": "口播工作台"}, "backdrop": {"kind": "grid"},
      "chapters": [{"at": 0, "label": "开场", "tab": "总览"}],
      "captions": caps, "shots": shots,
      "_words": [[w, round(s, 2)] for w, s, _ in words]}
(out / "episode.json").write_text(json.dumps(ep, ensure_ascii=False, indent=1))
print(f"✓ {out}/episode.json：{len(shots)} 个镜头待选模板，{len(caps)} 条字幕；关键词时间见 _words")
