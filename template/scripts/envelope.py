#!/usr/bin/env python3
"""从配音生成响度包络（每秒 60 个点，0–1），供时间轴里的真实波形使用。
用法：python3 scripts/envelope.py <音频或视频文件> <输出 json>
说明：只取响度包络，不做任何美化；停顿处自然为 0。"""
import sys, json, subprocess
import numpy as np
src, out = sys.argv[1], sys.argv[2]
SR, RATE = 16000, 60
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
hop = SR // RATE
n = len(x) // hop
rms = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
db = 20 * np.log10(rms)
lo, hi = -48.0, float(np.percentile(db, 97))
v = np.clip((db - lo) / (hi - lo), 0, 1) ** 1.6
# 平滑：快起慢落（attack 20ms / release 120ms）
a_up, a_dn = 1 - np.exp(-1 / (0.02 * RATE)), 1 - np.exp(-1 / (0.12 * RATE))
y = np.zeros_like(v); acc = 0.0
for i, s in enumerate(v):
    acc += (s - acc) * (a_up if s > acc else a_dn); y[i] = acc
json.dump({'rate': RATE, 'duration': len(x) / SR, 'values': [round(float(t), 3) for t in y]}, open(out, 'w'))
print(f'{out}: {len(y)} points, {len(x)/SR:.2f}s, ref {hi:.1f} dBFS')
