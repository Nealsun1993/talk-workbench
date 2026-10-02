// 页面 app.tts · 文字转配音
// 确认好的文案 → 点「生成配音」→ 真实波形一格格长出来；说到“参考自己的声音”时，光标切换音色。
// props: {
//   title, sub,
//   script: {label, text},                         // 确认好的文案（原文）
//   range: [s, e],                                  // 这句话在本片配音里的时间 → 画出真实波形
//   local?: {text, at},                             // 如「本地运行」，at 时点亮
//   voice?: {label, from, to, at},                  // 音色选择：at 时光标点开，from → to
//   button: {text, at},                             // 点击生成
//   result: string                                  // 波形卡标注，写明“真实波形”
// }
import React from 'react';
import {C, T} from '../../kit/tokens';
import {Icon, Waveform} from '../../kit/components';
import {rise, smooth, lit, clamp01, mix} from '../../kit/motion';
import {envAt} from '../../kit/types';
import {AppTemplate, PageProps} from '../types';
import {PAD, CW} from '../geom';
import {Button, PageTitle, UI, pressScale} from '../ui';

const SCRIPT_Y = 340, OPT_Y = 590, BTN_Y = 700, WAVE_Y = 830;
const VOICE = {x: PAD + CW - 440, w: 440};

const Page: React.FC<PageProps> = ({t, shot, env}) => {
  const p = shot.props, [s, e] = p.range;
  const gen = p.button.at + 0.2, grow = clamp01((t - gen) / 1.3);
  const lo = p.local ? lit(t, p.local.at) : 0;
  const vo = p.voice ? lit(t, p.voice.at + 0.1) : 0;
  return (
    <>
      <PageTitle t={t} at={shot.start + 0.1} title={p.title} sub={p.sub} />
      <div style={{position: 'absolute', left: PAD, top: SCRIPT_Y, width: CW, height: 220, borderRadius: 28, background: UI.well, padding: '26px 32px', boxSizing: 'border-box', ...rise(t, shot.start + 0.18)}}>
        <div style={{...T.caption, color: C.secondary}}>{p.script.label}</div>
        <div style={{...T.body, fontSize: 42, fontWeight: 600, color: C.ink, marginTop: 10, lineHeight: 1.4}}>「{p.script.text}」</div>
      </div>
      {p.local ? (
        <div style={{position: 'absolute', left: PAD, top: OPT_Y, height: 76, borderRadius: 38, padding: '0 26px', display: 'flex', alignItems: 'center', gap: 12,
          background: mix(UI.track, C.voiceSoft, lo), ...T.caption, fontWeight: 600, color: mix(C.secondary, C.voice, lo), ...rise(t, shot.start + 0.25)}}>
          <Icon name={lo > 0.5 ? 'check' : 'terminal-window'} size={34} color={mix(C.secondary, C.voice, lo)} />{p.local.text}
        </div>
      ) : null}
      {p.voice ? (
        <div style={{position: 'absolute', left: VOICE.x, top: OPT_Y, width: VOICE.w, height: 76, borderRadius: 20, background: '#fff', boxShadow: `inset 0 0 0 2px ${mix(UI.line, C.voice, vo)}`,
          display: 'flex', alignItems: 'center', padding: '0 22px', boxSizing: 'border-box', gap: 12, ...rise(t, shot.start + 0.3), transform: `scale(${pressScale(t, p.voice.at)})`}}>
          <div style={{...T.caption, color: C.secondary}}>{p.voice.label}</div>
          <div style={{position: 'relative', flex: 1, height: 44}}>
            <div style={{position: 'absolute', top: 0, ...T.caption, fontWeight: 600, color: C.ink, opacity: 1 - vo}}>{p.voice.from}</div>
            <div style={{position: 'absolute', top: 0, ...T.caption, fontWeight: 600, color: C.voice, opacity: vo}}>{p.voice.to}</div>
          </div>
          <Icon name="caret-down" size={30} color={C.secondary} />
        </div>
      ) : null}
      <Button x={PAD} y={BTN_Y} w={CW} h={96} primary={t < gen} label={t < gen ? p.button.text : grow < 1 ? '生成中…' : '已生成'} icon={t < gen ? 'microphone' : grow < 1 ? undefined : 'check'}
        press={pressScale(t, p.button.at)} style={{...rise(t, shot.start + 0.35), fontSize: 38}} />
      <div style={{position: 'absolute', left: PAD, top: WAVE_Y, width: CW, height: 280, borderRadius: 28, background: UI.well, opacity: clamp01((t - gen) / 0.3), transform: `translateY(${(1 - smooth(t, gen, 0.45)) * 20}px)`}}>
        <div style={{position: 'absolute', left: 32, top: 40}}>
          <Waveform values={(x) => envAt(env, x)} s={s} e={e} w={CW - 64} h={150} p={grow} />
        </div>
        <div style={{position: 'absolute', left: 32, bottom: 24, ...T.caption, color: C.secondary}}>{p.result}</div>
      </div>
    </>
  );
};

export const Tts: AppTemplate = {
  Page,
  anchors: () => ({script: {rect: [PAD, SCRIPT_Y, CW, 220], r: 28, bg: UI.well}, wave: {rect: [PAD, WAVE_Y, CW, 280], r: 28, bg: UI.well}}),
  acts: (shot) => {
    const p = shot.props, a: any[] = [{at: p.button.at, x: PAD + CW / 2 + 60, y: BTN_Y + 62, kind: 'click'}];
    if (p.voice) a.push({at: p.voice.at, x: VOICE.x + VOICE.w - 60, y: OPT_Y + 52, kind: 'click'});
    return a;
  },
  focus: (shot) => {
    const p = shot.props;
    const f: any[] = [{at: shot.start, rect: [PAD - 20, 200, CW + 40, 380], scale: 1.12}, {at: p.button.at - 0.4, rect: null}];
    if (p.voice) f.push({at: p.voice.at - 0.35, rect: [PAD - 20, OPT_Y - 60, CW + 40, 520], scale: 1.15}, {at: p.voice.at + 1.3, rect: null});
    return f;
  },
};
