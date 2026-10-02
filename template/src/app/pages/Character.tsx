// 页面 app.character · 固定角色
// 角色参考图钉在左边；说到规则时逐条勾选；说到“不同场景保持一致”时，场景图出现并标注同一角色。
// props: {
//   title, sub,
//   reference: {src, tag, at?},
//   rules: [{name, icon, at}],
//   scenes: [{src, tag, at}],
//   badge?: {text, at}                // 如「同一角色」
// }
import React from 'react';
import {C, T} from '../../kit/tokens';
import {Icon, Media, Tag} from '../../kit/components';
import {rise, lit, mix} from '../../kit/motion';
import {assetPath} from '../../kit/types';
import {AppTemplate, PageProps} from '../types';
import {PAD, CW} from '../geom';
import {PageTitle, UI} from '../ui';

const REF = {x: PAD, y: 340, s: 400};
const RULE = {x: PAD + 424, y: 340, w: CW - 424, row: 120};
const SCENE_Y = 830, SCENE_H = 250;

const Page: React.FC<PageProps> = ({t, shot, ep}) => {
  const p = shot.props;
  const sw = (CW - 20) / 2;
  return (
    <>
      <PageTitle t={t} at={shot.start + 0.1} title={p.title} sub={p.sub} />
      <div style={{position: 'absolute', left: REF.x, top: REF.y, width: REF.s, ...rise(t, p.reference.at ?? shot.start + 0.2)}}>
        <div style={{width: REF.s, height: REF.s, borderRadius: 26, overflow: 'hidden', boxShadow: `0 0 0 2px ${UI.line}`}}><Media src={assetPath(ep, p.reference.src)} fit="cover" /></div>
        <div style={{marginTop: 12}}><Tag>{p.reference.tag}</Tag></div>
      </div>
      <div style={{position: 'absolute', left: RULE.x, top: RULE.y, width: RULE.w, height: p.rules.length * RULE.row, borderRadius: 26, background: UI.well, ...rise(t, shot.start + 0.3)}}>
        {p.rules.map((r: any, i: number) => {
          const on = lit(t, r.at);
          return (
            <div key={r.name} style={{position: 'absolute', left: 0, top: i * RULE.row, width: RULE.w, height: RULE.row, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', boxSizing: 'border-box', borderTop: i ? `2px solid ${UI.line}` : 'none'}}>
              <Icon name={r.icon} size={42} color={mix('#9AA7B8', C.ink, on)} />
              <div style={{...T.body, fontWeight: 600, color: mix(C.secondary, C.ink, on), flex: 1}}>{r.name}</div>
              <div style={{width: 56, height: 56, borderRadius: 28, background: mix('#FFFFFF', C.voice, on), boxShadow: `inset 0 0 0 ${4 * (1 - on)}px ${UI.off}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Icon name="check" size={34} color="#fff" style={{opacity: on}} />
              </div>
            </div>
          );
        })}
      </div>
      {p.scenes.map((sc: any, i: number) => (
        <div key={sc.src} style={{position: 'absolute', left: PAD + i * (sw + 20), top: SCENE_Y, width: sw, ...rise(t, sc.at, 28)}}>
          <div style={{width: sw, height: SCENE_H, borderRadius: 26, overflow: 'hidden', boxShadow: `0 0 0 2px ${UI.line}`}}><Media src={assetPath(ep, sc.src)} fit="cover" style={{objectPosition: '50% 45%'}} /></div>
          <div style={{marginTop: 12}}><Tag>{sc.tag}</Tag></div>
        </div>
      ))}
      {p.badge ? (
        <div style={{position: 'absolute', left: 0, width: PAD * 2 + CW, top: SCENE_Y - 76, display: 'flex', justifyContent: 'flex-end', paddingRight: PAD, boxSizing: 'border-box', ...rise(t, p.badge.at)}}>
          <div style={{background: C.voice, color: '#fff', borderRadius: 30, height: 60, padding: '0 22px', display: 'flex', alignItems: 'center', gap: 8, ...T.caption, fontWeight: 600, boxShadow: '0 8px 20px rgba(40,91,240,0.3)'}}>
            <Icon name="check" size={30} color="#fff" />{p.badge.text}
          </div>
        </div>
      ) : null}
    </>
  );
};

export const Character: AppTemplate = {
  Page,
  anchors: () => ({reference: {rect: [REF.x, REF.y, REF.s, REF.s], r: 26, bg: '#FFFFFF'}}),
  acts: (shot) => shot.props.rules.map((r: any, i: number) => ({at: r.at - 0.08, x: RULE.x + RULE.w - 50, y: RULE.y + i * RULE.row + RULE.row / 2 + 8, kind: 'click' as const})),
  focus: (shot) => {
    const p = shot.props, f: any[] = [{at: shot.start, rect: [PAD - 20, 200, REF.s + 60, 620], scale: 1.18}];
    f.push({at: p.rules[0].at - 0.4, rect: null});
    return f;
  },
};
