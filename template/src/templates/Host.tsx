// 模板 host · 开场 / 痛点
// 角色片段 + 两行大标题 + 手绘下划线（问题用橙、重点用蓝）。
// props: {
//   kicker: string,                 // 小标题，如「频道名 · 本期主题」
//   title: [string, string],        // 两行大标题
//   mark?: {line: 0|1, word: string, tone: 'problem'|'voice', at: number},  // 手绘下划线
//   clip: string, still?: string,   // Omni 片段（白底），首帧图可选
//   box?: [left, top, width],       // 片段在画面中的位置，默认 [97, 76, 886]
// }
import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C, G, T} from '../kit/tokens';
import {Media, Sketch, textWidth} from '../kit/components';
import {rise, draw} from '../kit/motion';
import {TemplateProps} from './types';
import {assetPath} from '../kit/types';

export const hostBox = (props: any) => {
  const [left, top, width] = props.box ?? [97, 76, 886];
  return {left, top, width, height: (width * 16) / 9};
};

export const Host: React.FC<TemplateProps> = ({t, shot, ep}) => {
  const p = shot.props, b = hostBox(p);
  const titleTop = G.headerTop + 50, lh = T.display.fontSize * T.display.lineHeight;
  let mark: React.ReactNode = null;
  if (p.mark) {
    const line: string = p.title[p.mark.line];
    const i = line.indexOf(p.mark.word);
    const x0 = G.left + textWidth(line.slice(0, i), T.display.fontSize);
    const w = textWidth(p.mark.word, T.display.fontSize);
    const y = titleTop + lh * (p.mark.line + 1) - 4;
    mark = <Sketch shape={{kind: 'line', x1: x0 - 4, y1: y, x2: x0 + w + 6, y2: y - 3}} p={draw(t, p.mark.at, 0.45)} color={p.mark.tone === 'problem' ? C.problem : C.voice} seed={11} />;
  }
  return (
    <>
      {/* 同层铺底色，白底片段用 multiply 融进纸色，看不出矩形边 */}
      <AbsoluteFill style={{background: C.paper}} />
      {p.clip ? (
        <div style={{position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height, mixBlendMode: 'multiply'}}>
          <Sequence from={Math.round(shot.start * 30)} layout="none">
            <Media src={assetPath(ep, p.clip)} fit="contain" style={{filter: 'brightness(1.04) contrast(1.05)'}} />
          </Sequence>
        </div>
      ) : null}
      <div style={{position: 'absolute', left: G.left, top: G.headerTop, ...T.caption, fontWeight: 600, color: C.secondary, ...rise(t, shot.start + 0.1)}}>{p.kicker}</div>
      <div style={{position: 'absolute', left: G.left, top: titleTop, ...T.display, color: C.ink, whiteSpace: 'pre'}}>
        {p.title.map((l: string, i: number) => <div key={i} style={rise(t, shot.start + 0.18 + i * 0.12)}>{l}</div>)}
      </div>
      {mark}
    </>
  );
};
