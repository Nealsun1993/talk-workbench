// 页面 app.draft · 下期预告 / 待办
// 光标点「新建」→ 一张草稿卡出现，分类标签依次加上。只展示计划，不编造数据。
// props: {
//   title, sub,
//   button: {text, at},
//   card: {title, status, chips: [{text, icon?, at}]}
// }
import React from 'react';
import {C, T} from '../../kit/tokens';
import {Icon, Tag} from '../../kit/components';
import {rise} from '../../kit/motion';
import {AppTemplate, PageProps} from '../types';
import {PAD, CW} from '../geom';
import {Button, PageTitle, UI, pressScale} from '../ui';

const BTN = {x: PAD + CW - 220, y: 214, w: 220};
const CARD_Y = 380;

const Page: React.FC<PageProps> = ({t, shot}) => {
  const p = shot.props, c = p.card, at = p.button.at + 0.2;
  return (
    <>
      <PageTitle t={t} at={shot.start + 0.1} title={p.title} sub={p.sub} />
      <Button x={BTN.x} y={BTN.y} w={BTN.w} label={p.button.text} icon="plus" primary press={pressScale(t, p.button.at)} style={rise(t, shot.start + 0.2)} />
      <div style={{position: 'absolute', left: PAD, top: CARD_Y, width: CW, borderRadius: 30, background: '#fff', boxShadow: `0 0 0 2px ${UI.line}, 0 16px 36px rgba(16,36,58,0.10)`, padding: '34px 36px 40px', boxSizing: 'border-box', ...rise(t, at, 36)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <Tag tone="voice">{c.status}</Tag>
          <div style={{...T.caption, color: C.secondary}}>下一期</div>
        </div>
        <div style={{...T.heading, color: C.ink, marginTop: 20}}>{c.title}</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 16, marginTop: 30}}>
          {c.chips.map((ch: any) => (
            <div key={ch.text} style={{display: 'flex', alignItems: 'center', gap: 18, background: UI.well, borderRadius: 22, padding: '20px 22px', ...rise(t, ch.at)}}>
              <div style={{width: 60, height: 60, borderRadius: 16, background: C.voiceSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name={ch.icon ?? 'image'} size={36} color={C.voice} /></div>
              <div style={{...T.body, fontWeight: 600, color: C.ink}}>{ch.text}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export const Draft: AppTemplate = {
  Page,
  anchors: () => ({button: {rect: [BTN.x, BTN.y, BTN.w, 72], r: 20, bg: C.voice}}),
  acts: (shot) => [{at: shot.props.button.at, x: BTN.x + BTN.w / 2 + 16, y: BTN.y + 48, kind: 'click'}],
  focus: (shot) => [{at: shot.start, rect: null}],
};
