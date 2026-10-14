// 模板 orb · 观点球（v5.2 试用 · 第四版）：角色带出一个「大纲」小球，点开后变成竖排的几个小标题，最后收成卡片交给口播工作台
// 画面（白底）：
//   1. 开场：顶部小标题 + 大标题，角色站在中间；iconAt 时角色轻跳一下，他右上方像气泡一样冒出一个黑色实心球（大纲图标）。
//   2. clickAt：光标点这个球。角色和大标题退场，球沿弧线飞到左侧竖排的第一个位置，标题换成 outline。
//   3. 竖排大纲：每个节点在它被念到的时刻（nodes[].at）像气泡一样冒出来（冲过头再弹回），文字从右侧滑入；
//      最新念到的那一行文字是深色，之前的变灰。
//   4. 章节回到大纲：不写 host、节点不写 at，写 current，这一步弹一下变深色，然后 exit 进工作台。
//   5. exit.at：大纲收进一张白卡片（exit.rect），下一镜口播工作台写 "launch": {"from": 同一个 rect, "r": 36}，窗口从这张卡片长出来。
// props: {
//   kicker?: string, title: string,           // 开场标题
//   outline?: string,                         // 点开后的标题，如「本期四步」，默认沿用 title
//   host?: {iconAt, clickAt, figure?},        // 角色 + 大纲球；不写则直接从竖排大纲开始
//   nodes: [{label, at?}],                    // 2–5 个；不写 at 的节点在镜头开始时依次冒出（章节回到大纲时用）
//   current?: {index, at}                     // 章节回到大纲：at 时这一步变深色、球再弹一下，其余保持灰色
//   exit?: {at, rect: [x, y, w, h]}           // 收成卡片，交给下一镜的口播工作台
// }
import React from 'react';
import {Img, staticFile, interpolate, Easing, spring} from 'remotion';
import {C, G, T} from '../kit/tokens';
import {Icon} from '../kit/components';
import {rise, snap, mix, clamp01, lerp, springIn, morphEase} from '../kit/motion';
import {assetPath} from '../kit/types';
import {OPENER} from '../kit/cast';
import {TemplateProps} from './types';

const TAU = Math.PI * 2;
const ICON = {x: 850, y: 640, r: 64};        // 开场时大纲球的位置（角色右上方）
const COL = {x: 210, top: 610, gap: 240};    // 竖排：球心 x、第一个球心 y、最大行距
const NR = 56;                               // 大纲里球的半径
const ease = (t: number, a: number, d: number, e = Easing.bezier(0.16, 1, 0.3, 1)) =>
  interpolate(t, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const BALL: React.CSSProperties = {borderRadius: '50%', background: C.ink, boxShadow: '0 12px 28px rgba(16,36,58,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center'};
const ARROW = 'M3 2 L3 19 L7.6 14.8 L10.6 21.6 L13.4 20.4 L10.5 13.8 L16.8 13.6 Z';

/** 气泡：at 时从无到有冒出来，冲过头再弹回（带一点挤压回弹），外面荡开一圈细环 */
const bubble = (t: number, at: number, x: number, y: number, r: number, children?: React.ReactNode, key?: React.Key, boost = 1) => {
  if (t < at) return null;
  const k = t - at;
  const s = spring({frame: k * 30, fps: 30, config: {damping: 11, stiffness: 320, mass: 0.55}});
  const w = 0.1 * Math.sin(k * 30) * Math.exp(-k * 9);          // 挤压：横竖反向，很快衰减
  const q = clamp01(k / 0.45);
  return (
    <React.Fragment key={key}>
      {q < 1 ? <div style={{position: 'absolute', left: x - r * (1 + 0.7 * q), top: y - r * (1 + 0.7 * q), width: 2 * r * (1 + 0.7 * q), height: 2 * r * (1 + 0.7 * q),
        borderRadius: '50%', border: `3px solid ${C.ink}`, opacity: 0.3 * (1 - q) * clamp01(k / 0.06)}} /> : null}
      <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, transform: `scale(${s * (1 + w) * boost}, ${s * (1 - w) * boost})`, ...BALL}}>
        <div style={{display: 'flex', opacity: clamp01((k - 0.06) / 0.1)}}>{children}</div>
      </div>
    </React.Fragment>
  );
};

export const Orb: React.FC<TemplateProps> = ({t, shot, ep}) => {
  const p = shot.props;
  const nodes: {label: string; at: number}[] = p.nodes;
  const gap = Math.min(COL.gap, 720 / Math.max(1, nodes.length - 1));
  const slot = (i: number): [number, number] => [COL.x, COL.top + i * gap];

  const host = p.host;
  const clickAt = host ? host.clickAt : shot.start - 1;
  const go = clickAt + 0.12;                                  // 点完开始转场
  const leave = ease(t, go, 0.45, Easing.in(Easing.quad));    // 角色、开场标题退场
  const fly = ease(t, go, 0.8, morphEase);                    // 球飞到第一个位置

  // 收卡片
  const ex = p.exit ? ease(t, p.exit.at, 0.4) : 0;
  const fade = p.exit ? 1 - ease(t, shot.end - 0.15, 0.15) : 1;   // 大纲留到最后一刻，直接换成窗口里的内容，卡片不空着

  const atOf = (i: number): number => nodes[i].at ?? shot.start + 0.15 + i * 0.08;
  const current = (i: number) => (p.current ? i === p.current.index && t >= p.current.at : t >= atOf(i) && !nodes.find((n, j) => j > i && t >= atOf(j)));

  // ── 开场：角色 + 大纲球 + 光标 ──
  let hostEl: React.ReactNode = null, ball: React.ReactNode = null, cursor: React.ReactNode = null;
  if (host) {
    const fig = host.figure ?? {src: '/brand/figure.png', size: [922, 973]};
    const fh = OPENER.figure.h, fw = (fh * fig.size[0]) / fig.size[1];
    const inP = springIn(t, shot.start + 0.3);
    const breathe = 1 + 0.008 * Math.sin((TAU * (t - shot.start)) / 3.2);
    const hp = clamp01((t - host.iconAt) / 0.45);
    const hopY = t >= host.iconAt ? -22 * Math.sin(Math.PI * Math.min(1, hp / 0.8)) : 0;
    if (leave < 1) hostEl = (
      <div style={{position: 'absolute', inset: 0, opacity: clamp01((t - shot.start - 0.3) / 0.15) * (1 - leave), transformOrigin: `${OPENER.figure.cx}px ${OPENER.figure.bottom}px`,
        transform: `translateY(${(1 - Math.min(1, inP)) * 40 + hopY + 70 * leave}px) scale(${(0.92 + 0.08 * inP) * breathe})`}}>
        <Img src={staticFile(assetPath(ep, fig.src))} style={{position: 'absolute', left: OPENER.figure.cx - fw / 2, top: OPENER.figure.bottom - fh, width: fw, height: fh}} />
      </div>
    );

    // 光标：球聚好后从右下进场，停在球上，点一下，然后淡出
    const cIn = host.iconAt + 0.35, mv = ease(t, clickAt - 1.05, 0.85, Easing.inOut(Easing.sin));
    const tipX = lerp(1010, ICON.x + 8, mv), tipY = lerp(1240, ICON.y + 10, mv);
    const down = t >= clickAt && t < clickAt + 0.14;
    const rp = (t - clickAt) / 0.5;
    const cOp = clamp01((t - cIn) / 0.25) * (1 - clamp01((t - clickAt - 0.3) / 0.3));
    if (t >= cIn && cOp > 0) cursor = (
      <div style={{position: 'absolute', inset: 0, opacity: cOp}}>
        {rp >= 0 && rp < 1 ? <div style={{position: 'absolute', left: tipX - 8 - 60 * rp, top: tipY - 8 - 60 * rp, width: 16 + 120 * rp, height: 16 + 120 * rp, borderRadius: '50%', border: `4px solid ${C.ink}`, opacity: 0.4 * (1 - rp)}} /> : null}
        <svg width={56} height={56} viewBox="0 0 24 24" style={{position: 'absolute', left: tipX, top: tipY, transform: `scale(${down ? 0.86 : 1})`, transformOrigin: '0 0', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.25))'}}>
          <path d={ARROW} fill="#111" stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
      </div>
    );

    // 大纲球：气泡冒出 → 浮着 → 被光标指住时停稳放大 → 按下 → 飞到第一个位置
    if (fly < 1) {
      const hover = ease(t, clickAt - 0.35, 0.3);
      const bob = t >= host.iconAt ? 10 * Math.sin((TAU * (t - host.iconAt)) / 2.6) * (1 - hover) : 0;
      const x = lerp(ICON.x, slot(0)[0], fly), y = lerp(ICON.y + bob, slot(0)[1], fly) - 120 * Math.sin(Math.PI * fly);
      const press = t >= clickAt && t < clickAt + 0.3 ? 1 - 0.08 * Math.sin((Math.PI * (t - clickAt)) / 0.3) : 1;
      const r = lerp(ICON.r, NR, fly) * (1 + 0.06 * hover * (1 - fly)) * press;
      ball = bubble(t, host.iconAt, x, y, r, <Icon name="list-checks" size={r * 1.05} color="#FFFFFF" />);
    }
  }

  // ── 竖排大纲 ──
  const items = nodes.map((n, i) => {
    const [x, y] = slot(i);
    const at = atOf(i), lit = t >= at;
    const num = <span style={{...T.heading, fontSize: 44, lineHeight: 1, color: '#FFFFFF'}}>{i + 1}</span>;
    let orb: React.ReactNode;
    if (i === 0 && host) {
      // 第一个球是飞过来的大纲球：落位后图标换成数字
      if (fly < 1) return null;
      const k = ease(t, at, 0.3);
      orb = (
        <div style={{position: 'absolute', left: x - NR, top: y - NR, width: 2 * NR, height: 2 * NR, ...BALL}}>
          <Icon name="list-checks" size={NR * 1.05} color="#FFFFFF" style={{position: 'absolute', opacity: 1 - k}} />
          <div style={{opacity: k}}>{num}</div>
        </div>
      );
    } else {
      const pulse = p.current && p.current.index === i ? 1 + 0.16 * Math.sin(Math.PI * clamp01((t - p.current.at) / 0.4)) : 1;
      orb = bubble(t, at, x, y, NR, num, undefined, pulse);
    }
    if (!orb) return null;
    const lostAt = i + 1 < nodes.length ? atOf(i + 1) : Infinity;
    const on = p.current ? (current(i) ? snap(t, p.current.at) : 0) : current(i) ? snap(t, at) : lit ? 1 - snap(t, lostAt) : 0;
    const lab = ease(t, at, 0.45);
    return (
      <React.Fragment key={i}>
        {orb}
        {lit ? (
          <div style={{position: 'absolute', left: x + NR + 44, top: y - 40, height: 80, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
            opacity: lab, transform: `translateX(${(1 - lab) * 36}px)`}}>
            <span style={{...T.heading, fontWeight: 600, color: mix(C.secondary, C.ink, on)}}>{n.label}</span>
          </div>
        ) : null}
      </React.Fragment>
    );
  });

  const t1 = host ? go + 0.3 : shot.start + 0.1;
  const R = p.exit?.rect;
  return (
    <>
      {/* 收卡片：白卡片在大纲后面浮起来，大纲淡掉；下一镜的窗口从这张卡片长出来 */}
      {R && ex > 0 ? <div style={{position: 'absolute', left: R[0], top: R[1], width: R[2], height: R[3], borderRadius: 36, background: '#FFFFFF', opacity: ex,
        boxShadow: `0 ${10 * ex}px ${24 * ex}px -4px rgba(16,36,58,0.18)`}} /> : null}

      <div style={{position: 'absolute', inset: 0, opacity: fade}}>
        {/* 标题：开场标题 → 大纲标题 */}
        <div style={{position: 'absolute', left: G.left, top: 230, width: G.width}}>
          {p.kicker ? <div style={{...T.caption, color: C.secondary, fontWeight: 600, ...rise(t, shot.start + 0.1)}}>{p.kicker}</div> : null}
          <div style={{position: 'relative', marginTop: 10, height: 100}}>
            {host && leave < 1 ? <div style={{position: 'absolute', left: 0, top: 0, ...T.display, color: C.ink, ...rise(t, shot.start + 0.18), opacity: 1 - clamp01((t - go) / 0.25), transform: `translateY(${-18 * clamp01((t - go) / 0.25)}px)`}}>{p.title}</div> : null}
            {t >= t1 ? <div style={{position: 'absolute', left: 0, top: 0, ...T.display, color: C.ink, ...rise(t, t1)}}>{p.outline ?? p.title}</div> : null}
          </div>
        </div>

        {hostEl}
        {items}
        {ball}
        {cursor}
      </div>
    </>
  );
};
