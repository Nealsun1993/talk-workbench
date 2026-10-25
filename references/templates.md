> v1.1 默认方案 D。新增 `orb`、`scene` 的字段和整期编排见 [scheme-d.md](scheme-d.md)；下表仍为兼容的工作台模板。

# 页面模板

连续的 `app.*` 镜头组成一次会话：窗口打开后常驻，页面在窗口里切换。
每个镜头的写法：

```json
{"id": "steps", "template": "app.modules", "start": 3.5, "end": 16.5, "props": { … }}
```

所有 `at` 都是配音里关键词的时间（秒），从骨架的 `_words` 查。
素材路径：以 `/` 开头指 `public/` 根目录（如 `/logos/x.svg`），否则相对本期目录。
图标名是 [Phosphor](https://phosphoricons.com/) 的 regular 图标；库里没有的，用 `node scripts/icons.cjs <名字>` 追加。

## 怎么选

| 这一段在讲 | 用 |
|---|---|
| 这期用到哪几样东西 / 有哪几步 | `app.modules` |
| 一个 GitHub 仓库、官网、文档 | `app.browser` |
| 几项能力、几条检查项、注意事项 | `app.toggles` |
| 节奏、时间轴、「按说话时间对齐」 | `app.timeline` |
| 文字转配音 | `app.tts` |
| 生成结果、样图、分类画廊 | `app.gallery` |
| 角色一致性 | `app.character` |
| 合成、导出、交付 | `app.export` |
| 下期预告、待办 | `app.draft` |

## app.modules · 模块清单

说到一个工具，光标点「+ 添加」，这一行滑进列表；说到统筹者，光标点「连接」，各行状态依次变成「已连接」。

```json
{"title": "口播工作流", "sub": "三个模块",
 "items": [{"name": "文案", "role": "先确认再做", "icon": "file-text", "at": 4.2}],
 "orchestrator": {"name": "统筹者", "role": "把三步连起来", "icon": "terminal-window", "at": 9.8}}
```

| 字段 | 说明 |
|---|---|
| `items[].logo` / `icon` | 真实 Logo 图片，或 Phosphor 图标名（二选一） |
| `items[].bg` / `tint` | 图标底色 / 图标颜色，默认蓝底白图标 |
| `orchestrator` | 可选。`at` 之后 0.5 秒点「连接」 |
| `dense: true` | 行更矮，最多 6 行，适合合集总览 |
| `label` | 列表上方的小标题，默认「模块」 |
| `zoom: false` | 不做相机推近（总览页反复回来时用） |
| `prefill: true` | 各行一开始就在；点名时这一行变成「当前」、光标移过去，不再点「添加」 |

锚点：`item:0`、`item:1` …（整行）、`orchestrator`（编排行）、`logo:0` …（行首图标）。

## app.browser · 真实页面 + 聚光 + 原文卡片

内置浏览器里放真实截图；说到关键句时压暗其余部分、框出这一句，然后这个框抬起来变成一张原文卡片，相机跟过去。

```json
{"name": "Remotion", "source": "remotion.dev · 官网实际页面", "url": "https://www.remotion.dev/",
 "image": "remotion.png", "size": [848, 620],
 "focus": {"x": 228, "y": 279, "w": 390, "h": 27, "at": 14.6,
           "text": "Create videos and motion graphics with React.", "label": "官网原文"},
 "tags": [{"text": "基于 React", "at": 17.2}]}
```

| 字段 | 说明 |
|---|---|
| `image` / `size` | 截图和它的像素尺寸。**宽 848 时 1:1 显示最清晰** |
| `focus.x/y/w/h` | 截图像素坐标。**从截图上量，不目测** |
| `focus.text` | 这句话的原文，**照抄，不改写** |
| `focus.label` | 来源，如「README 原文」「官网原文」 |
| `tags` | 可选，下方依次列出要点 |

锚点：`pane`（整个浏览器面板）、`quote`（原文卡片，写了 `focus.text` 才有）。

## app.toggles · 能力开关 / 检查项

说到哪一项，光标就打开哪个开关（或勾选）；最后弹出通知，可以连续几条。

```json
{"title": "这套画面做了什么", "sub": "说到哪项，打开哪项", "control": "toggle",
 "items": [{"name": "光标点击", "icon": "cursor-click", "at": 21.0, "desc": "落在按钮上"}],
 "toasts": [{"text": "四项都已打开", "at": 27.5}]}
```

| 字段 | 说明 |
|---|---|
| `control` | `toggle`（能力）或 `check`（检查项），默认 `toggle` |
| `toast` / `toasts` | 一条或多条通知，后一条替换前一条 |
| `toasts[].icon` | 提醒类用 `"info"`，不要用对勾冒充「完成」 |

锚点：`list`（整个列表）、`toast`（最后一条通知）。

## app.timeline · 按说话时间对齐

光标把文案、配音拖进来，出现时间轴（真实波形；字幕块、镜头块先按估算均匀排开），点「按说话时间对齐」，各块吸附到真实位置。

```json
{"title": "节奏", "sub": "画面跟着声音走",
 "drops": [{"label": "文案.md", "icon": "file-text", "at": 30.1}, {"label": "配音.wav", "icon": "waveform", "at": 31.4}],
 "range": [0, 20], "label": "本片 0–20 秒", "show": 32.5,
 "align": {"text": "按说话时间对齐", "at": 34.0},
 "lanes": [{"track": "字幕", "at": 35.2}, {"track": "画面", "at": 36.4}]}
```

`range` 是本片真实数据的时间段，波形、字幕、镜头都取自这一期自己的 `envelope.json` 和 `captions`。

锚点：`panel`（时间轴面板）、`drop`（拖入区）。

## app.tts · 文字转配音

确认好的文案，点「生成配音」，真实波形一格格长出来；可切换音色。

```json
{"title": "配音", "sub": "文案确认后再生成",
 "script": {"label": "确认稿", "text": "这是口播工作台的演示。"},
 "range": [0, 2.1], "button": {"text": "生成配音", "at": 40.2},
 "voice": {"label": "音色", "from": "默认", "to": "我的声音", "at": 43.0},
 "local": {"text": "本地运行", "at": 41.5}, "result": "真实波形 · 本片 0–2 秒"}
```

`range` 是这句话在本片配音里的时间，用来画真实波形。`result` 写明这是真实波形。

锚点：`script`、`wave`。

## app.gallery · 生成结果 / 样例画廊

两种用法：

- **生成**：提示栏 + 「生成」按钮，结果卡出现。写 `prompt` 和 `button`。
- **画廊**：分类标签 + 2 到 3 张样例；说到哪类，光标点哪个标签，那张被选中、相机推近。写 `chips` 和 `select`。

```json
{"title": "三种风格", "sub": "同一张照片",
 "chips": ["夜景", "海报", "水墨"],
 "items": [{"kind": "image", "src": "a.jpg", "tag": "作者示例"}],
 "select": [{"index": 0, "at": 50.3}]}
```

`items[].kind`：`image` / `video`（配 `poster`）/ `flow`（配 `steps`）。**每张都必须带真实性标签 `tag`。**

横版样例用 `"layout": "hero"`：一张 16:9 大图加下方缩略图，说到哪张，光标点哪张缩略图，它从缩略图的位置长成大图。
hero 版式的 `kind` 还支持 `spread`（几张竖图并排，写 `srcs`）、`board`（白板手绘，自制示意）、`text`（一段文字）；
`zoom: [{at, rect: [x, y, w, h], scale?, until?}]` 可以推近大图的某一块（0 到 1 的相对坐标）。

锚点：`item:0` …；hero 版式是 `hero`。

## app.character · 固定角色

角色参考图钉在左边；说到规则时逐条勾选；说到不同场景时，场景图出现并标注同一角色。

```json
{"title": "角色一致", "sub": "先定参考，再出场景",
 "reference": {"src": "ref.png", "tag": "角色参考"},
 "rules": [{"name": "同一发型", "icon": "check", "at": 60.1}],
 "scenes": [{"src": "s1.png", "tag": "作者示例", "at": 63.0}],
 "badge": {"text": "同一角色", "at": 66.0}}
```

锚点：`reference`。

## app.export · 合成导出

光标点主按钮，按钮变成进度（示意），预览里播放真实成片片段，右侧逐项勾选，最后通知「完成」。

```json
{"title": "合成", "sub": "一条命令出片",
 "button": {"text": "合成成片", "at": 70.2},
 "preview": {"src": "clip.mp4", "tag": "既有成片 · 本期节选"},
 "checks": [{"icon": "subtitles", "label": "字幕"}],
 "done": {"text": "已导出", "at": 76.0}}
```

进度条属于示意；`preview` 必须是真实成片片段并标注来源。

锚点：`button`、`preview`。

## app.draft · 下期预告 / 待办

光标点「新建」，一张草稿卡出现，分类标签依次加上。只展示计划，不编造数据。

```json
{"title": "下一期", "sub": "先记下来",
 "button": {"text": "新建", "at": 80.1},
 "card": {"title": "横屏版", "status": "计划中", "chips": [{"text": "1920×1080", "at": 82.0}]}}
```

锚点：`button`。

## 镜头通用字段

| 字段 | 写在哪 | 说明 |
|---|---|---|
| `carry` | props | `{"anchor": "上一页锚点", "click": true}`，承接换页 |
| `launch` | 会话第一镜的 props | `{"from": [x, y, w, h], "r": 22, "bg": "#CFE2F6"}`，窗口从这个区域长出来 |

## episode.json 顶层

| 字段 | 说明 |
|---|---|
| `id` / `title` / `duration` | 期名、标题、总时长（秒） |
| `audio` / `envelope` | 配音和响度包络，相对本期目录 |
| `voiceStart` | 第一个字的时间 |
| `app.title` | 窗口标题栏上的名字，默认「口播工作台」 |
| `backdrop` | `{"kind": "grid"}` 点阵加游走蓝光（默认用这个） |
| `chapters` | `[{"at", "label", "tab"}]`，带 `tab` 的会出现在标签栏 |
| `captions` | `[{"text", "start", "end"}]` 字幕 |
| `shots` | 镜头列表 |
| `renderUntil` | 可选，只渲染到这一秒（出样片用） |
| `motionBlur` | 可选，`false` 关闭运动模糊 |
| `canvas` | 可选，整期固定底色（如黑底片头 `"#000000"`），不写按浅色 / 深色镜头自动切（v1.2） |

镜头的 `header` 另支持 `size`：长标题（英文项目名）缩小字号、不折行（v1.2）。

## 画廊新增字段

`app.gallery` 支持 `prompt.type: {text, at, cps}`，将文字随时间输入提示栏；`cps` 为每字间隔秒数。流程图 item 支持 `stepAt: [整期秒数…]`，逐步点亮 `steps`；数量应一致。省略这些字段时保留原行为。
