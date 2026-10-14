// 示意 App 的界面零件：按钮、开关、状态标签、页面标题、通知条、聚光框。
import React from 'react';
import {C, T, MONO} from '../kit/tokens';
import {Icon} from '../kit/components';
import {mix, rise, smooth, clamp01, springIn} from '../kit/motion';
import {textWidth} from '../kit/components';
import {PAD, CW, WIN} from './geom';
import {usePointer, hoverOf} from './pointer';

export const UI = {
  well: '#F4F6FA',      // 列表底
  track: '#EEF1F6',     // 分段控件/次要按钮底
  line: '#E6EAF1',
  off: '#DCE2EB',
};

/** 按下反馈：点击瞬间缩小 3% */
export const pressScale = (t: number, clickAt?: number) => (clickAt !== undefined && t >= clickAt && t < clickAt + 0.16 ? 0.96 : 1);

export const PageTitle: React.FC<{t: number; at: number; title: string; sub?: string}> = ({t, at, title, sub}) => (
  <>
    <div style={{position: 'absolute', left: PAD, top: 214, ...T.heading, fontSize: 56, color: C.ink, ...rise(t, at)}}>{title}</div>
    {sub ? <div style={{position: 'absolute', left: PAD, top: 290, ...T.caption, color: C.secondary, ...rise(t, at + 0.06)}}>{sub}</div> : null}
  </>
);

export const Button: React.FC<{x: number; y: number; w: number; h?: number; label: React.ReactNode; primary?: boolean; icon?: string; press?: number; style?: React.CSSProperties}> = ({x, y, w, h = 72, label, primary, icon, press = 1, style}) => {
  const ptr = usePointer();
  // 打磨模式：光标靠近时变亮并抬起 3px；主按钮在等待点击时阴影缓慢呼吸
  const hv = hoverOf(ptr, x, y, w, h), pulse = ptr.polish && primary ? 0.5 + 0.5 * Math.sin(ptr.t * 2.6) : 0;
  const polished: React.CSSProperties = ptr.polish ? {
    ...style,
    background: primary ? mix(C.voice, '#5B86FF', hv) : mix(UI.track, '#D9E1EE', hv),
    transform: `${(style?.transform as string) ?? ''} translateY(${-3 * hv}px) scale(${press * (1 + 0.025 * hv)})`,
    boxShadow: primary ? `0 0 0 ${4 * hv}px rgba(40,91,240,${0.2 * hv}), 0 ${6 + 6 * hv}px ${16 + 14 * hv + 10 * pulse}px rgba(40,91,240,${0.28 + 0.14 * hv + 0.1 * pulse})`
      : `0 0 0 ${3 * hv}px rgba(40,91,240,${0.28 * hv}), 0 ${7 * hv}px ${16 * hv}px rgba(16,36,58,${0.14 * hv})`,
  } : (style ?? {});
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 20, background: primary ? C.voice : UI.track, color: primary ? '#fff' : C.ink,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, ...T.caption, fontSize: 34, fontWeight: 600, transform: `scale(${press})`,
      boxShadow: primary ? '0 6px 16px rgba(40,91,240,0.28)' : 'none', ...polished}}>
      {icon ? <Icon name={icon} size={36} color={primary ? '#fff' : C.ink} /> : null}
      {label}
    </div>
  );
};

// bloom（0–1，打磨模式）：刚打开的一瞬间，轨道比最终的蓝色更亮并带一圈光，随后落回
export const Toggle: React.FC<{on: number; x: number; y: number; hover?: number; bloom?: number}> = ({on, x, y, hover = 0, bloom = 0}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 110, height: 64, borderRadius: 32, background: mix(mix(mix(UI.off, '#C3CCDA', hover), mix(C.voice, '#4F7DFF', hover), on), '#7FA2FF', bloom * 0.7),
    boxShadow: `0 0 0 ${5 * hover}px rgba(40,91,240,${0.16 * hover}), 0 0 ${26 * bloom}px rgba(40,91,240,${0.55 * bloom})`}}>
    <div style={{position: 'absolute', top: 5, left: 5 + 46 * on, width: 54, height: 54, borderRadius: 27, background: '#fff', boxShadow: '0 2px 6px rgba(16,36,58,0.2)', transform: `scale(${1 + 0.06 * hover})`}} />
  </div>
);

export const Status: React.FC<{on: number; off: string; onText: string}> = ({on, off, onText}) => (
  <div style={{position: 'relative', height: 52, minWidth: 150}}>
    <div style={{position: 'absolute', right: 0, top: 0, ...T.caption, fontWeight: 600, padding: '6px 18px', borderRadius: 26, background: UI.track, color: C.secondary, opacity: 1 - on}}>{off}</div>
    <div style={{position: 'absolute', right: 0, top: 0, ...T.caption, fontWeight: 600, padding: '6px 18px', borderRadius: 26, background: C.voiceSoft, color: C.voice, display: 'flex', alignItems: 'center', gap: 8, opacity: on, transform: `scale(${0.9 + 0.1 * on})`, whiteSpace: 'nowrap'}}>
      <Icon name="check" size={30} color={C.voice} />{onText}
    </div>
  </div>
);

/** 底部通知条（深色胶囊） */
// icon：默认对勾（完成）；提醒类用 'info'（灰底），不要用对勾冒充「完成」
export const Toast: React.FC<{t: number; at: number; text: string; y?: number; icon?: string}> = ({t, at, text, y = WIN.h - 150, icon = 'check'}) => {
  if (t < at) return null;
  const p = springIn(t, at); // 通知：弹簧弹入
  return (
    <div style={{position: 'absolute', left: 0, width: WIN.w, top: y, display: 'flex', justifyContent: 'center', opacity: clamp01((t - at) / 0.12), transform: `translateY(${(1 - p) * 40}px) scale(${0.92 + 0.08 * p})`}}>
      <div style={{background: C.ink, color: '#fff', borderRadius: 48, height: 96, padding: '0 40px 0 24px', display: 'flex', alignItems: 'center', gap: 18, boxShadow: '0 16px 40px rgba(16,36,58,0.3)', ...T.body, fontWeight: 600}}>
        <div style={{width: 56, height: 56, borderRadius: 28, background: icon === 'check' ? C.voice : '#3A4B61', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name={icon} size={32} color="#fff" /></div>
        {text}
      </div>
    </div>
  );
};

/** 通知条的矩形（窗口坐标），用作承接锚点 */
export const toastRect = (text: string, y = WIN.h - 150): [number, number, number, number] => {
  const w = 24 + 56 + 18 + textWidth(text, 40) + 40;
  return [(WIN.w - w) / 2, y, w, 96];
};

/** 聚光：压暗整块区域，只留 rect 亮着，并加蓝色框 */
export const Spotlight: React.FC<{w: number; h: number; rect: [number, number, number, number]; p: number}> = ({w, h, rect, p}) => {
  if (p <= 0) return null;
  const [x, y, rw, rh] = rect, k = 1 + (1 - p) * 0.06;
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <mask id={`sp${x}${y}`}>
          <rect width={w} height={h} fill="#fff" />
          <rect x={x} y={y} width={rw} height={rh} rx={12} fill="#000" />
        </mask>
      </defs>
      <rect width={w} height={h} fill="rgba(16,36,58,0.5)" mask={`url(#sp${x}${y})`} opacity={p} />
      <rect x={x + rw / 2 - (rw / 2) * k} y={y + rh / 2 - (rh / 2) * k} width={rw * k} height={rh * k} rx={12} fill="none" stroke={C.voice} strokeWidth={4} opacity={p} />
    </svg>
  );
};

export const Mono: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <span style={{fontFamily: MONO, fontSize: 32, fontWeight: 500, ...style}}>{children}</span>
);

export const contentW = CW;
