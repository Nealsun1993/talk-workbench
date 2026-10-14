// 页面 app.gallery · 生成结果 / 样例画廊
// 两种用法：
//   生成：提示栏 + 「生成」按钮 → 结果卡出现（1 张）
//   画廊：分类标签 + 2–3 张样例；说到哪类，光标点哪个标签，那张被选中、相机推近
// 每张都必须带真实性标签。
// props: {
//   title, sub,
//   prompt?: {skill?, placeholder, type?: {text, at, cps?}}, button?: {text, at},   // 生成用法；type 是把一句话打进提示栏
//   chips?: string[],                                         // 画廊用法：分类标签
//   items: [{kind: 'image'|'video'|'flow', src?, poster?, steps?, stepAt?, tag, at?}],   // stepAt：流程每一步亮起的时间
//   select?: [{index, at}]                                    // 画廊用法：依次选中
// }
// layout: 'hero'（v5.1）：一张 16:9 大图 + 缩略图，横版样例用它，写法见 Hero.tsx
import React from 'react';
import {Img, Sequence, staticFile} from 'remotion';
import {C, T} from '../../kit/tokens';
import {Icon, Media, Tag} from '../../kit/components';
import {rise, smooth, lit, mix, snap, springIn} from '../../kit/motion';
import {assetPath} from '../../kit/types';
import {AppTemplate, PageProps} from '../types';
import {PAD, CW} from '../geom';
import {Button, UI, PageTitle, pressScale} from '../ui';
import {textWidth} from '../../kit/components';
import {HeroPage, heroAnchors, heroActs, heroFocus} from './Hero';

const BAR_Y = 340, GRID_Y = 470;
const chipGeom = (chips: string[]) => { let x = PAD; return chips.map((c) => { const w = textWidth(c, 32) + 56; const g = {x, w}; x += w + 12; return g; }); };
const cardGeom = (n: number) => {
  if (n === 1) { const w = 470, h = 640; return [{x: PAD + (CW - w) / 2, y: GRID_Y + 10, w, h}]; }
  const gap = 20, w = (CW - gap * (n - 1)) / n, h = Math.min(560, w * 1.6);
  return Array.from({length: n}, (_, i) => ({x: PAD + i * (w + gap), y: GRID_Y + 20, w, h}));
};

const Flow: React.FC<{steps: string[]; t: number; stepAt?: number[]}> = ({steps, t, stepAt}) => {
  const cur = stepAt ? stepAt.filter((x) => t >= x).length - 1 : steps.length - 1;
  return (
  <div style={{position: 'absolute', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10px', gap: 10}}>
    {steps.map((s, i) => (
      <React.Fragment key={s}>
        <div style={{background: i === cur ? (stepAt ? C.voice : C.voiceSoft) : UI.well, color: i === cur ? (stepAt ? '#FFFFFF' : C.voice) : C.ink, opacity: i > cur ? 0.35 : 1, borderRadius: 16, padding: '14px 6px', textAlign: 'center', whiteSpace: 'nowrap', ...T.caption, fontWeight: 600,
          transform: `scale(${stepAt && i === cur ? 0.94 + 0.06 * Math.min(1, springIn(t, stepAt[i])) : 1})`}}>{s}</div>
        {i < steps.length - 1 ? <div style={{display: 'flex', justifyContent: 'center'}}><Icon name="arrow-down" size={30} color={C.secondary} /></div> : null}
      </React.Fragment>
    ))}
  </div>
  );
};

const Page: React.FC<PageProps> = (props) => {
  if (props.shot.props.layout === 'hero') return <HeroPage {...props} />;
  const {t, shot, ep} = props;
  const p = shot.props, items = p.items as any[], g = cardGeom(items.length);
  const sel = (p.select ?? []) as any[];
  const cur = sel.filter((x) => t >= x.at).pop();
  const genAt = p.button ? p.button.at + 0.25 : shot.start + 0.3;
  return (
    <>
      <PageTitle t={t} at={shot.start + 0.1} title={p.title} sub={p.sub} />
      {p.prompt ? (
        <div style={{position: 'absolute', left: PAD, top: BAR_Y, width: CW, height: 96, borderRadius: 26, background: UI.well, display: 'flex', alignItems: 'center', gap: 16, padding: '0 14px 0 20px', boxSizing: 'border-box', ...rise(t, shot.start + 0.18)}}>
          {p.prompt.skill ? <Tag tone="voice">{p.prompt.skill}</Tag> : null}
          {p.prompt.type && t >= p.prompt.type.at
            ? <div style={{...T.caption, color: C.ink, fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden'}}>{[...p.prompt.type.text].slice(0, Math.floor((t - p.prompt.type.at) / (p.prompt.type.cps ?? 0.12)) + 1).join('')}</div>
            : <div style={{...T.caption, color: '#9AA7B8', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden'}}>{p.prompt.placeholder}</div>}
        </div>
      ) : null}
      {p.button ? <Button x={PAD + CW - 14 - 200} y={BAR_Y + 12} w={200} label={p.button.text} primary icon="sparkle" press={pressScale(t, p.button.at)} style={rise(t, shot.start + 0.22)} /> : null}
      {p.chips ? (
        <div style={{position: 'absolute', left: 0, top: BAR_Y, ...rise(t, shot.start + 0.18)}}>
          {(p.chips as string[]).map((c, i) => {
            const on = cur && cur.index === i ? snap(t, cur.at) : 0;
            const cg = chipGeom(p.chips)[i];
            return <div key={c} style={{position: 'absolute', left: cg.x, top: 0, width: cg.w, height: 72, borderRadius: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: mix(UI.track, C.voice, on), color: mix(C.ink, '#FFFFFF', on), ...T.caption, fontWeight: 600, transform: `scale(${pressScale(t, cur && cur.index === i ? cur.at - 0.05 : undefined)})`}}>{c}</div>;
          })}
        </div>
      ) : null}
      {items.map((it, i) => {
        const cg = g[i], at = it.at ?? (p.button ? genAt : shot.start + 0.3 + i * 0.1);
        if (t < at) return null;
        const chosen = cur ? (cur.index === i ? lit(t, cur.at) : 0) : 0;
        const dim = cur && cur.index !== i ? lit(t, cur.at) : 0;
        const playFrom = sel.find((x) => x.index === i)?.at ?? at;
        return (
          <div key={i} style={{position: 'absolute', left: cg.x, top: cg.y, width: cg.w, ...rise(t, at, 28), opacity: (rise(t, at, 28).opacity as number) * (1 - 0.55 * dim)}}>
            <div style={{position: 'relative', width: cg.w, height: cg.h, borderRadius: 26, overflow: 'hidden', background: '#fff',
              boxShadow: `0 0 0 ${2 + 4 * chosen}px ${mix(UI.line, C.voice, chosen)}, 0 12px 28px rgba(16,36,58,0.10)`}}>
              {it.kind === 'flow' ? <Flow steps={it.steps} t={t} stepAt={it.stepAt} /> : it.kind === 'video' ? (
                t < playFrom && it.poster ? <Img src={staticFile(assetPath(ep, it.poster))} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : (
                  <Sequence from={Math.round(playFrom * 30)} layout="none"><Media src={assetPath(ep, it.src)} kind="video" fit="cover" /></Sequence>
                )
              ) : <Media src={assetPath(ep, it.src)} kind="image" fit="cover" />}
            </div>
            <div style={{marginTop: 14}}><Tag>{it.tag}</Tag></div>
          </div>
        );
      })}
    </>
  );
};

export const Gallery: AppTemplate = {
  Page,
  anchors: (shot) => shot.props.layout === 'hero' ? heroAnchors(shot) : Object.fromEntries(cardGeom(shot.props.items.length).map((c, i) => ['item:' + i, {rect: [c.x, c.y, c.w, c.h], r: 26, bg: '#FFFFFF'}])),
  acts: (shot) => {
    if (shot.props.layout === 'hero') return heroActs(shot);
    const p = shot.props, a: any[] = [];
    if (p.button) a.push({at: p.button.at, x: PAD + CW - 14 - 100, y: BAR_Y + 12 + 46, kind: 'click'});
    if (p.chips && p.select) {
      const cg = chipGeom(p.chips);
      for (const s of p.select) a.push({at: s.at - 0.05, x: cg[s.index].x + cg[s.index].w / 2 + 10, y: BAR_Y + 46, kind: 'click'});
    }
    return a;
  },
  focus: (shot) => {
    if (shot.props.layout === 'hero') return heroFocus(shot);
    const p = shot.props, g = cardGeom(p.items.length), f: any[] = [{at: shot.start, rect: null}];
    for (const s of p.select ?? []) { const c = g[s.index]; f.push({at: s.at + 0.1, rect: [c.x - 30, BAR_Y - 20, c.w + 60, c.y + c.h + 90 - (BAR_Y - 20)], scale: 1.12}); }
    if (p.button) f.push({at: p.button.at + 0.3, rect: [PAD, GRID_Y, CW, 720], scale: 1.1});
    return f;
  },
};
