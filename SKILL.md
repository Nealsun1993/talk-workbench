---
name: talk-workbench
description: 口播工作台：把一条讲解配音做成竖屏（1080×1920）产品演示式讲解视频。画面是一个常驻的示意 App 窗口，光标跟着配音的关键词点击、拖入、打开开关，相机推近正在讲的地方，换页时上一页的元素直接长成下一页。当用户要做「AI 工具讲解 / 工作流介绍 / 操作步骤 / Skill 合集」这类口播视频，或提到「口播工作台」「示意界面讲解」「光标演示动效」时使用。只负责画面；配音是输入，不含 TTS。仅竖屏。
---

# 口播工作台（talk-workbench）

一期视频 = 一个 `episode.json`。不写组件代码：选页面模板、填内容、填关键词时间。
画面引擎在 `template/`（Remotion 工程），规范在 `references/`。

核心做法：**配音驱动画面**。每个动作（点击、开关、聚光、换页）都落在配音念到那个词的时刻；
一个镜头只讲一件事；窗口常驻，页面在窗口里切换。

## 流程

```
① 确认文案和配音 → ② 生成骨架（字幕 + 按句切镜头 + 字级时间）
   → ③ 逐镜选模板、填 props → ④ 联系表自查 → ⑤ 渲染 → ⑥ 响度与手机检查
```

### ① 输入
- 一条完整配音（wav / m4a / mp3），真人录音或任何 TTS 都可以。本 skill 不生成配音。
- 以用户确认的文案和配音为准，不擅自改稿。

### ② 骨架
```bash
cd template
npm install && npm run setup        # 首次：装依赖、复制字体
python3 -m pip install -r requirements.txt # 转写、波形和联系表依赖
python3 scripts/from_audio.py <配音文件> <期名> --prompt "专有名词，用逗号分隔"
```
生成 `public/episodes/<期名>/`：`narration.m4a`、`envelope.json`（真实波形）、`episode.json`。
骨架里每个镜头先是 `"template": "TODO"`；`_words` 列出每个字的时间，用来查关键词时刻。
转写会有同音错字：**通读 captions，改正专有名词**，再往下做。

### ③ 选模板、填内容
页面模板和 props 见 `references/templates.md`。规则：

- 连续的 `app.*` 镜头组成一次会话：窗口打开后常驻，页面在窗口里切换。
- `at` 只填真正的关键词时间，从 `_words` 查，**不手敲近似秒数**。
- 给 `chapters` 加 `tab`（标签栏短名）：标签栏就是本期章节，换章时光标会去点它。
- **换页优先承接**：下一镜写 `"carry": {"anchor": "上一页锚点", "click": true}`，上一页那个元素直接长成新页。
  每期至少一半的换页是承接；找不到合适元素时才用默认的左出右入。
- 会话第一镜写 `"launch": {"from": [x, y, w, h]}`，窗口从画面上这个区域长出来；不写就普通打开。
- 真实页面用 `app.browser`：`focus` 的坐标**从截图上量**（DOM 或像素），不目测；`focus.text` 照抄原文，不改写。
- 顶层写 `"backdrop": {"kind": "grid"}`（骨架已写好）。

### ④ 联系表自查
```bash
bash scripts/contact.sh <期名> 3 12 20 31     # 填每个关键动作的秒数
```
按 `references/checklist.md` 逐项看。只看前一段可在 episode.json 加 `"renderUntil": 秒数`。
**先给用户看联系表或有声样片，确认后再渲整片。**

### ⑤ 渲染
```bash
npx remotion render src/index.tsx Episode out/<期名>.mp4 --props='{"episode":"<期名>"}' --crf=18
```

### ⑥ 交付前
- 响度：最终 AAC 在 −15 到 −14 LUFS，True Peak 不高于 −1 dBTP。量实际 MP4，不只量中间 WAV。
- 手机上看一遍：字幕和右侧、底部有没有被平台按钮和文案挡住。
- 没做的检查如实写「待做」，不写「全部通过」。

## 不可违反

1. **标题栏必须显示「示意界面」**。这个窗口是讲解用的示意 App，不模仿任何真实产品的名字、Logo 或配色。
2. **每个素材带真实性标签**：`GitHub 实际页面` / `官网实际页面` / `作者示例` / `既有成片 · xxx 节选` / `自制示意` 等。
   没有实测，不演「测试通过」。原文卡片里的字照抄原文。
3. **蓝色只表示「当前 / 正在操作的」，橙色只表示问题和行动号召**。一种颜色只表示一件事。
4. **光标只做和台词对应的动作**，动作之间停住，不乱晃。
5. **配音念到的字在画面上不小于 32px**（字号 × 相机倍数）。截图小字不硬放大，聚光后抬成原文卡片。
6. **背景只有点阵和慢速游走的蓝光**。不加贯穿全片的装饰线，不整屏淡出淡入，不加漂浮圆。
7. **不改 `template/src/` 里的组件**。确实需要新页面时，先向用户说明理由，再按现有签名新增并注册。

## 目录路由

| 要做什么 | 看哪里 |
|---|---|
| 颜色、字号、窗口、背景、禁用项 | `references/style.md` |
| 光标、相机、承接、动作曲线、运动模糊 | `references/motion.md` |
| 每个页面模板的画面和 props、锚点 | `references/templates.md` |
| 验收清单 | `references/checklist.md` |
| 一期完整写法 | `template/public/episodes/demo/episode.json` |
| 追加图标 | `node scripts/icons.cjs <phosphor 图标名>` |

## 范围说明

- **仅竖屏 1080×1920、30fps**。横屏不在这一版范围内。
- 代码里还带着开场（`opener` / `host`）和结尾（`outro`）模板，它们需要自备角色图或头像（`figure.src` / `portrait`），本仓库不提供，文档也不展开。
- 基于 [Remotion](https://www.remotion.dev/)。Remotion 对个人和小团队免费，公司使用需要按其许可购买授权，详见 remotion.dev/license。
