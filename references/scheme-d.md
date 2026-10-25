# 方案 D：场景 + 工作台

当前默认，来源为作者 2026-10-13 确认的画面规范；v1.2 补上 2026-10-21 至 10-23 实际出片后确认的规则（大字只留核心词、整屏色块章节卡、新增场景组件）。

## 整期结构

开场角色或大纲 `orb` → 开头观点 `scene` → 操作 `app.*` → 结论 `scene` → `outro`。
完整大纲只展开一次，回大纲最多一次；章节切换用工作台标签栏，或用整屏色块章节卡（`scene` 里的 `flood`，见下）。工作台连续约 40–60 秒后切回有内容的场景。纯观点、合集可混用卡片，不强行做成软件界面。

每段先写清“谁出现、怎么变、变完留下什么、交给下一段什么”。配置前列交接表，尽量共用上一镜末态和下一镜首态的坐标。当前场景间默认是旧镜流出、新镜进入，并没有自动实现对象承接。

每 2–3 秒应有可见的信息变化；3 秒以上无变化应修正或保留理由明确的例外。禁止靠镜头慢推或慢呼吸填时间。录屏推近正在讲的位置，纯滚动不超过约 2 秒，点击、输入、复制需要可读地表现。

## orb

```json
{"id":"outline","template":"orb","start":0,"end":4,"props":{
  "title":"本期三步","nodes":[
    {"label":"准备配音","at":0.3},
    {"label":"安排画面","at":1.5},
    {"label":"检查成片","at":2.7}
  ]}}
```

示例时间仅用于展示字段；制作时必须替换成实际词时间。`nodes` 为 2–5 项。

- 无角色时省略 `host`，直接竖排大纲。
- 有角色时写 `host: {iconAt, clickAt, figure: {src, size: [宽,高]}}`；`figure` 由用户提供。
- 回大纲写 `current: {index, at}`。
- 收成卡片写 `exit: {at, rect: [x,y,w,h]}`；下一镜为 `app.*`，`launch.from` 必须等于该 `rect`。
- 黑色实心球依次冒出，不炸成网格，不画球之间的连线，不加“点开看大纲”提示字。

## scene

`props.pieces` 是组成场景的元素；`at` 均为整期秒数，坐标基于 1080×1920，`y` 为中心线。每镜最多 3 张碎片加 1 个关键词。场景中蓝色只作荧光笔，黑色表示选中，橙色表示问题或行动号召。

**大字（`text`）的规矩（v1.2）：同一句话不在屏幕上出现两遍。**

- 字幕已经整句念出来了，大字默认只留 2–4 个字的核心词（字幕「投之前先筛掉」，大字只打「筛掉」）；能换成数字或图形就换（「不花 token」→「0 token」）。
- 画面已经在讲的镜头（终端在出结果、截图在推近、开关在拨）不出大字，只靠字幕。
- 删掉大字以后重新看画面重心：主体挪到画面中部，或用数字、图形补上，别留一大块空。
- 包装要克制：一段口播挑最值得看见的时刻，大约每 4 秒最多一个包装元素。

| kind | 常用字段 | 动作 |
| --- | --- | --- |
| text | text, at, y, size, mark:{word,at,tone}, out | 逐字出现、荧光笔 |
| toggles | at, y, items:[{label,type,on,flipAt,emphAt}] | 开关、反黑强调 |
| stack | at, y, n, hero:{logo,name,at} | 骨架卡与主角卡 |
| image | src,size,at,y,w,label,mark:{x,y,w,h,at} | 真实截图与来源 |
| count | at,y,to,dur,unit,sub | 有来源的数字 |
| input | at,y,text,typeAt,sendAt,placeholder,button | 评论框与行动引导 |
| cursor | from,in,keys:[{at,x,y,click}] | 一镜最多一个光标 |
| flood | at,out,title,kicker,no,color,size | 整屏色块章节卡：色块铺满、巨字砸入、描边大序号，约 1.5 秒后退走（v1.2） |
| terminal | at,y,w,fs,title,label,out,lines:[{text,at,tone,hlAt,progress}],x | 照真实日志一行行重绘；写 `x` 时嵌进画面里的屏幕（v1.2） |
| slides | y,w,h,items:[{src,size,at,video}],label,punch:[{at,x,y,s}] | 截图 / 录屏轮播，按词推镜到某一块再拉回 |
| chips | y,items:[{text,at,tone,icon}] | 一行标签 |
| verdict | y,at,rows:[{ok,text,at}],thumb | 适合 / 别选，逐行亮起 |
| poll | y,options:[{key,text,at}] | 选择题，给观众站队 |
| split | y,at,cards,lens,splitAt,result,pushAt | 放大镜分屏：两种常见做法都不对、答案在中间；只用在观点段，不放开场 |
| prompt | y,at,text,typeAt,sendAt,attach | 对 Agent 说的一句话：逐字打出、点发送 |
| flow | y,at,steps:[{icon,label,at}],final | 几步图标依次点亮 |
| film | at,src,len,hold,screen,labels:[{text,x,y,w,h,rot,at,hlAt}] | 整屏动画素材（如 Omni 角色表演）+ 屏幕里放视频、空白牌面上叠字；素材播完停在末帧 |
| bill | y,at,label,rows,total | 账单卡，合计数字滚动 |
| file | y,at,badge,icon,pages,label,out | 文件卡，可翻出几页、可退场 |
| wall / decks / chooser / kit | 见源码注释 | 组件墙、发牌、选择图、资料包插画 |

`text.cps` 是每字间隔秒数（默认约 0.09），并非每秒字数。`count`、`file` 也支持 `out` 退场。场景光标是显式坐标，需核对落点；工作台光标由模板计算。附加 `cover` 与 `article` 示意件的字段见 `template/src/templates/Scene.tsx` 顶部注释。

当前退出动画约 0.22 秒：非首镜的 scene 第一个元素至少在镜头开始后 0.25 秒出现，避免叠画面。若真实词落点更早，应调整镜头边界或分镜，不把关键词随意延后。

## 节奏与镜头（v1.2）

- 段落交界至少换两样：景别、速度、底色、密度、镜头动作。整期都是浅底加一行行换大字，就是"无聊"的典型形状。
- 动镜头前问三句：观众这一刻该看哪、现在看得清吗；这一下是过渡还是重音；上一个镜头动作是什么。
- 过渡用缓推、横移、拉远（0.6–1.5 秒）；快推、砸入只给揭晓、反转、关键数字；推进去之后要拉出来或横移开，不连着三镜往里推。像 PPT 的根子是"每镜同一个动作"。
- 入场慢、退场快，落定后要停（数字落定至少停 0.5 秒）。

这几条借鉴了 huashu-motion / huashu-art-motion 的公开方法文档，出处见 THIRD_PARTY_NOTICES。

## 三道检查及边界

在 `template/` 执行：

1. `python3 scripts/lint_episode.py <期名>`：配置中的叠画面、几何交接、部分时间字段、光标、大纲和关键词；v1.2 起还提醒「大字和同时的字幕几乎一样」「大字超过 5 个字」「放大镜分屏放在了开场」。数字写法（「1 分钟」对配音「一分钟」）和工具名做标题会触发提醒，属于有意保留时写清理由即可。
2. `python3 scripts/motion_audit.py out/<期名>.mp4 --episode <期名>`：实际成片的定格、慢漂移、过长移动/滚动。默认排除底部字幕区；不会识别画面语义，必须看视频核实。
3. `python3 scripts/seam_sheet.py out/<期名>.mp4 <期名>`：每个接缝附近 7 个抽样帧（前 0.3/0.1 秒，后 0.033/0.1/0.2/0.3/0.5 秒），重点看切后 0.1–0.3 秒。它输出图片，不自动宣告通过。

检查未覆盖全部字段或叙事质量，机器通过后仍需人工看连续动作。静帧、字幕变化与背景蓝光不能代替内容变化。确有意图的长动作可用 `--allow 镜头id:起-止`，随项目记录理由；不批量豁免不明问题。

## 实现边界

当前自动运动模糊只覆盖工作台的承接、换页和相机运动。orb / scene 转场还需单独检查，要求运动模糊时补充实现或使用预渲染素材。动态自查不检测模糊是否存在。跨镜头的异常不能用单个镜头 ID 整段豁免，必须先核查全部区间。
