// 页面 app.toggles · 能力开关 / 检查项
// 说到哪一项，光标就打开哪一个开关（或勾选）；最后弹出通知总结，可以连续几条。
// props: {
//   title, sub,
//   control?: 'toggle' | 'check',        // 开关（能力）或勾选（检查项），默认 toggle
//   items: [{name, icon, at, desc?}],
//   toast?: {text, at, icon?} | toasts?: [{text, at, icon?}]   // 多条时后一条替换前一条；提醒类 icon: 'info'
// }
import React from 'react';
import {C, T} from '../../kit/tokens';
import {Icon} from '../../kit/components';
import {rise, lit, mix} from '../../kit/motion';
import {AppTemplate, PageProps} from '../types';
import {PAD, CW} from '../geom';
import {PageTitle, Toast, Toggle, UI, toastRect} from '../ui';
import {snap} from '../../kit/motion';
import {usePointer, hoverOf} from '../pointer';

const LIST_Y = 372, ROW = 140, TX = PAD + CW - 40 - 110;

const Page: React.FC<PageProps> = ({t, shot}) => {
  const {title, sub, items} = shot.props;
  const toasts: any[] = shot.props.toasts ?? (shot.props.toast ? [shot.props.toast] : []);
  const active = toasts.filter((x) => t >= x.at).pop();
  const check = shot.props.control === 'check';
  const ptr = usePointer();
  return (
    <>
      <PageTitle t={t} at={shot.start + 0.1} title={title} sub={sub} />
      <div style={{position: 'absolute', left: PAD, top: LIST_Y, width: CW, height: items.length * ROW, borderRadius: 28, background: UI.well, ...rise(t, shot.start + 0.18)}}>
        {items.map((it: any, i: number) => {
          const on = snap(t, it.at); // 开关 / 勾选：快速到位
          const bloom = ptr.polish && t >= it.at ? Math.max(0, 1 - (t - it.at) / 0.7) : 0;           // 打磨模式：刚打开时的颜色余韵
          const hvRow = hoverOf(ptr, PAD, LIST_Y + i * ROW, CW, ROW, 12), hvSw = hoverOf(ptr, PAD + CW - 40 - 120, LIST_Y + i * ROW + (ROW - 84) / 2, 130, 84);
          return (
            <div key={it.name} style={{position: 'absolute', left: 0, top: i * ROW, width: CW, height: ROW, borderTop: i ? `2px solid ${UI.line}` : 'none', background: hvRow > 0 || bloom > 0 ? `rgba(40,91,240,${Math.max(0.045 * hvRow, 0.11 * bloom)})` : undefined,
              borderRadius: i === 0 ? '28px 28px 0 0' : i === items.length - 1 ? '0 0 28px 28px' : 0}}>
              <div style={{position: 'absolute', left: 32, top: 0, height: ROW, display: 'flex', alignItems: 'center', gap: 24}}>
                <Icon name={it.icon} size={50} color={mix(mix('#9AA7B8', C.ink, on), C.voice, bloom)} />
                <div>
                  <div style={{...T.body, fontSize: 44, fontWeight: 600, color: mix(C.secondary, C.ink, on), lineHeight: 1.15}}>{it.name}</div>
                  {it.desc ? <div style={{...T.caption, color: C.secondary}}>{it.desc}</div> : null}
                </div>
              </div>
              {check ? (
                <div style={{position: 'absolute', left: CW - 40 - 64, top: (ROW - 64) / 2, width: 64, height: 64, borderRadius: 32, background: mix('#FFFFFF', C.voice, on),
                  boxShadow: `inset 0 0 0 ${4 * (1 - on)}px ${UI.off}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.9 + 0.1 * on})`}}>
                  <Icon name="check" size={38} color="#fff" style={{opacity: on}} />
                </div>
              ) : <Toggle on={on} x={CW - 40 - 110} y={(ROW - 64) / 2} hover={hvSw} bloom={bloom} />}
            </div>
          );
        })}
      </div>
      {active ? <Toast key={active.at} t={t} at={active.at} text={active.text} icon={active.icon} /> : null}
    </>
  );
};

export const Toggles: AppTemplate = {
  Page,
  anchors: (shot) => {
    const toasts: any[] = shot.props.toasts ?? (shot.props.toast ? [shot.props.toast] : []);
    const a: any = {list: {rect: [PAD, LIST_Y, CW, shot.props.items.length * ROW], r: 28, bg: UI.well}};
    if (toasts.length) a.toast = {rect: toastRect(toasts[toasts.length - 1].text), r: 48, bg: C.ink};
    return a;
  },
  acts: (shot) => shot.props.items.map((it: any, i: number) => ({at: it.at - 0.08, x: shot.props.control === 'check' ? PAD + CW - 40 - 26 : TX + 80, y: LIST_Y + i * ROW + ROW / 2 + 6, kind: 'click' as const})),
  focus: (shot) => {
    const {items} = shot.props;
    const toasts: any[] = shot.props.toasts ?? (shot.props.toast ? [shot.props.toast] : []);
    const f: any[] = [{at: shot.start, rect: null}, {at: items[0].at - 0.5, rect: [PAD - 20, LIST_Y - 30, CW + 40, items.length * ROW + 60], scale: 1.15}];
    if (toasts.length) f.push({at: toasts[0].at - 0.25, rect: null});
    return f;
  },
};
