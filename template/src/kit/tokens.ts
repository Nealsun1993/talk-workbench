// ───────────────────────────────────────────────────────────
// 口播工作台组件库 · 设计 token（1080×1920 竖屏，30fps）
// 规则：一种颜色只表示一件事；字号只用 5 档；所有文字 ≥ 32px。
// ───────────────────────────────────────────────────────────

export const C = {
  paper: '#F6F8FC',     // 全片底色
  surface: '#FFFFFF',   // 精确层：卡片
  ink: '#10243A',       // 信息文字 14.8:1
  secondary: '#56677C', // 次要文字 5.45:1（paper）/ 5.79:1（white）
  voice: '#285BF0',     // 只表示「当前 / 正在操作的」——选中、点亮、光标点击、聚光框
  voiceSoft: '#E8EFFD',
  problem: '#FF795C',   // 只表示「痛点 / 问题」与结尾行动号召
  navy: '#0B192F',      // 只用于结尾
  quiet: '#C9D3E1',     // 未发生的结构（未来的虚线、未点亮）——非文字
  hairline: 'rgba(16,36,58,0.08)',
  // 深色（结尾）对应色
  dark: {ink: '#FFFFFF', secondary: '#B4C7E8', voice: '#7FA2FF', quiet: '#2A3F63'},
} as const;

export const FONT = '"MiSans VF", "PingFang SC", sans-serif';
export const MONO = '"JetBrains Mono", "MiSans VF", monospace';

export const T = {
  display: {fontSize: 76, fontWeight: 600, lineHeight: 1.18, letterSpacing: -0.5},
  heading: {fontSize: 52, fontWeight: 600, lineHeight: 1.2},
  body: {fontSize: 40, fontWeight: 500, lineHeight: 1.35},
  caption: {fontSize: 32, fontWeight: 500, lineHeight: 1.4},
  subtitle: {fontSize: 46, fontWeight: 600, lineHeight: 1.45},
} as const;

// 版式网格（y 坐标）
export const G = {
  W: 1080, H: 1920,
  left: 80, width: 880,       // 右缘 960，避开平台右侧按钮
  headerTop: 196,             // 章节名；标题 +50；副标题 +146
  contentTop: 460,            // 主视觉区 460–1320
  contentBottom: 1320,
  subtitleTop: 1455,          // 字幕
  radius: 44,
} as const;

// 手绘层（卡片方案用）：与角色的轮廓线同粗
export const HAND = {voice: 7, mark: 7, roughness: 1.15, bowing: 1.1} as const;

// 已停用：声线（2026-09-28 确认不再使用，勿恢复）

export const SHADOW = '0 1px 2px rgba(16,36,58,0.04), 0 10px 30px rgba(16,36,58,0.07)';
