// 模板 outro · 结尾行动引导（深色）
// 关键词大字（橙）+ 原版线描头像。
// props: {
//   kicker: {text, at},              // 如「评论区发送关键词」
//   keyword: {text, at},             // 如「口播」
//   lines: string[],                 // 领取内容说明
//   portrait: '/brand/avatar.jpg',
//   cta: [{text, at}]                // 点赞 / 收藏 / 关注，逐个点亮
// }
import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, G, T} from '../kit/tokens';
import {rise, pop, lit, mix} from '../kit/motion';
import {TemplateProps} from './types';
import {assetPath} from '../kit/types';

export const PORTRAIT = {x: 640, y: 780, size: 300};

export const Outro: React.FC<TemplateProps> = ({t, shot, ep}) => {
  const p = shot.props;
  return (
    <>
      <div style={{position: 'absolute', left: G.left, top: G.contentTop, ...T.body, color: C.dark.secondary, ...rise(t, p.kicker.at)}}>{p.kicker.text}</div>
      <div style={{position: 'absolute', left: G.left - 6, top: G.contentTop + 60, fontSize: 168, fontWeight: 700, lineHeight: 1.1, color: C.problem, ...pop(t, p.keyword.at), transformOrigin: 'left center'}}>{p.keyword.text}</div>
      <div style={{position: 'absolute', left: G.left, top: 830, ...T.body, fontSize: 44, lineHeight: 1.6, color: '#D4E1F6', ...rise(t, p.keyword.at + 0.4)}}>
        {p.lines.map((l: string) => <div key={l}>{l}</div>)}
      </div>
      <div style={{position: 'absolute', left: PORTRAIT.x, top: PORTRAIT.y, width: PORTRAIT.size, height: PORTRAIT.size, borderRadius: 28, overflow: 'hidden', background: '#fff', transform: 'rotate(3deg)', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', ...rise(t, p.keyword.at + 0.6)}}>
        <Img src={staticFile(assetPath(ep, p.portrait))} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div style={{position: 'absolute', left: G.left, top: 1180, display: 'flex', gap: 34}}>
        {p.cta.map((c: any) => {
          const on = lit(t, c.at);
          return <div key={c.text} style={{...T.heading, color: mix('#3A4E70', '#FFFFFF', on), ...(t >= c.at ? pop(t, c.at) : {})}}>{c.text}</div>;
        })}
      </div>
    </>
  );
};
