#!/usr/bin/env python3
"""动态自查：从渲染好的成片里找「定格」「缓慢漂移」「单次移动过长」「纯滚动过长」。

静帧和联系表看不出「慢」。本脚本读真实成片：每 0.1 秒取一帧，缩小成灰度，
比较相邻两帧的平均变化量。

  定格        画面 3 秒以上基本不变            阻止出正式片
  停留偏长    画面 2–3 秒不变                  只提醒
  缓慢漂移    一直在动，但每一步都很小，超过 1.2 秒   阻止（慢推、慢呼吸都属于这类）
  移动过长    一次推近或移动超过 1.4 秒          阻止（正常 0.6 秒左右到位）
  纯滚动过长  页面平移超过 2 秒                 阻止
  持续运动    连续动 3 秒以上没有停下来          只提醒

底部 26% 默认不参与比较（竖屏字幕在 1455 以下，字幕在换不代表画面在动）。
结果是「待查清单」，不是结论：有意的连续动作（数字滚动、B-roll）用 --allow 写明豁免。

用法：
  python3 scripts/motion_audit.py out/orb4.mp4 --episode orb4
  python3 scripts/motion_audit.py out/x.mp4 --episode x --allow outro --allow s03:12.0-15.5 --json out/x-audit.json
  python3 scripts/motion_audit.py out/clip.mp4 --offset 17.0          # 片段是从整片 17 秒处截的
退出码：有未豁免的阻止项为 1；读不了视频为 2。

检测思路和阈值参考 FredTalk 的 motion_audit.py（MIT，Copyright (c) 2026 FredTalk，
https://github.com/njrhts2kvv-star/FredTalk），按 talk-kit 的竖屏 1080×1920 重写并校准。
"""
import argparse, json, subprocess, sys
from pathlib import Path
import numpy as np

W, H = 108, 192
ROOT = Path(__file__).resolve().parent.parent
BLOCKING = {"hold", "slow", "move", "scroll"}
LABEL = {"hold": "定格", "hold-warn": "停留偏长（提醒）", "slow": "缓慢漂移", "move": "移动过长",
         "scroll": "纯滚动过长", "nonstop": "持续运动不停稳（提醒）"}


def read_frames(path, fps, keep):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vf", f"fps={fps},scale={W}:{H}:flags=area,format=gray", "-f", "rawvideo", "-"],
                         check=True, capture_output=True).stdout
    f = np.frombuffer(raw, np.uint8); n = f.size // (W * H)
    return f[:n * W * H].reshape(n, H, W).astype(np.float32)[:, :int(round(H * keep))]


def runs(mask):
    start = None
    for i, on in enumerate(list(mask) + [False]):
        if on and start is None: start = i
        elif not on and start is not None:
            yield start, i; start = None


def shift_of(a, b):
    """整幅画面的平移量（相位相关），以及平移对齐后的残差"""
    r = np.fft.fft2(a - a.mean()) * np.conj(np.fft.fft2(b - b.mean())); r /= np.abs(r) + 1e-6
    c = np.fft.ifft2(r).real; dy, dx = np.unravel_index(int(c.argmax()), c.shape); h, w = a.shape
    dy = dy - h if dy > h // 2 else dy; dx = dx - w if dx > w // 2 else dx
    s = np.roll(a, (-dy, -dx), axis=(0, 1))
    ys, xs = slice(max(0, -dy) + 2, h - max(0, dy) - 2), slice(max(0, -dx) + 2, w - max(0, dx) - 2)
    if ys.start >= ys.stop or xs.start >= xs.stop: return dy, dx, float(np.abs(a - b).mean())
    return dy, dx, float(np.abs(s[ys, xs] - b[ys, xs]).mean())


def peaks(v):
    """一段运动里有几次独立的加速（一条缓动曲线算 1 次）"""
    if len(v) < 3: return 1
    v = np.convolve(v, np.ones(3) / 3, mode="same"); top = float(v.max())
    pk = [i for i in range(1, len(v) - 1) if v[i] >= v[i - 1] and v[i] >= v[i + 1] and v[i] >= 0.35 * top]
    if not pk: return 1
    n, last = 1, pk[0]
    for p in pk[1:]:
        if float(v[last:p + 1].min()) < 0.6 * min(v[last], v[p]): n += 1; last = p
        elif v[p] > v[last]: last = p
    return n


def analyse(fr, fps, a):
    if len(fr) < 3: return []
    step = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2)); out = []
    add = lambda kind, i, j: out.append({"kind": kind, "start": round(i / fps, 2), "end": round(j / fps, 2), "step": round(float(step[i:j].mean()), 3)})
    still = step < a.step_still
    for i, j in list(runs(~still)):                      # 中间一两帧的轻微抖动不算打断
        if 0 < i and j < len(still) and j - i <= 2 and float(step[i:j].max()) < a.step_slow: still[i:j] = True
    for i, j in runs(still):
        d = (j - i) / fps
        if d >= a.max_hold: add("hold" if d >= a.max_hold_block else "hold-warn", i, j)
    moving = ~still
    for i, j in runs(moving):
        d, seg = (j - i) / fps, step[i:j]
        if d > a.max_slow and float(seg.max()) < a.step_slow: add("slow", i, j); continue
        cuts = [i + k for k, v in enumerate(seg) if v >= a.cut_step]   # 硬切处断开
        pieces, prev = [], i
        for c in cuts: pieces.append((prev, c)); prev = c + 1
        pieces.append((prev, j))
        for x, y in pieces:
            d = (y - x) / fps
            if y - x < 2 or d <= a.max_move: continue
            sh = [shift_of(fr[k], fr[k + 1]) for k in range(x, y)]
            pan = sum(1 for k, (dy, dx, res) in enumerate(sh) if (dy or dx) and res < 0.8 * step[x + k])
            if d > a.max_scroll and pan / (y - x) >= 0.5: add("scroll", x, y)
            elif peaks(step[x:y]) == 1: add("move", x, y)
            elif d > a.max_nonstop: add("nonstop", x, y)
    return sorted(out, key=lambda f: f["start"])


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("video", type=Path)
    p.add_argument("--episode", help="public/episodes/<名字>/episode.json：把时间对应到镜头 id")
    p.add_argument("--offset", type=float, default=0.0, help="片段在整片里的起始秒数")
    p.add_argument("--allow", action="append", default=[], help="豁免：镜头id 或 镜头id:起-止（整片秒数）；不带镜头时写 :起-止")
    p.add_argument("--json", type=Path)
    p.add_argument("--fps", type=float, default=10.0); p.add_argument("--keep", type=float, default=0.74, help="参与比较的画面高度比例（去掉字幕区）")
    p.add_argument("--step-still", type=float, default=0.12); p.add_argument("--step-slow", type=float, default=0.9)
    p.add_argument("--max-hold", type=float, default=2.0); p.add_argument("--max-hold-block", type=float, default=3.0)
    p.add_argument("--max-slow", type=float, default=1.2); p.add_argument("--max-move", type=float, default=1.4)
    p.add_argument("--max-scroll", type=float, default=2.0); p.add_argument("--max-nonstop", type=float, default=3.0)
    p.add_argument("--cut-step", type=float, default=80.0)
    a = p.parse_args()
    try: fr = read_frames(a.video, a.fps, a.keep)
    except subprocess.CalledProcessError as e:
        print("读取失败：", e.stderr.decode(errors="replace")[-300:], file=sys.stderr); return 2
    shots = json.loads((ROOT / "public/episodes" / a.episode / "episode.json").read_text())["shots"] if a.episode else []
    shot_at = lambda t: next((s["id"] for s in shots if s["start"] <= t < s["end"]), "-")
    allow = []
    for v in a.allow:
        name, _, span = v.partition(":"); lo, _, hi = span.partition("-")
        allow.append((name, float(lo) if lo else 0.0, float(hi) if hi else 1e9))
    found, blocking, warn = analyse(fr, a.fps, a), 0, 0
    for f in found:
        f["start"] += a.offset; f["end"] += a.offset; f["start"], f["end"] = round(f["start"], 2), round(f["end"], 2)
        f["shot"] = shot_at((f["start"] + f["end"]) / 2); f["duration"] = round(f["end"] - f["start"], 2)
        # 镜头豁免只覆盖完整落在该镜头内的异常，不能凭区间中点放过邻镜。
        f["allowed"] = any(
            (not n or any(s["id"] == n and s["start"] <= f["start"]
                          and f["end"] <= s["end"] for s in shots))
            and lo <= f["start"] and f["end"] <= hi
            for n, lo, hi in allow
        )
        if not f["allowed"]: blocking += f["kind"] in BLOCKING; warn += f["kind"] not in BLOCKING
        print(f'{f["start"]:7.2f}–{f["end"]:7.2f}s  {f["duration"]:4.1f}s  {f["shot"]:<10} {"已豁免" if f["allowed"] else LABEL[f["kind"]]}  (每步变化 {f["step"]})')
    total = len(fr) / a.fps
    print(f"\n{a.video.name}：{total:.1f} 秒，阻止项 {blocking} 处，提醒 {warn} 处" + ("" if found else "，没有发现问题"))
    if a.json: a.json.write_text(json.dumps({"video": str(a.video), "findings": found, "blocking": blocking, "warnings": warn}, ensure_ascii=False, indent=1))
    return 1 if blocking else 0


if __name__ == "__main__":
    sys.exit(main())
