// 模板 evidence · 真实页面 + 圈重点
// 真实截图慢推，说到关键句时手绘圈出来；下面放原文摘录或要点标签。
// props: {
//   image: 'page.png', size: [w, h],          // 截图及其像素尺寸
//   source: {label: 'GitHub 实际页面', name: 'owner / repo', logo?: '/logos/x.svg'},
//   focus?: {x, y, w, h, at},                     // 要圈的区域（截图像素坐标）
//   quote?: {text, at},                           // 原文摘录（放大重排）
//   tags?: [{text, at}]                           // 要点标签
// }
import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, G, T} from '../kit/tokens';
import {Card, Tile, Sketch, Tag} from '../kit/components';
import {rise, draw, push} from '../kit/motion';
import {TemplateProps} from './types';
import {assetPath} from '../kit/types';

export const Evidence: React.FC<TemplateProps> = ({t, shot, ep}) => {
  const p = shot.props;
  const [iw, ih] = p.size;
  const s = G.width / iw, cardTop = G.contentTop + 170;
  const hasBelow = p.quote || p.tags;
  const cardH = Math.min(ih * s, (hasBelow ? 1150 : 1300) - cardTop);
  const f = p.focus;
  const fcy = f ? (f.y + f.h / 2) * s : cardH / 2;
  const offY = Math.max(0, Math.min(ih * s - cardH, fcy - cardH / 2));
  const k = push(t, shot.start, shot.end + 0.3, 0.05);
  const ox = f ? (f.x + f.w / 2) * s : G.width / 2, oy = fcy - offY;
  return (
    <>
      <div style={{position: 'absolute', left: G.left, top: G.contentTop, display: 'flex', alignItems: 'center', gap: 26, ...rise(t, shot.start + 0.1)}}>
        {p.source.logo ? <Tile size={112} src={assetPath(ep, p.source.logo)} pad={p.source.pad ?? 0.14} /> : null}
        <div>
          <div style={{...T.caption, color: C.secondary}}>{p.source.label}</div>
          <div style={{...T.body, fontWeight: 600, color: C.ink}}>{p.source.name}</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: G.left, top: cardTop, width: G.width, ...rise(t, shot.start + 0.2)}}>
        <Card style={{height: cardH, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: -offY, width: iw * s, height: ih * s, transformOrigin: `${ox}px ${oy + offY}px`, transform: `scale(${k})`}}>
            <Img src={staticFile(assetPath(ep, p.image))} style={{width: iw * s, height: ih * s, display: 'block'}} />
            {f ? (() => {
              const ew = Math.min(f.w * s + 70, iw * s - 24), ecx = Math.max(12 + ew / 2, Math.min(iw * s - 12 - ew / 2, (f.x + f.w / 2) * s));
              return <Sketch shape={{kind: 'ellipse', cx: ecx, cy: (f.y + f.h / 2) * s, w: ew, h: f.h * s + 46}} p={draw(t, f.at, 0.7)} color={C.voice} seed={9} w={iw * s} h={ih * s} />;
            })() : null}
          </div>
        </Card>
      </div>
      {p.quote ? (
        <div style={{position: 'absolute', left: G.left, top: cardTop + cardH + 34, width: G.width, ...rise(t, p.quote.at)}}>
          <div style={{...T.body, fontWeight: 600, color: C.ink}}>「{p.quote.text}」</div>
        </div>
      ) : null}
      {p.tags ? (
        <div style={{position: 'absolute', left: G.left, top: cardTop + cardH + (p.quote ? 104 : 34), display: 'flex', gap: 14, flexWrap: 'wrap', width: G.width}}>
          {p.tags.map((g: any) => <div key={g.text} style={rise(t, g.at)}><Tag tone="voice">{g.text}</Tag></div>)}
        </div>
      ) : null}
    </>
  );
};
