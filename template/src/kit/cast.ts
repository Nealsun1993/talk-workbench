// ───────────────────────────────────────────────────────────
// 开场「角色 + 内容图标」→ 正文窗口的衔接（v5）
// opener 模板里的图标块（cast）在开场结尾收进托盘；下一镜 App 窗口从托盘长出来，
// 每个图标飞进新页面里的对应位置（to = 新页面的锚点名，如 logo:0 / logo:orch）。
// 本文件只放几何与时间，不引用任何模板，页面模板和 AppStage 都可以用。
// ───────────────────────────────────────────────────────────
import {Episode, Shot} from './types';

export type R4 = [number, number, number, number];

/** 开场布局（画面坐标） */
export const OPENER = {
  figure: {cx: 540, bottom: 1300, h: 600},       // 角色立绘：底边与高度
  tile: 128,                                     // 图标块边长
  // 散开时：围在角色头顶的一道椭圆弧（按个数自动排；右侧避开立绘上的挥手线，右缘 ≤ 980，高于平台右侧按钮区）
  arc: {cx: 540, cy: 960, rx: 400, ry: 330, from: -160, to: -20},
  tray: [196, 530, 688, 160] as R4,              // 收拢时的托盘：在标题和角色头顶之间，像一条工具栏
  trayR: 44,
};

/** 图标飞行：窗口开始长出后 delay 秒起飞，每个错开 stagger，飞行 dur 秒 */
export const CAST_FLY = {delay: 0.05, stagger: 0.05, dur: 0.75};

export const castArc = (n: number, i: number, arc?: Partial<typeof OPENER.arc>): [number, number] => {
  const {cx, cy, rx, ry, from, to} = {...OPENER.arc, ...(arc ?? {})};
  const a = ((n === 1 ? (from + to) / 2 : from + ((to - from) * i) / (n - 1)) * Math.PI) / 180;
  return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
};

/** 托盘：图标多（>4）时托盘变宽（最宽 880），再不够就把图标缩小 */
export const trayRect = (n: number): {rect: R4; s: number; gap: number} => {
  const [, y, w0, h] = OPENER.tray;
  let s = OPENER.tile, gap = n <= 4 ? 44 : 24;
  let w = Math.max(w0, n * s + (n - 1) * gap + 40);
  if (w > 880) { w = 880; s = Math.floor((880 - 40 - (n - 1) * gap) / n); }
  return {rect: [540 - w / 2, y, w, h], s, gap};
};
export const castTray = (n: number, i: number): R4 => {
  const {rect: [x, y, w, h], s, gap} = trayRect(n);
  const total = n * s + (n - 1) * gap;
  return [x + (w - total) / 2 + i * (s + gap), y + (h - s) / 2, s, s];
};

/** 这一镜之前紧挨着的 opener 镜头（有 cast 才算） */
export const openerBefore = (ep: Episode, shot: Shot): Shot | null => {
  const p = ep.shots.find((x) => Math.abs(x.end - shot.start) < 0.01);
  return p && p.template === 'opener' && p.props?.cast?.length ? p : null;
};

/** 新页面里某个锚点的图标什么时候落位（页面在此之前把自己的图标藏起来，避免重影） */
export const castLandAt = (ep: Episode, shot: Shot, anchor: string): number | null => {
  const o = openerBefore(ep, shot);
  if (!o || shot.props?.launch?.from !== 'opener') return null;
  const i = o.props.cast.findIndex((c: any) => c.to === anchor);
  return i < 0 ? null : shot.start + CAST_FLY.delay + i * CAST_FLY.stagger + CAST_FLY.dur;
};
