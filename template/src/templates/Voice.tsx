// 模板 voice · 讲配音 / 节奏
// 用真实配音的波形（柱状）来讲“声音”本身。两种用法：
//   text：确认好的文案 → 箭头 → 这句话的真实波形（讲配音）
//   timeline：输入（文案/配音）→ 一段真实波形 + 字幕块 + 镜头块，竖线=此刻（讲“画面跟着声音走”）
// props: {
//   mode: 'text' | 'timeline',
//   quote?: {label, text, range: [s, e]},          // text 模式：文案与它的时间范围
//   inputs?: [{label, icon, at}],                   // timeline 模式：输入
//   range?: [s, e],                                 // timeline 模式：展示哪段
//   label: string, at?: number,                     // 波形卡片标注（写明“真实波形”）
//   lanes?: [{track: '字幕'|'画面', text, at}],      // timeline 模式：说到时点亮对应轨道
//   tags?: [{text, at, tone?}]
// }
import React from 'react';
import {C, G, T, HAND} from '../kit/tokens';
import {Card, Icon, Sketch, Tag, Waveform} from '../kit/components';
import {rise, draw, clamp01} from '../kit/motion';
import {TemplateProps} from './types';
import {envAt} from '../kit/types';

export const Voice: React.FC<TemplateProps> = ({t, shot, ep, env}) => {
  const p = shot.props;
  if (p.mode === 'text') {
    const [s, e] = p.quote.range;
    const waveAt = p.at ?? shot.start + 1.2;
    return (
      <>
        <div style={{position: 'absolute', left: G.left, top: G.contentTop, width: G.width, ...rise(t, shot.start + 0.1)}}>
          <Card style={{padding: '32px 40px'}}>
            <div style={{...T.caption, color: C.secondary}}>{p.quote.label}</div>
            <div style={{...T.heading, fontSize: 46, color: C.ink, marginTop: 12}}>「{p.quote.text}」</div>
          </Card>
        </div>
        <Sketch shape={{kind: 'line', x1: 540, y1: 780, x2: 541, y2: 868}} p={draw(t, waveAt - 0.5, 0.45)} color={C.ink} width={6} seed={4} arrow />
        <div style={{position: 'absolute', left: G.left, top: 900, width: G.width, ...rise(t, waveAt - 0.1)}}>
          <Card style={{height: 300}}>
            <div style={{position: 'absolute', left: 48, top: 40}}>
              <Waveform values={(x) => envAt(env, x)} s={s} e={e} w={G.width - 96} h={180} p={clamp01((t - waveAt) / 1.4)} />
            </div>
            <div style={{position: 'absolute', left: 48, bottom: 26, ...T.caption, color: C.secondary}}>{p.label}</div>
          </Card>
        </div>
        {p.tags ? (
          <div style={{position: 'absolute', left: G.left, top: 1236, display: 'flex', gap: 14}}>
            {p.tags.map((g: any) => <div key={g.text} style={rise(t, g.at)}><Tag tone={g.tone ?? 'voice'}>{g.text}</Tag></div>)}
          </div>
        ) : null}
      </>
    );
  }
  // timeline
  const [s, e] = p.range;
  const cardTop = 700, W = G.width - 96, X = (sec: number) => 48 + ((sec - s) / (e - s)) * W;
  const caps = ep.captions.filter((c) => c.end > s && c.start < e);
  const shots = ep.shots.filter((x) => x.end > s && x.start < e);
  const now = Math.min(Math.max(t, s), e);
  const show = p.at ?? shot.start + 1;
  const fill = (a: number, b: number) => (now >= a && now < b ? C.voice : now >= b ? '#A9BEF8' : C.voiceSoft);
  return (
    <>
      {(p.inputs ?? []).map((it: any, i: number) => (
        <div key={it.label} style={{position: 'absolute', left: G.left + i * 452, top: G.contentTop, width: 428, ...rise(t, it.at)}}>
          <Card style={{height: 150, display: 'flex', alignItems: 'center', gap: 18, padding: '0 26px'}}>
            <div style={{width: 72, height: 72, borderRadius: 18, background: C.voiceSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto'}}><Icon name={it.icon} size={42} color={C.voice} /></div>
            <div style={{...T.body, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap'}}>{it.label}</div>
          </Card>
        </div>
      ))}
      <Sketch shape={{kind: 'line', x1: 540, y1: 622, x2: 541, y2: 686}} p={draw(t, show - 0.45, 0.4)} color={C.ink} width={6} seed={6} arrow />
      <div style={{position: 'absolute', left: G.left, top: cardTop, width: G.width, ...rise(t, show)}}>
        <Card style={{height: 560}}>
          <div style={{position: 'absolute', left: 48, top: 30, ...T.caption, color: C.secondary}}>{p.label}</div>
          <div style={{position: 'absolute', left: 48, top: 92}}>
            <Waveform values={(x) => envAt(env, x)} s={s} e={e} w={W} h={116} bar={4} gap={2} color={(x) => (x <= now ? C.voice : C.voiceSoft)} />
          </div>
          <svg width={G.width} height={560} style={{position: 'absolute', left: 0, top: 0}}>
            <line x1={X(now)} x2={X(now)} y1={86} y2={486} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
            <circle cx={X(now)} cy={86} r={10} fill={C.voice} />
          </svg>
          {[{name: '字幕', blocks: caps, y: 282}, {name: '画面', blocks: shots, y: 408}].map((tr) => {
            const lane = (p.lanes ?? []).find((l: any) => l.track === tr.name);
            const on = lane && t >= lane.at;
            return (
              <React.Fragment key={tr.name}>
                <div style={{position: 'absolute', left: 48, top: tr.y - 48, ...T.caption, fontWeight: 600, color: on ? C.voice : C.secondary}}>{tr.name}{lane && on ? <span style={{marginLeft: 16, fontWeight: 500}}>{lane.text}</span> : null}</div>
                {tr.blocks.map((b: any, j: number) => (
                  <div key={j} style={{position: 'absolute', left: X(Math.max(b.start, s)) + 2, width: Math.max(5, X(Math.min(b.end, e)) - X(Math.max(b.start, s)) - 4), top: tr.y, height: 58, borderRadius: 12, background: fill(b.start, b.end)}} />
                ))}
              </React.Fragment>
            );
          })}
        </Card>
      </div>
    </>
  );
};
