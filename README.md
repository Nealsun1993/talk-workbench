# 口播工作台 talk-workbench

把一条讲解配音，做成「产品演示」式的竖屏讲解视频。

画面里是一个常驻的示意 App 窗口。配音说到哪，光标就点到哪：加一个模块、打开一个开关、把文件拖进来。
相机跟着推近正在讲的地方，换页时上一页的元素直接长成下一页。

![示例联系表](assets/demo-contact.jpg)

完整示例成片：[assets/demo.mp4](assets/demo.mp4)（26 秒，三个页面，两次承接换页）

## 它是什么

- 一个 **AI skill**（`SKILL.md`）：装进 Claude Code、Codex 这类能读 skill 的 agent 之后，说「用口播工作台做这期视频」，它会按流程做。
- 一个 **Remotion 组件库**（`template/`）：不用 AI 也能直接用，一期视频就是一个 `episode.json`。
- 一套**视觉和动效规范**（`references/`）：颜色、字号、光标、相机、承接、验收清单。

适合：AI 工具讲解、工作流介绍、操作步骤、Skill 合集这类「有东西可演示」的口播。
不适合：纯观点、情绪向的内容。

## 它不做什么

- **不生成配音。** 配音是输入，真人录音或任何 TTS 都可以。
- **只有竖屏**（1080×1920，30fps）。横屏不在这一版范围内。
- **不含开场和结尾的角色素材。** 代码里带着 `opener` / `host` / `outro` 模板，要用得自备角色图或头像。

## 三步跑起来

需要 Node.js 18 以上、Python 3、ffmpeg。生成联系表还需要 Pillow；转写所需 Python 依赖已汇总到 `template/requirements.txt`。

```bash
git clone https://github.com/Nealsun1993/talk-workbench.git
cd talk-workbench/template
npm install && npm run setup      # 装依赖、复制字体
python3 -m pip install -r requirements.txt
```

预览示例：

```bash
npm run studio                    # 浏览器里实时预览
bash scripts/contact.sh demo 1.2 8.2 12.8 20.6     # 出联系表到 out/
npx remotion render src/index.tsx Episode out/demo.mp4 --props='{"episode":"demo"}'
```

## 做自己的一期

**1. 准备配音，生成骨架**

```bash
pip install -r requirements.txt  # 含转写、波形和联系表依赖；固定兼容的 PyAV 范围
python3 scripts/from_audio.py 我的配音.wav my-episode
```

得到 `public/episodes/my-episode/episode.json`：字幕、按句切好的镜头、每个字的时间（`_words`）。
转写会有同音错字，先通读一遍字幕，把专有名词改对。

**2. 给每个镜头选页面模板**

| 这一段在讲 | 用 |
|---|---|
| 用到哪几样东西 / 有哪几步 | `app.modules` |
| 一个 GitHub 仓库、官网、文档 | `app.browser` |
| 几项能力、检查项 | `app.toggles` |
| 节奏、时间轴 | `app.timeline` |
| 文字转配音 | `app.tts` |
| 生成结果、样图画廊 | `app.gallery` |
| 角色一致性 | `app.character` |
| 合成、导出 | `app.export` |
| 下期预告 | `app.draft` |

每个模板的画面和字段见 [references/templates.md](references/templates.md)，照着 `public/episodes/demo/episode.json` 改最快。

**3. 填关键词时间**

每个动作的 `at`，填配音里说到那个词的时间，从 `_words` 里查。不要估。

**4. 出联系表检查，再渲染**

按 [references/checklist.md](references/checklist.md) 过一遍。

## 这套画面的几条规矩

| | |
|---|---|
| **示意界面** | 窗口标题栏常驻「示意界面」。它是讲解用的示意 App，不冒充任何真实软件 |
| **真实性标签** | 真实页面标「xxx 实际页面」，原文照抄；样图标「作者示例」。没有实测，不演「测试通过」 |
| **颜色** | 蓝色只表示「当前 / 正在操作的」，橙色只表示问题和行动号召 |
| **光标** | 只做和台词对应的动作，动作之间停住 |
| **相机** | 说到哪推近哪（1.1 到 1.45 倍），讲完拉回 |
| **承接** | 上一页被点的元素直接长成下一页，每期至少一半的换页这么做 |
| **可读性** | 配音念到的字在画面上不小于 32px；截图小字聚光后抬成原文卡片 |

完整规范：[视觉](references/style.md) · [动效](references/motion.md)

## 当 skill 用

把整个仓库放进 agent 的 skill 目录即可，例如：

```bash
git clone https://github.com/Nealsun1993/talk-workbench.git ~/.claude/skills/talk-workbench
```

然后对 agent 说：「用 talk-workbench 把这条配音做成讲解视频」，并给它配音文件和确认过的文案。

## 目录

```
talk-workbench/
├─ SKILL.md              给 agent 读的流程和硬规则
├─ references/           视觉规范、动效规范、模板说明、验收清单
├─ template/             Remotion 工程
│  ├─ src/app/           窗口引擎：标签栏、光标、相机、承接；pages/ 下是 9 个页面模板
│  ├─ src/kit/           设计 token、背景、字幕、图标
│  ├─ scripts/           from_audio.py（骨架）、contact.sh（联系表）、icons.cjs（追加图标）
│  └─ public/episodes/demo/   完整示例
└─ assets/               示例联系表和成片
```

## 常见问题

**转写没转完 / 结尾漏字？**
`--prompt` 里的词如果正好是配音的结尾内容，Whisper 可能提前停。脚本会检查并自动去掉提示词重试。一般不用加 `--prompt`。

**骨架只切出一个镜头？**
转写没输出句号时，脚本按配音里的停顿切（默认 0.45 秒）。配音很连贯的话，用 `--pause 0.3` 调小。

**光标点歪了？**
光标位置是模板根据内容自动算的，不用也不能手写坐标。点歪通常是 `at` 时间填错，或者换页写了不存在的锚点。

**截图里的字太小？**
不要硬放大。给 `app.browser` 写 `focus.text`，那一句会被抬成一张原文卡片。

**想加图标？**
`node scripts/icons.cjs 图标名`，名字到 [phosphoricons.com](https://phosphoricons.com/) 查。

## 授权

本仓库代码和文档以 [MIT](LICENSE) 授权。

依赖各自的许可；内嵌图标的完整许可通知见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)：

- **[Remotion](https://www.remotion.dev/)**：个人和小团队免费，公司使用需要购买授权，详见 [remotion.dev/license](https://www.remotion.dev/license)。
- MiSans（小米字体，免费商用，安装时从 npm 包复制，不随仓库分发）
- JetBrains Mono（OFL）· Phosphor Icons（MIT）· rough.js（MIT）

示例里的 Remotion 官网截图仅用于演示「真实页面聚光」这个功能。示例旁白是作者本人的声音，由 VoxCPM 合成。

## 作者

尼尔.S。抖音搜「尼尔.S」。用这套做了视频，欢迎在简介里提一句。
