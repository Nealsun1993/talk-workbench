// 模板 steps · 步骤 / 检查项 / 流程
// 一张分组列表卡，说到哪一步点亮哪一步；步骤之间用手绘线连起来；可选总结行。
// props: {
//   items: [{name, icon, at, desc?}],   // 2–5 步
//   summary?: {text, sub?, logo?, icon?, at}
// }
import React from 'react';
import {C, G, T} from '../kit/tokens';
import {Card, Icon, Tile, Sketch} from '../kit/components';
import {rise, lit, draw, mix, pop} from '../kit/motion';
import {TemplateProps} from './types';
import {assetPath} from '../kit/types';

export const Steps: React.FC<TemplateProps> = ({t, shot, ep}) => {
  const {items, summary} = shot.props;
  const n = items.length, hasDesc = items.some((x: any) => x.desc);
  const rowH = hasDesc ? 170 : n > 4 ? 132 : 150, tile = 92;
  const top = G.contentTop + 10, cx = G.left + 36 + tile / 2;
  return (
    <>
      <div style={{position: 'absolute', left: G.left, top, width: G.width, ...rise(t, shot.start + 0.1)}}>
        <Card style={{height: rowH * n}}>
          {items.map((it: any, i: number) => {
            const on = lit(t, it.at);
            return (
              <div key={it.name} style={{position: 'absolute', left: 0, top: i * rowH, width: G.width, height: rowH, display: 'flex', alignItems: 'center'}}>
                <div style={{marginLeft: 36, ...(t >= it.at ? pop(t, it.at) : {})}}>
                  <div style={{width: tile, height: tile, borderRadius: tile * 0.24, background: mix(C.voiceSoft, C.voice, on), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <Icon name={it.icon} size={52} color={mix(C.voice, '#FFFFFF', on)} />
                  </div>
                </div>
                <div style={{marginLeft: 30}}>
                  <div style={{...T.heading, fontSize: hasDesc ? 48 : 52, color: mix(C.secondary, C.ink, on)}}>{it.name}</div>
                  {it.desc ? <div style={{...T.caption, color: C.secondary, marginTop: 4, opacity: 0.4 + 0.6 * on}}>{it.desc}</div> : null}
                </div>
                {i < n - 1 ? <div style={{position: 'absolute', left: 36 + tile + 30, right: 0, bottom: 0, height: 1.5, background: C.hairline}} /> : null}
              </div>
            );
          })}
        </Card>
      </div>
      {items.slice(1).map((it: any, i: number) => {
        const y1 = top + i * rowH + (rowH + tile) / 2 + 8, y2 = top + (i + 1) * rowH + (rowH - tile) / 2 - 8;
        return <Sketch key={i} shape={{kind: 'line', x1: cx, y1, x2: cx + 2, y2}} p={draw(t, it.at - 0.3, 0.3)} color={C.voice} width={6} seed={20 + i} />;
      })}
      {summary ? (
        <div style={{position: 'absolute', left: G.left, top: top + rowH * n + 36, width: G.width, ...rise(t, summary.at)}}>
          <Card style={{height: 140, display: 'flex', alignItems: 'center', gap: 26, padding: '0 36px'}}>
            {summary.logo ? <Tile size={84} src={assetPath(ep, summary.logo)} /> : <Tile size={84} icon={summary.icon ?? 'check'} bg={C.voice} />}
            <div>
              <div style={{...T.body, fontWeight: 600, color: C.ink}}>{summary.text}</div>
              {summary.sub ? <div style={{...T.caption, color: C.secondary}}>{summary.sub}</div> : null}
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
};
