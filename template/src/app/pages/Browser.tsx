// 页面 app.browser · 真实页面 + 聚光 + 原文放大
// 在示意 App 的内置浏览器里放真实截图；说到关键句时压暗其余部分、框出这一句，
// 然后这个框「抬起来」变成一张原文卡片（真实原文按界面文字重排，放多大都清楚），相机跟过去。
// props: {
//   name, source: '…· GitHub 实际页面', logo?, url,
//   image, size: [w, h],                       // 截图像素尺寸（宽 848 时 1:1 最清晰）
//   focus: {x, y, w, h, at, text?, label?},    // 截图像素坐标；text = 这句话的原文（照抄，不改写）
//   tags?: [{text, at}]                        // 可选：下方列出要点
// }
// 可读性：配音念到的字，在画面上 ≥ 32px（字号 × 相机倍数）。截图里的小字靠 focus.text 重排解决，不靠硬放大。
import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, T} from '../../kit/tokens';
import {Tile, Tag, textWidth} from '../../kit/components';
import {rise, smooth, morphEase, clamp01, lerp} from '../../kit/motion';
import {assetPath} from '../../kit/types';
import {AppTemplate, PageProps} from '../types';
import {PAD, CW} from '../geom';
import {Mono, Spotlight, UI} from '../ui';

const PANE_Y = 340, BAR = 68;
const shortUrl = (u: string) => {
  const parts = u.replace(/^https?:\/\//, '').split('/');
  return parts.length > 2 ? `${parts[0]}/…/${parts[parts.length - 1]}` : parts.join('/');
};
const imgGeom = (p: any) => {
  const [iw, ih] = p.size, s = CW / iw;
  const maxH = 700, h = Math.min(ih * s, maxH);
  const f = p.focus, fcy = f ? (f.y + f.h / 2) * s : h / 2;
  const off = Math.max(0, Math.min(ih * s - h, fcy - h / 2));
  return {s, h, off, top: PANE_Y + BAR};
};

type R4 = [number, number, number, number];
const QFS = 38, LIFT = 0.45, LIFT_DUR = 0.5;
/** 聚光框（窗口坐标）与原文卡片的位置 */
const quoteGeom = (p: any) => {
  const g = imgGeom(p), f = p.focus;
  const S: R4 = [PAD + f.x * g.s - 10, g.top + f.y * g.s - g.off - 8, f.w * g.s + 20, f.h * g.s + 16];
  if (!f.text) return {S, Q: null as R4 | null};
  const lines = Math.ceil(textWidth(f.text, QFS) / (CW - 72));
  const qh = 28 + 44 + lines * QFS * 1.42 + 28;
  const below = S[1] + S[3] + 28;
  const Q: R4 = [PAD, below + qh <= 1190 ? below : S[1] - qh - 28, CW, qh];
  return {S, Q};
};

const Page: React.FC<PageProps> = ({t, shot, ep}) => {
  const p = shot.props, g = imgGeom(p), f = p.focus;
  const sp = f ? smooth(t, f.at, 0.4) : 0;
  const rect: [number, number, number, number] | null = f ? [f.x * g.s - 10, f.y * g.s - g.off - 8, f.w * g.s + 20, f.h * g.s + 16] : null;
  const qg = f ? quoteGeom(p) : null;
  let quote: React.ReactNode = null;
  if (qg?.Q && t >= f.at + LIFT) {
    // 承接：聚光框抬起来，长成原文卡片
    const e = morphEase(clamp01((t - f.at - LIFT) / LIFT_DUR));
    const R = qg.S.map((v, i) => lerp(v, qg.Q![i], e));
    quote = (
      <div style={{position: 'absolute', left: R[0], top: R[1], width: R[2], height: R[3], borderRadius: lerp(12, 24, e), background: '#fff',
        boxShadow: `inset 0 0 0 3px ${C.voice}, 0 ${lerp(4, 22, e)}px ${lerp(10, 44, e)}px rgba(16,36,58,${lerp(0.1, 0.22, e)})`, overflow: 'hidden'}}>
        <div style={{padding: '28px 36px', opacity: clamp01((e - 0.55) / 0.4)}}>
          <div style={{...T.caption, fontWeight: 600, color: C.voice}}>{f.label ?? '原文'}</div>
          <div style={{...T.body, fontSize: QFS, fontWeight: 600, color: C.ink, lineHeight: 1.42, marginTop: 8}}>{f.text}</div>
        </div>
      </div>
    );
  }
  return (
    <>
      <div style={{position: 'absolute', left: PAD, top: 214, display: 'flex', alignItems: 'center', gap: 22, ...rise(t, shot.start + 0.1)}}>
        {p.logo ? <Tile size={84} src={assetPath(ep, p.logo)} pad={p.pad ?? 0.14} /> : null}
        <div>
          <div style={{...T.heading, fontSize: 48, color: C.ink, lineHeight: 1.1}}>{p.name}</div>
          <div style={{...T.caption, color: C.secondary}}>{p.source}</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: PAD, top: PANE_Y, width: CW, height: BAR + g.h, borderRadius: 28, overflow: 'hidden', boxShadow: `inset 0 0 0 2px ${UI.line}`, background: '#fff', ...rise(t, shot.start + 0.18)}}>
        <div style={{height: BAR, background: UI.well, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: `2px solid ${UI.line}`}}>
          <div style={{flex: 1, height: 48, borderRadius: 24, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 20px', overflow: 'hidden', whiteSpace: 'nowrap'}}>
            <Mono style={{color: C.secondary}}>{shortUrl(p.url)}</Mono>
          </div>
        </div>
        <div style={{position: 'relative', height: g.h, overflow: 'hidden'}}>
          <Img src={staticFile(assetPath(ep, p.image))} style={{position: 'absolute', left: 0, top: -g.off, width: CW, display: 'block'}} />
          {rect ? <Spotlight w={CW} h={g.h} rect={rect} p={sp} /> : null}
        </div>
      </div>
      {quote}
      {p.tags ? (
        <div style={{position: 'absolute', left: PAD, top: PANE_Y + BAR + g.h + 36, display: 'flex', gap: 14, flexWrap: 'wrap', width: CW}}>
          {p.tags.map((x: any) => <div key={x.text} style={rise(t, x.at)}><Tag tone="voice">{x.text}</Tag></div>)}
        </div>
      ) : null}
    </>
  );
};

export const Browser: AppTemplate = {
  Page,
  anchors: (shot) => {
    const p = shot.props, g = imgGeom(p), a: any = {pane: {rect: [PAD, PANE_Y, CW, BAR + g.h], r: 28, bg: '#FFFFFF'}};
    const q = p.focus ? quoteGeom(p) : null;
    if (q?.Q) a.quote = {rect: q.Q, r: 24, bg: '#FFFFFF'};
    return a;
  },
  acts: (shot) => {
    const p = shot.props, g = imgGeom(p), f = p.focus;
    if (!f) return [];
    // 光标像读者一样滑过这句话
    const y = g.top + (f.y + f.h) * g.s - g.off + 14;
    return [{at: f.at - 0.35, x: PAD + f.x * g.s, y, kind: 'hover'}, {at: f.at + 0.5, x: PAD + Math.min(CW - 40, (f.x + f.w) * g.s), y, kind: 'hover'}];
  },
  focus: (shot) => {
    const p = shot.props, g = imgGeom(p), f = p.focus;
    const out: any[] = [{at: shot.start, rect: null}];
    if (f) {
      const cx = PAD + (f.x + f.w / 2) * g.s, cy = g.top + (f.y + f.h / 2) * g.s - g.off;
      const fw = f.w * g.s + 40;
      const scale = Math.max(1.1, Math.min(1.3, 1000 / fw));
      out.push({at: f.at - 0.25, rect: [cx - fw / 2, cy - 150, fw, 300], scale});
      const q = quoteGeom(p);
      if (q.Q) out.push({at: f.at + LIFT + 0.1, rect: [q.Q[0] - 20, q.S[1] - 30, q.Q[2] + 40, q.Q[1] + q.Q[3] + 30 - (q.S[1] - 30)], scale: 1.16});
      if (p.tags?.length) out.push({at: p.tags[0].at - 0.3, rect: null});
      else if (!q.Q) out.push({at: f.at + 1.4, rect: null});
    }
    return out;
  },
};
