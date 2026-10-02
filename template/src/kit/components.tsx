import React, {useMemo} from 'react';
import {Img, OffthreadVideo, staticFile} from 'remotion';
import rough from 'roughjs';
import {C, SHADOW, G, HAND, T, MONO} from './tokens';
import {ICONS} from './icons';

// ── 精确层 ──────────────────────────────────────────

/** 线性图标（Phosphor regular），颜色随 color */
export const Icon: React.FC<{name: string; size: number; color?: string; style?: React.CSSProperties}> = ({name, size, color, style}) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" style={{color, display: 'block', flex: '0 0 auto', ...style}}
    dangerouslySetInnerHTML={{__html: ICONS[name] || ICONS['sparkle']}} />
);

/** 工具图标方块：Logo 统一放进圆角方块（圆角 = 24% 边长） */
export const Tile: React.FC<{size: number; src?: string; icon?: string; bg?: string; tint?: string; pad?: number}> = ({size, src, icon, bg = C.surface, tint = '#fff', pad = 0.15}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.24, background: bg, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    boxShadow: `inset 0 0 0 1.5px ${C.hairline}, 0 2px 6px rgba(16,36,58,0.06), 0 8px 18px rgba(16,36,58,0.07)`}}>
    {src ? <Img src={staticFile(src)} style={{width: size * (1 - 2 * pad), height: size * (1 - 2 * pad), objectFit: 'contain'}} /> : null}
    {icon ? <Icon name={icon} size={size * 0.54} color={tint} /> : null}
  </div>
);

export const Card: React.FC<{children?: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{background: C.surface, borderRadius: G.radius, boxShadow: SHADOW, position: 'relative', ...style}}>{children}</div>
);

/** 标签：来源 / 真实性标注（作者示例、自制示意、实际页面…）一律用它 */
export const Tag: React.FC<{children: React.ReactNode; tone?: 'plain' | 'voice' | 'problem'; style?: React.CSSProperties}> = ({children, tone = 'plain', style}) => {
  const c = tone === 'voice' ? [C.voiceSoft, C.voice] : tone === 'problem' ? ['#FFEDE8', '#B8432A'] : ['#EEF1F6', C.secondary];
  return <div style={{...T.caption, fontWeight: 600, background: c[0], color: c[1], borderRadius: 40, padding: '6px 22px', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', ...style}}>{children}</div>;
};

export const Mono: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <span style={{fontFamily: MONO, fontSize: 32, fontWeight: 500, ...style}}>{children}</span>
);

/** 视频或图片素材；视频一律静音（沿用确认好的配音） */
export const Media: React.FC<{src: string; kind?: 'image' | 'video'; fit?: 'contain' | 'cover'; style?: React.CSSProperties}> = ({src, kind, fit = 'cover', style}) => {
  const isVideo = kind ? kind === 'video' : /\.(mp4|mov|webm)$/i.test(src);
  const s: React.CSSProperties = {width: '100%', height: '100%', objectFit: fit, display: 'block', ...style};
  return isVideo ? <OffthreadVideo src={staticFile(src)} muted style={s} /> : <Img src={staticFile(src)} style={s} />;
};

// ── 手绘层 ──────────────────────────────────────────

const gen = rough.generator();
type Shape =
  | {kind: 'ellipse'; cx: number; cy: number; w: number; h: number}
  | {kind: 'line'; x1: number; y1: number; x2: number; y2: number}
  | {kind: 'curve'; points: [number, number][]}
  | {kind: 'path'; d: string}
  | {kind: 'rect'; x: number; y: number; w: number; h: number; r?: number};

const roundedRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;

/**
 * 手绘线：圈重点、连线、下划线、箭头。p = 描线进度 0→1。
 * 同一 seed 每帧形状一致（不会抖）。
 */
export const Sketch: React.FC<{shape: Shape; p: number; color?: string; width?: number; seed?: number; arrow?: boolean; w?: number; h?: number; style?: React.CSSProperties}> = ({shape, p, color = C.voice, width = HAND.mark, seed = 7, arrow, w = G.W, h = G.H, style}) => {
  const paths = useMemo(() => {
    const o = {roughness: HAND.roughness, bowing: HAND.bowing, seed, stroke: color, strokeWidth: width, disableMultiStroke: shape.kind !== 'ellipse'};
    let d;
    if (shape.kind === 'ellipse') d = gen.ellipse(shape.cx, shape.cy, shape.w, shape.h, o);
    else if (shape.kind === 'line') d = gen.line(shape.x1, shape.y1, shape.x2, shape.y2, o);
    else if (shape.kind === 'curve') d = gen.curve(shape.points, o);
    else if (shape.kind === 'rect') d = gen.path(roundedRect(shape.x, shape.y, shape.w, shape.h, shape.r ?? 48), o);
    else d = gen.path(shape.d, o);
    return gen.toPaths(d).map((x: any) => x.d as string);
  }, [JSON.stringify(shape), color, width, seed]);
  if (p <= 0) return null;
  const n = paths.length;
  // 箭头：用终点方向画两笔
  let head: string | null = null;
  if (arrow && p > 0.85) {
    const pts = shape.kind === 'line' ? [[shape.x1, shape.y1], [shape.x2, shape.y2]] : shape.kind === 'curve' ? shape.points.slice(-2) : null;
    if (pts) {
      const [[ax, ay], [bx, by]] = pts as number[][];
      const ang = Math.atan2(by - ay, bx - ax), L = 26;
      const l = [bx - L * Math.cos(ang - 0.5), by - L * Math.sin(ang - 0.5)], r = [bx - L * Math.cos(ang + 0.5), by - L * Math.sin(ang + 0.5)];
      head = `M${l[0]},${l[1]} L${bx},${by} L${r[0]},${r[1]}`;
    }
  }
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', ...style}}>
      {paths.map((d, i) => {
        const q = Math.max(0, Math.min(1, p * n - i));
        return <path key={i} d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - q} opacity={q > 0 ? 1 : 0} />;
      })}
      {head ? <path d={head} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={(p - 0.85) / 0.15} /> : null}
    </svg>
  );
};

/** 估算文字宽度（中文按 1 字宽，英文数字按 0.56） */
export const textWidth = (s: string, fs: number) => [...s].reduce((w, ch) => w + (/[⺀-鿿＀-￯，。？！、：；「」]/.test(ch) ? fs : fs * 0.56), 0);

/** 音频波形（柱状，编辑器样式）：用真实响度包络；p = 从左到右出现的进度 */
export const Waveform: React.FC<{values: (sec: number) => number; s: number; e: number; w: number; h: number; bar?: number; gap?: number; color?: string | ((sec: number) => string); p?: number}> = ({values, s, e, w, h, bar = 5, gap = 3, color = C.voice, p = 1}) => {
  const n = Math.floor(w / (bar + gap));
  return (
    <svg width={w} height={h} style={{display: 'block'}}>
      {Array.from({length: Math.floor(n * p)}, (_, i) => {
        const sec = s + ((i + 0.5) / n) * (e - s);
        const a = Math.max(0.04, values(sec));
        const bh = Math.max(4, a * h * 0.92);
        return <rect key={i} x={i * (bar + gap)} y={(h - bh) / 2} width={bar} height={bh} rx={bar / 2} fill={typeof color === 'function' ? color(sec) : color} />;
      })}
    </svg>
  );
};
