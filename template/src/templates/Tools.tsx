// 模板 tools · 工具清单
// 2–4 个工具依次点名；可选「串联者」（如 Codex）用手绘框把它们圈在一起。
// props: {
//   items: [{name, role, logo?: '/logos/x.svg', icon?: 'paint-brush-broad', at}],
//   link?: {name, role, icon?: 'terminal-window', logo?, at}
// }
import React from 'react';
import {C, G, T} from '../kit/tokens';
import {Card, Tile, Sketch} from '../kit/components';
import {rise, lit, draw, pop} from '../kit/motion';
import {TemplateProps} from './types';
import {assetPath} from '../kit/types';

export const Tools: React.FC<TemplateProps> = ({t, shot, ep}) => {
  const {items, link} = shot.props;
  const n = items.length, rowH = n > 3 ? 150 : 168, gap = 22;
  const top = G.contentTop + 28, x = G.left + 30, w = G.width - 60;
  const ends = items.map((_: any, i: number) => (i < n - 1 ? items[i + 1].at : link ? link.at : shot.end));
  const listBottom = top + n * (rowH + gap) - gap;
  const linkY = listBottom + 44;
  const frameP = link ? draw(t, link.at, 0.9) : 0;
  return (
    <>
      {items.map((it: any, i: number) => {
        const on = lit(t, it.at), focus = t >= it.at && t < ends[i];
        return (
          <div key={it.name} style={{position: 'absolute', left: x, top: top + i * (rowH + gap), width: w, ...rise(t, shot.start + 0.1 + i * 0.06)}}>
            <Card style={{height: rowH, display: 'flex', alignItems: 'center', gap: 30, padding: '0 30px', opacity: 0.5 + 0.5 * on}}>
              <div style={{...pop(t, it.at), opacity: on}}>
                {it.logo ? <Tile size={108} src={assetPath(ep, it.logo)} pad={it.pad ?? 0.14} /> : <Tile size={108} icon={it.icon} bg={C.voice} />}
              </div>
              <div style={{opacity: on, transform: `translateY(${(1 - on) * 10}px)`}}>
                <div style={{...T.heading, color: C.ink}}>{it.name}</div>
                <div style={{...T.caption, color: focus ? C.voice : C.secondary, marginTop: 4}}>{it.role}</div>
              </div>
            </Card>
          </div>
        );
      })}
      {link ? (
        <>
          <Sketch shape={{kind: 'rect', x: G.left, y: top - 26, w: G.width, h: linkY + 150 - (top - 26), r: 56}} p={frameP} color={C.voice} seed={5} />
          <div style={{position: 'absolute', left: x + 30, top: linkY, display: 'flex', alignItems: 'center', gap: 30, ...rise(t, link.at + 0.3)}}>
            {link.logo ? <Tile size={108} src={assetPath(ep, link.logo)} /> : <Tile size={108} icon={link.icon ?? 'terminal-window'} bg={C.ink} />}
            <div>
              <div style={{...T.heading, color: C.ink}}>{link.name}</div>
              <div style={{...T.caption, color: C.voice, marginTop: 4}}>{link.role}</div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};
