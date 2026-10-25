#!/usr/bin/env python3
"""写完 episode.json、渲染之前跑：把 STYLE.md 里能用机器查的规则查一遍。

  python3 scripts/lint_episode.py <期名> [<期名> ...]

查什么（✗ 必须改，! 提醒）：
  ✗ 换镜叠画面    scene 镜头的第一个元素，必须晚于上一镜结束 0.25 秒（上一镜流走要 0.22 秒）
  ✗ 交接几何      orb 写了 exit，下一镜必须是工作台，且 launch.from 与 exit.rect 完全相同
  ✗ 时间出界      元素的出场时间不在本镜头的起止之内
  ✗ 光标          一个 scene 里光标超过一个
  ✗ 大纲          带角色的开场大纲（orb + host）全片超过一次
  ! 大纲重复      回到大纲（orb + current）超过一次：讲解结构类画面用过一次就换
  ! 分屏放开场    放大镜分屏（split）出现在第一章：它用在观点讲解，开场留给角色或大纲
  ! 窗口凭空出现  工作台第一镜没有写 launch（没有从上一镜的东西里长出来）
  ! 关键词太长    大字超过 8 个字
  ! 不是原词      大字或被荧光笔扫的词，在这一镜的字幕里找不到
  ! 一镜太短/太长 scene 短于 1.5 秒；或超过 4 秒却只有一个动作
  ! 镜头不连续    相邻镜头之间有空档或重叠
退出码：有 ✗ 为 1。
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TIMES = ("at", "flipAt", "emphAt", "typeAt", "sendAt", "out", "badAt", "goodAt", "shakeAt", "saveAt", "splitAt", "subAt", "pushAt")
norm = lambda s: re.sub(r"[\s，。：、“”「」！？；,.:!?·\-—/]", "", s).lower()
length = lambda s: sum(0.5 if re.match(r"[A-Za-z0-9]", c) else 1 for c in norm(s))


def lint(name):
    ep = json.loads((ROOT / "public/episodes" / name / "episode.json").read_text())
    shots, caps, out = ep["shots"], ep.get("captions", []), []
    chs = ep.get("chapters", []); opening = chs[1]["at"] if len(chs) > 1 else shots[0]["end"]   # 第一章（开场）结束的时间
    err = lambda sid, msg: out.append(("✗", sid, msg)); warn = lambda sid, msg: out.append(("!", sid, msg))
    said = lambda s: norm("".join(c["text"] for c in caps if c["end"] > s["start"] - 0.5 and c["start"] < s["end"] + 0.5))
    for i, s in enumerate(shots):
        sid, p, prev, nxt = s["id"], s.get("props", {}), shots[i - 1] if i else None, shots[i + 1] if i + 1 < len(shots) else None
        if prev and abs(s["start"] - prev["end"]) > 0.05: warn(sid, f'和上一镜「{prev["id"]}」之间{"有空档" if s["start"] > prev["end"] else "重叠"} {abs(s["start"] - prev["end"]):.2f} 秒')
        if s["template"] == "scene":
            pieces = p.get("pieces", []); acts = []
            for d in pieces:
                for k in TIMES:
                    if k in d:
                        acts.append(d[k])
                        if not (s["start"] - 0.01 <= d[k] <= s["end"] + 0.01): err(sid, f'{d["kind"]} 的 {k}={d[k]} 不在本镜头 {s["start"]}–{s["end"]} 之内')
                for it in d.get("items", []) + d.get("rows", []) + d.get("options", []) + d.get("lens", []):
                    acts += [it[k] for k in TIMES if k in it]
                acts += d.get("pages", [])
                for k in ("mark", "hero"):
                    if isinstance(d.get(k), dict) and "at" in d[k]:
                        acts.append(d[k]["at"])
                        if not (s["start"] <= d[k]["at"] <= s["end"] + 0.01): err(sid, f'{d["kind"]}.{k}.at={d[k]["at"]} 不在本镜头之内')
                if d["kind"] == "split":
                    if s["start"] < opening - 0.01: warn(sid, "放大镜分屏用在了开场：它放在观点讲解段，开场留给角色或大纲")
                    for c in d["cards"] + [d["result"]] + [c["note"] for c in d["cards"] if c.get("note")]:
                        w = c.get("title") or c["text"]
                        if caps and norm(w) not in said(s): warn(sid, f'「{w}」在这一镜的字幕里找不到，关键词应是配音原词')
                    for x in [c["note"]["at"] for c in d["cards"] if c.get("note")] + [d["result"].get("titleAt")]:
                        if x is None: continue
                        acts.append(x)
                        if not (s["start"] <= x <= s["end"] + 0.01): err(sid, f"split 里的时间 {x} 不在本镜头之内")
                if d["kind"] == "text":
                    if length(d["text"]) > 5: warn(sid, f'大字「{d["text"]}」有 {length(d["text"]):g} 个字：默认只留 2–4 个字的核心词，数字和英文按半个字算')
                    word = (d.get("mark") or {}).get("word") or d["text"]
                    if caps and norm(word) not in said(s): warn(sid, f'「{word}」在这一镜的字幕里找不到，关键词应是配音原词')
                    # 大字照抄字幕：大字几乎就是同时那条字幕，同一句话屏幕上出现两遍
                    t = norm(d["text"])
                    for c in caps:
                        if c["start"] <= d["at"] + 0.3 and c["end"] >= d["at"] and t and t in norm(c["text"]) and len(t) >= 0.7 * len(norm(c["text"])):
                            warn(sid, f'大字「{d["text"]}」和同时的字幕「{c["text"]}」几乎一样：只留关键词或换成数字、图形，别把字幕再写一遍'); break
            first = min([d["at"] for d in pieces if "at" in d], default=None)
            if prev and first is not None and first < s["start"] + 0.25: err(sid, f'第一个元素 {first} 出得太早，会和上一镜叠在一起；应不早于 {s["start"] + 0.25:.2f}')
            if sum(d["kind"] == "cursor" for d in pieces) > 1: err(sid, "一个 scene 里有多个光标")
            dur, distinct = s["end"] - s["start"], []
            for a in sorted(acts):
                if not distinct or a - distinct[-1] > 0.5: distinct.append(a)
            if dur < 1.5: warn(sid, f"只有 {dur:.2f} 秒，短于 1.5 秒")
            if dur > 4 and len(distinct) < 2: warn(sid, f"{dur:.1f} 秒却只有一个动作，超过 4 秒要有第二个动作")
        if s["template"] == "orb":
            for n in p.get("nodes", []):
                if "at" in n and not (s["start"] <= n["at"] <= s["end"]): err(sid, f'节点「{n["label"]}」的 at={n["at"]} 不在本镜头之内')
            if p.get("exit"):
                la = (nxt or {}).get("props", {}).get("launch", {}) if nxt and nxt["template"].startswith("app.") else None
                if la is None: err(sid, "写了 exit（收成卡片），但下一镜不是工作台")
                elif la.get("from") != p["exit"]["rect"]: err(sid, f'exit.rect={p["exit"]["rect"]} 和下一镜 launch.from={la.get("from")} 不一致，窗口会从别的位置长出来')
        if s["template"].startswith("app.") and (not prev or not prev["template"].startswith("app.")) and prev and not p.get("launch"):
            warn(sid, "工作台第一镜没有写 launch，窗口会凭空出现")
    hosts = [s["id"] for s in shots if s["template"] == "orb" and s.get("props", {}).get("host")]
    backs = [s["id"] for s in shots if s["template"] == "orb" and s.get("props", {}).get("current")]
    if len(hosts) > 1: err(hosts[1], f"带角色的开场大纲出现了 {len(hosts)} 次")
    if len(backs) > 1: warn(backs[1], f"回到大纲 {len(backs)} 次：讲解结构类画面用过一次就换，章节切换改用工作台的标签栏")
    print(f"\n{name}：{len(shots)} 个镜头")
    for mark, sid, msg in out: print(f"  {mark} [{sid}] {msg}")
    e = sum(m == "✗" for m, _, _ in out); print(f"  必须改 {e} 处，提醒 {len(out) - e} 处" if out else "  没有发现问题")
    return e


if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(__doc__)
    sys.exit(1 if sum(lint(n) for n in sys.argv[1:]) else 0)
