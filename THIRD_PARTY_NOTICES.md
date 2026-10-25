# Third-party notices

## Phosphor Icons

The icon paths embedded in `template/src/kit/icons.ts` are from Phosphor Icons.

MIT License

Copyright (c) 2023 Phosphor Icons

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## FredTalk

`template/scripts/motion_audit.py` 的检测思路和默认阈值参考了 FredTalk 的 `motion_audit.py`，按竖屏 1080×1920 画面重写。
`references/workflow.md` 与 `references/scheme-d.md` 中整期编排的若干规则（段间交接、动态自查）也来自对 FredTalk 公开文档的学习。

- 仓库：https://github.com/njrhts2kvv-star/FredTalk
- 许可：MIT License，Copyright (c) 2026 FredTalk

没有使用 FredTalk 的组件源码、字体、音效或任何媒体素材。

## huashu-motion / huashu-art-motion

`references/scheme-d.md`「节奏与镜头」一节和大字、包装的若干规则，参考了这两个仓库公开方法文档里的思路（节奏单、段落交界的对比、动镜头前三问、口播包装克制），按竖屏口播重写。砸入参数 1.55 → 0.94 → 1.0 / 0.17 秒取自 huashu-art-motion 的镜头语言说明。

- 仓库：https://github.com/alchaincyf/huashu-motion 、https://github.com/alchaincyf/huashu-art-motion
- 许可：MIT License

没有使用这两个仓库的源码、字体、配乐或任何媒体素材。

## CreatorMotion inspect-split

`scene` 的放大镜分屏（`split`）参考了 CreatorMotion 的 inspect-split 效果（两张卡、放大镜依次看过、分开露出中间的结果），按竖屏和本仓库的配色规则自行实现，没有使用其源码或素材。

