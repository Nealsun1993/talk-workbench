// 动效语法。所有时间单位都是「秒」，直接用配音时间戳。
//   · 长出   —— rise：关键词出现时，元素从下方升起
//   · 推近   —— push：截图慢推；产品演示方案里由相机跟随完成
//   · 流动   —— flowIn/flowOut：一段讲完向左流走，下一段从右侧流入，画面不清空
// 已停用：声线（不再使用）
import {spring, interpolate, Easing} from 'remotion';

export const FPS = 30;
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** 平滑减速、不回弹 */
export const smooth = (t: number, at: number, dur = 0.45) =>
  spring({frame: (t - at) * FPS, fps: FPS, config: {damping: 200}, durationInFrames: Math.max(1, Math.round(dur * FPS))});

/** 打结长出：上移 20px + 淡入 + 轻微去模糊 */
export const rise = (t: number, at: number, dist = 20) => {
  const p = smooth(t, at);
  return {opacity: interpolate(p, [0, 0.6], [0, 1], clamp), transform: `translateY(${(1 - p) * dist}px)`, filter: p < 0.99 ? `blur(${(1 - p) * 4}px)` : undefined};
};

/** 弹出（线结、小标签用） */
export const pop = (t: number, at: number) => {
  const s = spring({frame: (t - at) * FPS, fps: FPS, config: {damping: 11, stiffness: 190, mass: 0.7}});
  return {opacity: clamp01((t - at) / 0.12), transform: `scale(${t < at ? 0.6 : 0.6 + 0.4 * s})`};
};

/** 点亮进度 0→1 */
export const lit = (t: number, at: number) => smooth(t, at, 0.3);

/** 手绘描线进度 0→1 */
export const draw = (t: number, at: number, dur = 0.6) =>
  interpolate(t, [at, at + dur], [0, 1], {...clamp, easing: Easing.bezier(0.45, 0, 0.2, 1)});

/** 沿线流动：进场从右流入，退场向左流走 */
export const FLOW_OUT = 0.22;
export const flowIn = (t: number, at: number) => {
  const p = smooth(t, at, 0.5);
  return {opacity: interpolate(p, [0, 0.5], [0, 1], clamp), transform: `translateX(${(1 - p) * 48}px)`};
};
export const flowOut = (t: number, end: number) => {
  const p = interpolate(t, [end, end + FLOW_OUT], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  return {opacity: 1 - p, transform: `translateX(${-64 * p}px)`};
};

/** 截图慢推：≤ 1.5%/s，永不停死 */
export const push = (t: number, start: number, end: number, amount = 0.05) => 1 + amount * clamp01((t - start) / Math.max(0.1, end - start));

/** 颜色插值 */
export const mix = (a: string, b: string, p: number) => {
  const h = (s: string) => (s.startsWith('rgb') ? s.match(/\d+/g)!.slice(0, 3).map(Number) : [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)));
  const x = h(a), y = h(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * p)).join(',')})`;
};

// ── v4：不同动作用不同曲线（不要全片一个缓动） ──
/** 点击、开关、勾选：快速到位（expo 缓出，约 0.22s） */
export const snap = (t: number, at: number, dur = 0.22) =>
  interpolate(t, [at, at + dur], [0, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)});
/** 卡片、行、通知出现：带一点回弹的弹簧（超出约 4%） */
export const springIn = (t: number, at: number) =>
  t < at ? 0 : spring({frame: (t - at) * FPS, fps: FPS, config: {damping: 13, stiffness: 180, mass: 0.8}});
/** 镜头：两头慢的 S 曲线（跟随感） */
export const camEase = Easing.inOut(Easing.sin);
/** 承接变形：expo 两头，起步干脆、落位稳 */
export const morphEase = Easing.bezier(0.7, 0, 0.2, 1);
/** 卡片弹入：位移 + 缩放，缩放用弹簧（可超过 1） */
export const popUp = (t: number, at: number, dist = 22) => {
  const s = springIn(t, at);
  return {opacity: clamp01((t - at) / 0.12), transform: `translateY(${(1 - Math.min(1, s)) * dist}px) scale(${0.94 + 0.06 * s})`};
};
