// 页面 app.modules · 模块清单
// 说到一个工具，光标点「+ 添加」，这一行滑进列表；说到统筹者（如 Codex），光标点「连接」，各行状态依次变成「已连接」。
// props: {
//   title, sub,
//   items: [{name, role, logo?, icon?, pad?, at}],           // at = 点名时刻
//   orchestrator?: {name, role, icon?, logo?, at}             // at = 点名时刻；0.5s 后点击「连接」
//   dense?: true     // v5.1：行更矮（最多 6 行），适合合集总览
//   label?: string   // 列表上方的小标题，默认「模块」
//   items[].bg / tint // 图标底色 / 图标颜色（默认蓝底白图标）
//   zoom?: false     // 不做相机推近（总览页反复回来时用）
//   prefill?: true   // v5：各行一开始就在（图标是从开场飞进来的），点名时这一行变成「当前」、光标移过去，不再点「添加」
// }
// 锚点：item:i（整行）、orchestrator（编排行）、logo:i / logo:orch（行首图标，开场图标飞进来的落点）
import React from 'react';
import {C, T} from '../../kit/tokens';
import {Tile, Icon} from '../../kit/components';
import {rise, lit, smooth, mix, springIn, snap} from '../../kit/motion';
import {assetPath} from '../../kit/types';
import {AppTemplate, PageProps} from '../types';
import {PAD, CW} from '../geom';
import {castLandAt} from '../../kit/cast';
import {Button, PageTitle, Status, UI, pressScale} from '../ui';
import {usePointer, hoverOf} from '../pointer';

const ROW0 = 450, ADD: [number, number] = [PAD + CW - 170, 356];
/** 行几何：普通 / dense（合集总览，最多 6 行） */
const G_ = (p: any) => p.dense ? {rowH: 118, box: 102, logo: 68, name: 40} : {rowH: 146, box: 128, logo: 84, name: 44};
const orchY = (p: any) => ROW0 + p.items.length * G_(p).rowH + 70;
const logoRect = (p: any, y: number, h: number): [number, number, number, number] => { const L = G_(p).logo; return [PAD + 24, y + (h - L) / 2, L, L]; };
const tileBg = (v?: string) => (v === 'ink' ? C.ink : v === 'white' ? '#FFFFFF' : v ?? C.voice);
const tileTint = (v?: string) => (v === 'ink' ? C.ink : v ?? '#FFFFFF');

const Page: React.FC<PageProps> = ({t, shot, ep}) => {
  const {title, sub, items, orchestrator: o, prefill: pre} = shot.props;
  const n = items.length, gm = G_(shot.props), ROW_H = gm.rowH, LOGO = gm.logo;
  // 开场图标飞进来之前，行首先空着（避免重影）
  const landed = (name: string) => { const a = castLandAt(ep, shot, name); return a === null || t >= a ? 1 : 0; };
  const connectAt = o ? o.at + 0.5 : Infinity;
  const addClicks = items.map((it: any) => it.at - 0.12);
  const lastClick = addClicks.filter((c: number) => t >= c).pop();
  const ptr = usePointer();
  return (
    <>
      <PageTitle t={t} at={shot.start + 0.1} title={title} sub={sub} />
      <div style={{position: 'absolute', left: PAD, top: 372, ...T.caption, fontWeight: 600, color: C.secondary}}>{shot.props.label ?? '模块'}</div>
      {pre ? null : <Button x={ADD[0]} y={ADD[1]} w={170} h={64} label="添加" icon="plus" press={pressScale(t, lastClick)} />}
      {/* 空槽位：先告诉观众“有几个部分”，说到哪个填哪个 */}
      {pre ? null : items.map((it: any, i: number) => (
        <div key={'slot' + i} style={{position: 'absolute', left: PAD, top: ROW0 + i * ROW_H, width: CW, height: gm.box, borderRadius: 28, border: `3px dashed ${C.quiet}`, boxSizing: 'border-box',
          opacity: (1 - lit(t, it.at)) * rise(t, shot.start + 0.4 + i * 0.08).opacity}} />
      ))}
      {items.map((it: any, i: number) => {
        const on = pre ? 1 : springIn(t, it.at);                                                       // 行：带回弹的弹簧
        // prefill：从点名到下一个点名保持「当前」（蓝底 + 蓝框）；否则添加时闪一下
        const flash = pre ? snap(t, it.at) * (1 - snap(t, i + 1 < n ? items[i + 1].at : o ? o.at : it.at + 1.5))
          : t >= it.at ? Math.max(0, 1 - (t - it.at) / 0.9) : 0;
        const conn = o ? snap(t, connectAt + 0.25 + i * 0.14) : 0;                                   // 状态：快速到位
        const hv = on >= 0.99 ? hoverOf(ptr, PAD, ROW0 + i * ROW_H, CW, gm.box, 16) : 0;             // 打磨模式：光标停在这一行时变色并抬起
        return (
          <div key={it.name} style={{position: 'absolute', left: PAD, top: ROW0 + i * ROW_H, width: CW, height: gm.box, borderRadius: 28,
            background: mix(mix(UI.well, '#E8EDF5', hv), C.voiceSoft, flash), boxShadow: pre ? `inset 0 0 0 ${3 * flash}px ${C.voice}` : hv > 0 ? `0 ${8 * hv}px ${20 * hv}px rgba(16,36,58,${0.1 * hv})` : undefined, display: 'flex', alignItems: 'center', gap: 24, padding: '0 24px', boxSizing: 'border-box',
            opacity: Math.min(1, on * 1.6), transform: `translateY(${(1 - Math.min(1, on)) * -24 - 3 * hv}px) scale(${0.96 + 0.04 * on})`}}>
            <div style={{opacity: landed('logo:' + i)}}>{it.logo ? <Tile size={LOGO} src={assetPath(ep, it.logo)} pad={it.pad ?? 0.14} /> : <Tile size={LOGO} icon={it.icon} bg={tileBg(it.bg)} tint={tileTint(it.tint)} />}</div>
            <div style={{flex: 1}}>
              <div style={{...T.body, fontSize: gm.name, fontWeight: 600, color: C.ink, lineHeight: 1.15}}>{it.name}</div>
              <div style={{...T.caption, color: C.secondary, lineHeight: gm.box < 110 ? 1.2 : 1.4}}>{it.role}</div>
            </div>
            {o ? <Status on={conn} off="未连接" onText="已连接" /> : null}
          </div>
        );
      })}
      {o ? (
        <>
          <div style={{position: 'absolute', left: PAD, top: orchY(shot.props) - 56, ...T.caption, fontWeight: 600, color: C.secondary, ...(pre ? {} : rise(t, o.at - 0.1))}}>编排</div>
          <div style={{position: 'absolute', left: PAD, top: orchY(shot.props), width: CW, height: 140, borderRadius: 28, display: 'flex', alignItems: 'center', gap: 24, padding: '0 24px', boxSizing: 'border-box',
            background: pre ? mix(UI.well, C.voiceSoft, snap(t, o.at) * (1 - snap(t, connectAt + 1.2))) : UI.well,
            boxShadow: pre ? `inset 0 0 0 ${3 * snap(t, o.at) * (1 - snap(t, connectAt + 1.2))}px ${C.voice}` : undefined, ...(pre ? {} : rise(t, o.at))}}>
            <div style={{opacity: landed('logo:orch')}}>{o.logo ? <Tile size={LOGO} src={assetPath(ep, o.logo)} /> : <Tile size={LOGO} icon={o.icon ?? 'terminal-window'} bg={C.ink} />}</div>
            <div style={{flex: 1}}>
              <div style={{...T.body, fontSize: 44, fontWeight: 600, color: C.ink, lineHeight: 1.15}}>{o.name}</div>
              <div style={{...T.caption, color: C.secondary}}>{o.role}</div>
            </div>
          </div>
          <Button x={PAD + CW - 24 - 190} y={orchY(shot.props) + 34} w={190} label={t >= connectAt + 0.2 ? <span>已连接 {n}/{n}</span> : '连接'} primary={t < connectAt + 0.2} press={pressScale(t, connectAt)}
            style={{...(pre ? {} : rise(t, o.at + 0.1)), fontSize: t >= connectAt + 0.2 ? 30 : 34}} />
        </>
      ) : null}
    </>
  );
};

export const Modules: AppTemplate = {
  Page,
  anchors: (shot) => {
    const {items, orchestrator: o} = shot.props, a: any = {};
    items.forEach((_: any, i: number) => {
      const gm = G_(shot.props);
      a['item:' + i] = {rect: [PAD, ROW0 + i * gm.rowH, CW, gm.box], r: 28, bg: UI.well};
      a['logo:' + i] = {rect: logoRect(shot.props, ROW0 + i * gm.rowH, gm.box), r: gm.logo * 0.24, bg: '#FFFFFF'};
    });
    if (o) {
      a.orchestrator = {rect: [PAD, orchY(shot.props), CW, 140], r: 28, bg: UI.well};
      a['logo:orch'] = {rect: logoRect(shot.props, orchY(shot.props), 140), r: G_(shot.props).logo * 0.24, bg: C.ink};
    }
    return a;
  },
  acts: (shot) => {
    const {items, orchestrator: o, prefill: pre} = shot.props;
    // prefill：点名时光标移到这一行（悬停）；否则点「添加」
    const gm = G_(shot.props);
    const a: any[] = pre ? items.filter((it: any) => it.at < shot.end).map((it: any) => ({at: it.at - 0.1, x: PAD + CW - 200, y: ROW0 + items.indexOf(it) * gm.rowH + gm.box * 0.6, kind: 'hover' as const}))
      : items.map((it: any) => ({at: it.at - 0.12, x: ADD[0] + 95, y: ADD[1] + 40, kind: 'click' as const}));
    if (o) a.push({at: o.at + 0.5, x: PAD + CW - 24 - 95, y: orchY(shot.props) + 74, kind: 'click' as const});
    return a;
  },
  focus: (shot) => {
    const {items, orchestrator: o} = shot.props;
    if (shot.props.zoom === false) return [{at: shot.start, rect: null}];  // 总览页（hub）不推近
    const f: any[] = [{at: shot.start, rect: null}, {at: items[0].at - 0.6, rect: [PAD - 20, 340, CW + 40, items.length * G_(shot.props).rowH + 40], scale: 1.18}];
    if (o) f.push({at: o.at - 0.3, rect: [PAD - 20, 340, CW + 40, orchY(shot.props) + 160 - 340], scale: 1.08}, {at: o.at + 1.4, rect: null});
    return f;
  },
};
