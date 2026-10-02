// 页面 app.timeline · 按说话时间对齐（真实数据）
// 光标把文案、配音拖进来 → 出现时间轴（真实波形；字幕块、镜头块先按“估算”均匀排开）
// → 点「按说话时间对齐」→ 字幕块、镜头块依次吸附到真实位置，播放头走真实时间。
// props: {
//   title, sub,
//   drops: [{label, icon, at}],                     // 拖入的文件（最多 2 个）
//   range: [s, e], label,                           // 展示本片哪一段（真实数据）
//   show: number,                                   // 时间轴出现时刻
//   align: {text, at},                              // 点击对齐按钮
//   lanes: [{track: '字幕' | '画面', at}]            // 各轨吸附到真实位置的时刻
// }
import React from 'react';
import {C, T} from '../../kit/tokens';
import {Icon, Waveform} from '../../kit/components';
import {rise, smooth, lerp, clamp01} from '../../kit/motion';
import {envAt} from '../../kit/types';
import {AppTemplate, PageProps} from '../types';
import {PAD, CW, WIN} from '../geom';
import {Button, Mono, PageTitle, UI, pressScale} from '../ui';

const DROP_Y = 350, DROP_H = 150, PANEL_Y = 536, PANEL_H = 560;
const TRACK_X = 150, TRACK_W = CW - TRACK_X - 28;
const SLOT = (i: number): [number, number] => [PAD + 26 + i * 408, DROP_Y + 35];
const START: [number, number] = [WIN.w - 120, WIN.h + 60]; // 从窗口右下外侧拖进来
const DRAG = 0.8;
const BTN = {x: PAD + CW - 28 - 330, y: PANEL_Y + 24, w: 330};
const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

const Page: React.FC<PageProps> = ({t, shot, ep, env}) => {
  const p = shot.props, [s, e] = p.range;
  const X = (sec: number) => TRACK_X + ((sec - s) / (e - s)) * TRACK_W;
  const caps = ep.captions.filter((c) => c.end > s && c.start < e);
  const shots = ep.shots.filter((x) => x.end > s && x.start < e);
  const lane = (name: string) => p.lanes.find((l: any) => l.track === name)?.at ?? Infinity;
  const aligned = t >= p.align.at;
  const now = Math.min(Math.max(t, s), e);
  const blocks = (list: any[], snapAt: number, y: number) => {
    const k = smooth(t, snapAt, 0.6);
    const n = list.length, even = (e - s) / n;
    return list.map((b, j) => {
      const a0 = s + j * even, a1 = a0 + even * 0.86;            // 估算：均匀排开
      const b0 = Math.max(b.start, s), b1 = Math.min(b.end, e);  // 真实位置
      const x0 = X(lerp(a0, b0, k)), x1 = X(lerp(a1, b1, k));
      const cur = k > 0.99 && now >= b.start && now < b.end;
      const bg = k < 0.5 ? UI.off : cur ? C.voice : now >= b.end && aligned ? '#A9BEF8' : C.voiceSoft;
      return <div key={j} style={{position: 'absolute', left: x0 + 2, width: Math.max(5, x1 - x0 - 4), top: y, height: 60, borderRadius: 12, background: bg}} />;
    });
  };
  const dropsIn = p.drops.map((d: any) => clamp01((t - d.at) / DRAG));
  return (
    <>
      <PageTitle t={t} at={shot.start + 0.1} title={p.title} sub={p.sub} />
      {/* 拖放区 */}
      <div style={{position: 'absolute', left: PAD, top: DROP_Y, width: CW, height: DROP_H, borderRadius: 28, border: `3px dashed ${C.quiet}`, boxSizing: 'border-box', ...rise(t, shot.start + 0.15)}}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...T.caption, color: C.secondary, opacity: 1 - dropsIn[0]}}>拖入文案和配音</div>
      </div>
      {p.drops.map((d: any, i: number) => {
        if (t < d.at) return null;
        const q = smooth(t, d.at, DRAG), [sx, sy] = START, [tx, ty] = SLOT(i);
        return (
          <div key={d.label} style={{position: 'absolute', left: lerp(sx, tx, q), top: lerp(sy, ty, q), width: 382, height: 80, borderRadius: 20, background: '#fff',
            boxShadow: `0 ${lerp(18, 3, q)}px ${lerp(36, 8, q)}px rgba(16,36,58,${lerp(0.25, 0.1, q)}), inset 0 0 0 2px ${UI.line}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', boxSizing: 'border-box',
            transform: `rotate(${lerp(-4, 0, q)}deg)`}}>
            <div style={{width: 52, height: 52, borderRadius: 14, background: C.voiceSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name={d.icon} size={32} color={C.voice} /></div>
            <div style={{...T.caption, fontSize: 34, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap'}}>{d.label}</div>
          </div>
        );
      })}
      {/* 时间轴面板 */}
      <div style={{position: 'absolute', left: PAD, top: PANEL_Y, width: CW, height: PANEL_H, borderRadius: 28, background: UI.well, ...rise(t, shot.start + 0.25)}}>
        {t < p.show + 0.3 ? <div style={{position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center', ...T.caption, color: C.secondary, opacity: 1 - clamp01((t - p.show) / 0.3)}}>等待文案和配音…</div> : null}
        <div style={{position: 'absolute', left: 28, top: 40, ...T.caption, color: C.secondary}}>{p.label}</div>
        <div style={{position: 'absolute', left: 28, top: 140, ...T.caption, fontWeight: 600, color: t >= p.align.at && t < lane('字幕') ? C.voice : C.ink}}>声音</div>
        <div style={{position: 'absolute', left: TRACK_X, top: 112}}>
          <Waveform values={(x) => envAt(env, x)} s={s} e={e} w={TRACK_W} h={100} bar={4} gap={2} p={clamp01((t - p.show) / 0.9)} color={(x) => (aligned && x <= now ? C.voice : '#B9C6DA')} />
        </div>
        {[{name: '字幕', list: caps, y: 262}, {name: '画面', list: shots, y: 372}].map((tr) => (
          <React.Fragment key={tr.name}>
            <div style={{position: 'absolute', left: 28, top: tr.y + 10, ...T.caption, fontWeight: 600, color: t >= lane(tr.name) && t < lane(tr.name) + 1.2 ? C.voice : C.ink}}>{tr.name}</div>
            <div style={{opacity: clamp01((t - p.show - 0.3) / 0.4)}}>{blocks(tr.list, lane(tr.name), tr.y)}</div>
          </React.Fragment>
        ))}
        {aligned ? <div style={{position: 'absolute', left: X(now) - 2, top: 104, width: 4, height: 340, borderRadius: 2, background: C.ink}} /> : null}
        <div style={{position: 'absolute', left: TRACK_X, top: 470}}><Mono style={{color: C.secondary}}>{fmt(aligned ? now : s)}</Mono></div>
        <div style={{position: 'absolute', right: 28, top: 470}}><Mono style={{color: C.secondary}}>{fmt(e)}</Mono></div>
      </div>
      <Button x={BTN.x} y={BTN.y} w={BTN.w} h={68} label={aligned ? '已按说话时间对齐' : p.align.text} primary={!aligned} icon={aligned ? 'check' : undefined} press={pressScale(t, p.align.at)}
        style={{...rise(t, p.show + 0.4), fontSize: 32}} />
    </>
  );
};

export const Timeline: AppTemplate = {
  Page,
  anchors: () => ({panel: {rect: [PAD, PANEL_Y, CW, PANEL_H], r: 28, bg: UI.well}, drop: {rect: [PAD, DROP_Y, CW, DROP_H], r: 28, bg: '#FFFFFF'}}),
  acts: (shot) => {
    const p = shot.props;
    const a: any[] = p.drops.map((d: any, i: number) => ({at: d.at, x: START[0] + 40, y: START[1] + 46, kind: 'drag', to: [SLOT(i)[0] + 40, SLOT(i)[1] + 46], dur: DRAG}));
    a.push({at: p.align.at, x: BTN.x + BTN.w / 2 + 20, y: BTN.y + 44, kind: 'click'});
    return a;
  },
  focus: (shot) => {
    const p = shot.props;
    const tl = p.lanes.map((l: any) => l.at);
    return [
      {at: shot.start, rect: [PAD - 20, 190, CW + 40, DROP_Y + DROP_H + 40 - 190], scale: 1.12},
      {at: p.show - 0.3, rect: null},
      {at: Math.min(...tl) - 0.3, rect: [PAD - 10, PANEL_Y + 90, CW + 20, 380], scale: 1.14},
      {at: Math.max(...tl) + 1.1, rect: null},
    ];
  },
};
