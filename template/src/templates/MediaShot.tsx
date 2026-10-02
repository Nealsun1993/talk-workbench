// 模板 media · 成果 / 样图 / 动画片段
// 1–2 个素材（图片或视频），每个都必须带真实性标签（作者示例 / 既有成片 / 自制示意 / 实测）。
// props: {
//   items: [{src, tag, at?, size?: [w, h], ratio?}],  // size=原始尺寸；ratio=显示高宽比（居中裁切）
//   layout?: 'single' | 'pair',                     // pair：两张并排，第二张下沉
//   side?: {logo?, name, sub, list?: [{icon, label, at}], done?: {text, at}},   // single 时右侧说明栏
//   caption?: {text, at}                            // 下方一句话
// }
import React from 'react';
import {Sequence} from 'remotion';
import {C, G, T} from '../kit/tokens';
import {Card, Icon, Media, Tag, Tile} from '../kit/components';
import {rise, pop, push} from '../kit/motion';
import {TemplateProps} from './types';
import {assetPath} from '../kit/types';

const ratioOf = (it: any) => it.ratio ?? (it.size ? it.size[1] / it.size[0] : 16 / 9); // ratio = 显示高宽比（裁切）

export const MediaShot: React.FC<TemplateProps> = ({t, shot, ep}) => {
  const p = shot.props;
  const items = p.items as any[];
  const layout = p.layout ?? (items.length > 1 ? 'pair' : 'single');
  const bottom = p.caption ? 1180 : 1290;
  const box = (it: any, i: number, x: number, w: number, y: number, maxH: number) => {
    const h = Math.min(maxH, w * ratioOf(it));
    const at = it.at ?? shot.start + 0.15 + i * 0.15;
    const k = push(t, at, shot.end + 0.3, 0.03);
    return (
      <div key={it.src} style={{position: 'absolute', left: x, top: y, width: w, ...rise(t, at, 28)}}>
        <Card style={{height: h, overflow: 'hidden'}}>
          <Sequence from={Math.round(at * 30)} layout="none">
            <Media src={assetPath(ep, it.src)} kind={it.kind} fit={it.fit ?? 'cover'} style={{transform: `scale(${k})`}} />
          </Sequence>
        </Card>
        <div style={{marginTop: 16}}><Tag>{it.tag}</Tag></div>
      </div>
    );
  };
  const top = G.contentTop;
  let body: React.ReactNode;
  if (layout === 'pair') {
    const w = (G.width - 24) / 2;
    const maxH = bottom - top - 70 - 60;
    body = items.slice(0, 2).map((it, i) => box(it, i, G.left + i * (w + 24), w, top + i * 60, maxH));
  } else if (p.side) {
    const w = 450, maxH = bottom - top - 70;
    const sx = G.left + w + 44, s = p.side;
    body = (
      <>
        {box(items[0], 0, G.left, w, top, maxH)}
        <div style={{position: 'absolute', left: sx, top, ...rise(t, shot.start + 0.25)}}>
          {s.logo ? <Tile size={120} src={assetPath(ep, s.logo)} pad={0.16} /> : null}
          <div style={{...T.heading, color: C.ink, marginTop: 26}}>{s.name}</div>
          {s.sub ? <div style={{...T.caption, color: C.secondary, marginTop: 4}}>{s.sub}</div> : null}
        </div>
        {(s.list ?? []).map((it: any, i: number) => (
          <div key={it.label} style={{position: 'absolute', left: sx, top: top + 330 + i * 92, display: 'flex', alignItems: 'center', gap: 18, ...rise(t, it.at)}}>
            <Icon name={it.icon} size={46} color={C.ink} />
            <div style={{...T.body, color: C.ink}}>{it.label}</div>
          </div>
        ))}
        {s.done ? (
          <div style={{position: 'absolute', left: sx, top: top + 330 + (s.list?.length ?? 0) * 92 + 40, display: 'flex', alignItems: 'center', gap: 18, ...rise(t, s.done.at)}}>
            <div style={{width: 72, height: 72, borderRadius: 18, background: C.voice, display: 'flex', alignItems: 'center', justifyContent: 'center', ...pop(t, s.done.at + 0.05)}}><Icon name="check" size={42} color="#fff" /></div>
            <div style={{...T.body, fontWeight: 600, color: C.ink}}>{s.done.text}</div>
          </div>
        ) : null}
      </>
    );
  } else {
    const it = items[0];
    const maxH = bottom - top - 70;
    const w = Math.min(G.width, maxH / ratioOf(it));
    body = box(it, 0, G.left + (G.width - w) / 2, w, top, maxH);
  }
  return (
    <>
      {body}
      {p.caption ? <div style={{position: 'absolute', left: G.left, top: 1216, width: G.width, ...T.heading, color: C.ink, ...rise(t, p.caption.at)}}>{p.caption.text}</div> : null}
    </>
  );
};
