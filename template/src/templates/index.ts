// 8 个镜头模板。新增模板：写一个 React 组件，签名 (t, shot, ep, env)，在这里注册即可。
import React from 'react';
import {TemplateProps} from './types';
import {Host} from './Host';
import {Opener} from './Opener';
import {Tools} from './Tools';
import {Evidence} from './Evidence';
import {Steps} from './Steps';
import {Voice} from './Voice';
import {MediaShot} from './MediaShot';
import {Outro} from './Outro';
import {Placeholder} from './Placeholder';
import {Orb} from './Orb';
import {Scene} from './Scene';

export const TEMPLATES: Record<string, React.FC<TemplateProps>> = {
  opener: Opener,     // 开场（方案 C 默认）：角色立绘 + 本期图标 → 收进托盘，窗口从托盘长出
  host: Host,         // 开场 / 痛点：角色片段 + 大标题 + 手绘下划线
  tools: Tools,       // 工具清单：依次点名 + 串联者手绘框
  evidence: Evidence, // 真实页面：截图慢推 + 手绘圈重点 + 原文摘录
  steps: Steps,       // 步骤 / 检查项：逐步点亮 + 手绘连线
  voice: Voice,       // 讲配音 / 节奏：文案→真实波形；或真实时间轴
  media: MediaShot,   // 成果 / 样图 / 动画：带真实性标签
  outro: Outro,       // 结尾：关键词 + 头像
  orb: Orb,          // 方案 D：角色开场或竖排大纲
  scene: Scene,      // 方案 D：概念场景
  TODO: Placeholder,  // 骨架占位：还没选模板
};
