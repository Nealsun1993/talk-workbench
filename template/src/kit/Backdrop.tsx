// ───────────────────────────────────────────────────────────
// 背景（v5 试验）：慢节奏的动态背景，填补窗口下方和两侧的空白。
// episode.json 写 "backdrop": {"kind": "grid" | "aura" | "plain"}，不写 = plain（纯纸色，旧片不受影响）。
//   grid：点阵画布 + 一束慢慢移动的蓝光，光扫过的点会亮起来；相机推近时点阵跟着轻微视差
//   aura：几团很淡的蓝色柔光，20–30 秒一个周期缓慢漂移（不是「漂浮圆」：没有边、看不出形状）
// 规则：背景只动得很慢（一个周期 ≥ 19 秒），不承载信息，不用橙色；结尾深色时自动隐去。
// ───────────────────────────────────────────────────────────
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from './tokens';
import {lerp} from './motion';

export type BackdropSpec = {kind?: 'grid' | 'aura' | 'plain'; gap?: number; strength?: number};
type Cam = {s: number; tx: number; ty: number};
const TAU = Math.PI * 2;

const dots = (color: string, r: number, gap: number): React.CSSProperties => ({
  backgroundImage: `radial-gradient(circle at center, ${color} ${r}px, transparent ${r + 0.9}px)`,
  backgroundSize: `${gap}px ${gap}px`,
  backgroundPosition: `${gap / 2}px ${gap / 2}px`,
});

export const Backdrop: React.FC<{t: number; spec?: BackdropSpec; cam: Cam; dark: number}> = ({t, spec, cam, dark}) => {
  const kind = spec?.kind ?? 'plain';
  if (kind === 'plain' || dark >= 1) return null;
  const k = spec?.strength ?? 1;
  // 主光：在画面下半部慢慢游走（28s / 19s 两个周期叠加，不会看出循环）
  const lx = 540 + 300 * Math.sin((TAU * t) / 28), ly = 1560 + 140 * Math.sin((TAU * t) / 19 + 1);
  // 副光：左上角，更淡
  const sx = 200 + 140 * Math.sin((TAU * t) / 31 + 2), sy = 300 + 90 * Math.cos((TAU * t) / 23);
  if (kind === 'aura') {
    const bx = 860 + 160 * Math.sin((TAU * t) / 26 + 3), by = 1180 + 160 * Math.cos((TAU * t) / 21);
    return (
      <AbsoluteFill style={{opacity: (1 - dark) * k}}>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 760px 620px at ${lx}px ${ly}px, rgba(40,91,240,0.22), rgba(40,91,240,0) 70%)`}} />
        <AbsoluteFill style={{background: `radial-gradient(ellipse 640px 560px at ${bx}px ${by}px, rgba(88,196,220,0.16), rgba(88,196,220,0) 70%)`}} />
        <AbsoluteFill style={{background: `radial-gradient(ellipse 620px 520px at ${sx}px ${sy}px, rgba(124,150,255,0.14), rgba(124,150,255,0) 70%)`}} />
      </AbsoluteFill>
    );
  }
  // grid：点阵随相机轻微视差（相机推近 1.2 倍，点阵只推近 1.04 倍）
  const P = 0.2, s = lerp(1, cam.s, P), tx = lerp(0, cam.tx, P), ty = lerp(0, cam.ty, P);
  const gap = spec?.gap ?? 40, pad = 160;
  const layer: React.CSSProperties = {position: 'absolute', left: -pad, top: -pad, width: 1080 + pad * 2, height: 1920 + pad * 2, transformOrigin: `${pad}px ${pad}px`, transform: `translate(${tx}px, ${ty}px) scale(${s})`};
  return (
    <AbsoluteFill style={{opacity: (1 - dark) * k}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 720px 560px at ${lx}px ${ly}px, rgba(40,91,240,0.13), rgba(40,91,240,0) 70%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 560px 460px at ${sx}px ${sy}px, rgba(124,150,255,0.08), rgba(124,150,255,0) 70%)`}} />
      {/* 点阵：上淡下浓，让下半部分不空 */}
      <div style={{...layer, ...dots('rgba(16,36,58,0.15)', 2.1, gap), WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,0.35) ${pad + 200}px, rgba(0,0,0,0.75) ${pad + 1100}px, #000 ${pad + 1700}px)`}} />
      {/* 光扫过的点亮起来 */}
      <div style={{...layer, ...dots('rgba(40,91,240,0.6)', 2.4, gap), WebkitMaskImage: `radial-gradient(ellipse 460px 360px at ${lx + pad}px ${ly + pad}px, #000, rgba(0,0,0,0) 72%)`}} />
    </AbsoluteFill>
  );
};
