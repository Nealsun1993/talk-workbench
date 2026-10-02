// 页面 app.export · 合成导出
// 光标点主按钮 → 按钮变成进度（示意）→ 预览里播放真实成片片段、右侧逐项勾选 → 通知「完成」。
// props: {
//   title, sub,
//   button: {text, logo?, at},                      // 点击时刻
//   preview: {src, tag, size?: [w, h]},             // 真实成片片段
//   checks?: [{icon, label}],                        // 进度中依次勾选
//   done: {text, at}                                 // 完成通知
// }
import React from 'react';
import {Sequence} from 'remotion';
import {C, T} from '../../kit/tokens';
import {Icon, Media, Tag, Tile} from '../../kit/components';
import {rise, smooth, lit} from '../../kit/motion';
import {assetPath} from '../../kit/types';
import {AppTemplate, PageProps} from '../types';
import {PAD, CW} from '../geom';
import {PageTitle, Toast, UI, pressScale} from '../ui';

const BTN_Y = 350, BTN_H = 104, PREV_Y = 500, PREV_H = 500;

const Page: React.FC<PageProps> = ({t, shot, ep}) => {
  const p = shot.props, b = p.button;
  const start = b.at + 0.15, end = p.done.at - 0.1;
  const prog = smooth(t, start, end - start);
  const running = t >= b.at + 0.05;
  const pw = PREV_H * 9 / 16;
  const checks = p.checks ?? [];
  return (
    <>
      <PageTitle t={t} at={shot.start + 0.1} title={p.title} sub={p.sub} />
      <div style={{position: 'absolute', left: PAD, top: BTN_Y, width: CW, height: BTN_H, borderRadius: 26, overflow: 'hidden', background: running ? C.ink : C.voice,
        boxShadow: '0 10px 24px rgba(40,91,240,0.25)', transform: `scale(${pressScale(t, b.at)})`, ...rise(t, shot.start + 0.15)}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${prog * 100}%`, background: C.voice}} />
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px'}}>
          {b.logo ? <Tile size={64} src={assetPath(ep, b.logo)} pad={0.16} /> : null}
          <div style={{...T.body, fontWeight: 600, color: '#fff', flex: 1}}>{running ? (prog >= 1 ? '合成完成' : '合成中…') : b.text}</div>
          {running ? <div style={{fontFamily: '"JetBrains Mono", monospace', fontSize: 34, fontWeight: 600, color: '#fff'}}>{Math.round(prog * 100)}%</div> : <Icon name="arrow-up-right" size={40} color="#fff" />}
        </div>
      </div>
      <div style={{position: 'absolute', left: PAD, top: PREV_Y, width: pw, height: PREV_H, borderRadius: 26, overflow: 'hidden', background: '#fff', boxShadow: `inset 0 0 0 2px ${UI.line}`, ...rise(t, b.at + 0.2)}}>
        <Sequence from={Math.round((b.at + 0.2) * 30)} layout="none">
          <Media src={assetPath(ep, p.preview.src)} fit="cover" />
        </Sequence>
      </div>
      <div style={{position: 'absolute', left: PAD, top: PREV_Y + PREV_H + 18, ...rise(t, b.at + 0.3)}}><Tag>{p.preview.tag}</Tag></div>
      {checks.map((c: any, i: number) => {
        const at = start + ((i + 1) / (checks.length + 1)) * (end - start);
        const on = lit(t, at);
        return (
          <div key={c.label} style={{position: 'absolute', left: PAD + pw + 44, top: PREV_Y + 30 + i * 110, display: 'flex', alignItems: 'center', gap: 20, ...rise(t, b.at + 0.3 + i * 0.08)}}>
            <div style={{width: 64, height: 64, borderRadius: 18, background: on > 0.5 ? C.voice : UI.track, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Icon name={on > 0.5 ? 'check' : c.icon} size={36} color={on > 0.5 ? '#fff' : C.secondary} />
            </div>
            <div style={{...T.body, fontSize: 42, fontWeight: 600, color: on > 0.5 ? C.ink : C.secondary}}>{c.label}</div>
          </div>
        );
      })}
      <Toast t={t} at={p.done.at} text={p.done.text} />
    </>
  );
};

export const Export: AppTemplate = {
  Page,
  anchors: () => ({button: {rect: [PAD, BTN_Y, CW, BTN_H], r: 26, bg: C.voice}, preview: {rect: [PAD, PREV_Y, PREV_H * 9 / 16, PREV_H], r: 26, bg: '#FFFFFF'}}),
  acts: (shot) => [{at: shot.props.button.at, x: PAD + CW - 120, y: BTN_Y + BTN_H / 2 + 14, kind: 'click'}],
  focus: (shot) => [{at: shot.start, rect: null}],
};
