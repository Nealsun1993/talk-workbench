// app.gallery 的 hero 版式（v5.1）：一张 16:9 大图 + 下方缩略图（+ 可选分类标签）
// 适合横版样例（文章配图、讲解页、白板图）。说到哪张，光标点哪张缩略图，它从缩略图的位置长成大图。
// props（layout: 'hero'）: {
//   title, sub, chips?: string[],
//   items: [{kind: 'image'|'spread'|'flow'|'board'|'text', tag, chip?,
//            src?, fit?,            // image
//            srcs?,                 // spread：几张竖图并排（漫画页、图文卡）
//            steps?: [{text, at}],  // flow / board：步骤依次出现（board = 白板手绘，自制示意）
//            text?}],               // text：一段文字（和图对比用）
//   select?: [{index, at}],         // 依次切到第几项（没有就停在第 0 项）
//   zoom?: [{at, rect: [x, y, w, h], scale?, until?}]  // 相机推近大图的某一块（0–1 相对坐标），until 拉回
// }
import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, T} from '../../kit/tokens';
import {Tag, Sketch, textWidth, Icon} from '../../kit/components';
import {rise, snap, lit, mix, morphEase, clamp01, lerp, draw, springIn} from '../../kit/motion';
import {assetPath} from '../../kit/types';
import {PageProps} from '../types';
import {PAD, CW} from '../geom';
import {PageTitle, UI, pressScale} from '../ui';

type R4 = [number, number, number, number];
const HERO_H = Math.round((CW * 9) / 16), MORPH = 0.45;
const THUMB_H = Math.round(((CW - 16 * 3) / 4) * 9 / 16);
/** 标签 + 大图 + 缩略图整体在标题下方的空间里居中 */
export const heroGeom = (p: any) => {
  const block = (p.chips ? 96 : 0) + HERO_H + 26 + THUMB_H;
  const top = Math.round(340 + (1170 - 340 - block) / 2);
  const chipY = top, heroY = top + (p.chips ? 96 : 0);
  const hero: R4 = [PAD, heroY, CW, HERO_H];
  return {hero, chipY, thumbY: heroY + HERO_H + 26};
};
const hasThumb = (it: any) => it.kind === 'image' || it.kind === 'spread';
const chipOf = (it: any) => it.chip ?? 0;
export const chipGeom = (chips: string[]) => { let x = PAD; return chips.map((c) => { const w = textWidth(c, 32) + 56; const g = {x, w}; x += w + 12; return g; }); };
/** 某一时刻：当前项、它的分类、同分类的缩略图 */
export const heroState = (p: any, t: number) => {
  const sel: any[] = p.select ?? [];
  const i = sel.filter((s) => t >= s.at).length - 1;
  const cur = i >= 0 ? sel[i] : null;
  const index = cur ? cur.index : 0;
  const chip = chipOf(p.items[index]);
  const thumbs = p.items.map((it: any, k: number) => ({it, k})).filter(({it}: any) => hasThumb(it) && (!p.chips || chipOf(it) === chip));
  return {cur, prev: i > 0 ? sel[i - 1] : null, index, chip, thumbs};
};
export const thumbGeom = (p: any, n: number, k: number): R4 => {
  const {thumbY} = heroGeom(p), m = Math.max(n, 4), gap = 16, w = (CW - gap * (m - 1)) / m;
  return [PAD + k * (w + gap), thumbY, w, (w * 9) / 16];
};

const Content: React.FC<{it: any; t: number; ep: any; w: number; h: number}> = ({it, t, ep, w, h}) => {
  if (it.kind === 'image') return <Img src={staticFile(assetPath(ep, it.src))} style={{width: '100%', height: '100%', objectFit: it.fit ?? 'contain', background: '#fff'}} />;
  if (it.kind === 'spread') return (
    <div style={{display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', background: UI.well, padding: 14, boxSizing: 'border-box'}}>
      {it.srcs.map((s: string) => <Img key={s} src={staticFile(assetPath(ep, s))} style={{height: '100%', maxWidth: `${100 / it.srcs.length}%`, objectFit: 'contain', borderRadius: 12, boxShadow: '0 6px 16px rgba(16,36,58,0.12)'}} />)}
    </div>
  );
  if (it.kind === 'text') return (
    <div style={{width: '100%', height: '100%', background: '#fff', padding: '46px 52px', boxSizing: 'border-box'}}>
      <div style={{...T.body, fontSize: 44, fontWeight: 600, color: C.ink, lineHeight: 1.35}}>{it.text}</div>
      {[0.92, 0.97, 0.88, 0.95, 0.7].map((f, i) => <div key={i} style={{marginTop: i ? 18 : 34, height: 22, width: `${f * 100}%`, borderRadius: 11, background: UI.track}} />)}
    </div>
  );
  const steps: any[] = it.steps ?? [];
  const n = steps.length, gap = 48, bw = (w - 80 - gap * (n - 1)) / n, bh = 150, by = (h - bh) / 2;
  if (it.kind === 'flow') return (
    <div style={{position: 'relative', width: '100%', height: '100%', background: '#fff'}}>
      {steps.map((s, i) => {
        const on = snap(t, s.at), last = steps.filter((x) => t >= x.at).length - 1 === i;
        const x = 40 + i * (bw + gap);
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: x, top: by, width: bw, height: bh, borderRadius: 24, background: mix(UI.well, last ? C.voiceSoft : UI.well, on), boxShadow: `inset 0 0 0 ${last ? 3 * on : 0}px ${C.voice}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 8px', boxSizing: 'border-box', ...T.body, fontSize: 34, fontWeight: 600, color: C.ink,
              opacity: 0.25 + 0.75 * on, transform: `scale(${0.96 + 0.04 * on})`}}>{s.text}</div>
            {i < n - 1 ? <div style={{position: 'absolute', left: x + bw + 6, top: by + bh / 2 - 18, opacity: snap(t, steps[i + 1].at)}}><Icon name="arrow-right" size={36} color={C.secondary} /></div> : null}
          </React.Fragment>
        );
      })}
    </div>
  );
  // board：白板手绘（自制示意）——马克笔框、箭头依次画出来，当前这一步用蓝色
  return (
    <div style={{position: 'relative', width: '100%', height: '100%', background: '#FCFCFA', boxShadow: 'inset 0 0 0 10px #E9ECF0'}}>
      {steps.map((s, i) => {
        const x = 40 + i * (bw + gap), p = draw(t, s.at, 0.55);
        const cur = steps.filter((q) => t >= q.at).length - 1 === i;
        const col = cur ? C.voice : '#1D232B';
        return (
          <React.Fragment key={i}>
            <Sketch shape={{kind: 'rect', x, y: by, w: bw, h: bh, r: 22}} p={p} color={col} width={5} seed={31 + i} w={w} h={h} />
            <div style={{position: 'absolute', left: x, top: by, width: bw, height: bh, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 12px', boxSizing: 'border-box',
              ...T.body, fontSize: 34, fontWeight: 600, color: col, opacity: clamp01((t - s.at - 0.25) / 0.2)}}>{s.text}</div>
            {i < n - 1 ? <Sketch shape={{kind: 'line', x1: x + bw + 10, y1: by + bh / 2, x2: x + bw + gap - 10, y2: by + bh / 2}} arrow p={draw(t, steps[i + 1].at - 0.3, 0.3)} color="#1D232B" width={5} seed={51 + i} w={w} h={h} /> : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const HeroPage: React.FC<PageProps> = ({t, shot, ep}) => {
  const p = shot.props, {hero} = heroGeom(p);
  const st = heroState(p, t);
  const it = p.items[st.index];
  // 切换：新项从它的缩略图位置长成大图；没有缩略图就原地淡入
  let R: R4 = hero, e = 1;
  if (st.cur && t < st.cur.at + MORPH) {
    e = morphEase(clamp01((t - st.cur.at) / MORPH));
    const k = st.thumbs.findIndex((x: any) => x.k === st.index);
    const from: R4 = k >= 0 ? thumbGeom(p, st.thumbs.length, k) : [hero[0] + 40, hero[1] + 30, hero[2] - 80, hero[3] - 60];
    R = from.map((v, j) => lerp(v, hero[j], e)) as R4;
  }
  const prevIt = st.cur && e < 1 ? p.items[st.prev ? st.prev.index : 0] : null;
  const card = (item: any, r: R4, key: string, op = 1) => (
    <div key={key} style={{position: 'absolute', left: r[0], top: r[1], width: r[2], height: r[3], borderRadius: 26, overflow: 'hidden', background: '#fff', opacity: op,
      boxShadow: `0 0 0 2px ${UI.line}, 0 16px 36px rgba(16,36,58,0.12)`}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: hero[2], height: hero[3], transformOrigin: '0 0', transform: `scale(${r[2] / hero[2]}, ${r[3] / hero[3]})`}}>
        <Content it={item} t={t} ep={ep} w={hero[2]} h={hero[3]} />
      </div>
    </div>
  );
  const heroIn = rise(t, shot.start + 0.2, 24);
  return (
    <>
      <PageTitle t={t} at={shot.start + 0.1} title={p.title} sub={p.sub} />
      {p.chips ? (p.chips as string[]).map((c, i) => {
        const on = i === st.chip ? (st.cur && st.prev && chipOf(p.items[st.prev.index]) !== i ? snap(t, st.cur.at) : 1) : 0;
        const g = chipGeom(p.chips)[i];
        return <div key={c} style={{position: 'absolute', left: g.x, top: heroGeom(p).chipY, width: g.w, height: 72, borderRadius: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: mix(UI.track, C.voice, on), color: mix(C.ink, '#FFFFFF', on), ...T.caption, fontWeight: 600, ...rise(t, shot.start + 0.16 + i * 0.04)}}>{c}</div>;
      }) : null}
      <div style={{position: 'absolute', inset: 0, ...heroIn}}>
        {prevIt ? card(prevIt, hero, 'prev', 1) : null}
        {card(it, R, 'cur', st.cur && !st.thumbs.some((x: any) => x.k === st.index) ? clamp01(e * 1.6) : 1)}
        <div style={{position: 'absolute', left: hero[0] + 18, top: hero[1] + hero[3] - 66, opacity: e}}><Tag>{it.tag}</Tag></div>
      </div>
      {st.thumbs.map(({it: th, k}: any, j: number) => {
        const g = thumbGeom(p, st.thumbs.length, j), on = k === st.index ? 1 : 0;
        return (
          <div key={`${st.chip}-${k}`} style={{position: 'absolute', left: g[0], top: g[1], width: g[2], height: g[3], borderRadius: 16, overflow: 'hidden', background: '#fff',
            boxShadow: `0 0 0 ${on ? 4 : 2}px ${on ? C.voice : UI.line}`, opacity: on ? 1 : 0.72, ...rise(t, Math.max(shot.start + 0.3, (st.cur?.at ?? 0) - 0.3) + j * 0.05, 14),
            transform: `scale(${pressScale(t, st.cur && st.cur.index === k ? st.cur.at - 0.05 : undefined)})`}}>
            <Img src={staticFile(assetPath(ep, th.kind === 'spread' ? th.srcs[0] : th.src))} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        );
      })}
    </>
  );
};

export const heroAnchors = (shot: any) => {
  const p = shot.props, {hero} = heroGeom(p);
  return {hero: {rect: hero, r: 26, bg: '#FFFFFF'}};
};
export const heroActs = (shot: any) => {
  const p = shot.props, a: any[] = [];
  let prevChip = chipOf(p.items[0]);
  for (const s of p.select ?? []) {
    const it = p.items[s.index], chip = chipOf(it);
    if (p.chips && chip !== prevChip) { const g = chipGeom(p.chips)[chip]; a.push({at: s.at - 0.08, x: g.x + g.w / 2 + 10, y: heroGeom(p).chipY + 46, kind: 'click'}); }
    else if (hasThumb(it)) {
      const st = heroState(p, s.at + 0.01), j = st.thumbs.findIndex((x: any) => x.k === s.index), g = thumbGeom(p, st.thumbs.length, j);
      a.push({at: s.at - 0.08, x: g[0] + g[2] / 2 + 10, y: g[1] + g[3] / 2 + 8, kind: 'click'});
    }
    prevChip = chip;
  }
  return a;
};
export const heroFocus = (shot: any) => {
  const p = shot.props, {hero} = heroGeom(p), f: any[] = [{at: shot.start, rect: null}];
  for (const z of p.zoom ?? []) {
    const [x, y, w, h] = z.rect;
    f.push({at: z.at, rect: [hero[0] + x * hero[2], hero[1] + y * hero[3], w * hero[2], h * hero[3]], scale: z.scale ?? 1.3});
    if (z.until) f.push({at: z.until, rect: null});
  }
  return f;
};
