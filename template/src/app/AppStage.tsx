// ───────────────────────────────────────────────────────────
// 方案 C · 产品演示引擎
// 连续的 app.* 镜头组成一次「会话」：示意 App 窗口打开后常驻，页面在窗口里切换。
// · 标签栏 = 本期章节（chapters 里带 tab 的项），光标在章节开始时点它
// · 光标：汇总各页面模板声明的动作（点击 / 悬停 / 拖拽），自动规划路径
// · 相机：汇总各页面声明的焦点，平滑推近 / 拉远，像录屏软件的自动跟随
// ───────────────────────────────────────────────────────────
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, T} from '../kit/tokens';
import {Episode, Envelope, Shot} from '../kit/types';
import {Tag, textWidth} from '../kit/components';
import {smooth, clamp01, lerp, flowOut, FLOW_OUT, mix, camEase, morphEase} from '../kit/motion';
import {WIN, BAR_H, TABS_H, TOP, PAD, CW, VIEW, Cam, IDENTITY, camFor} from './geom';
import {APP_TEMPLATES} from './index';
import {Act, Focus, Anchor} from './types';
import {Easing} from 'remotion';
import {OPENER, CAST_FLY, castTray, trayRect, openerBefore} from '../kit/cast';
import {CastTile} from '../templates/Opener';
import {PointerCtx} from './pointer';

const ease = Easing.bezier(0.32, 0.72, 0, 1);
const E = (t: number, at: number, d: number) => ease(clamp01((t - at) / d));

export type Session = {start: number; end: number; shots: Shot[]};
export const sessionsOf = (ep: Episode): Session[] => {
  const out: Session[] = [];
  for (const s of ep.shots) {
    if (!s.template.startsWith('app.')) continue;
    const last = out[out.length - 1];
    if (last && Math.abs(last.end - s.start) < 0.01) { last.shots.push(s); last.end = s.end; }
    else out.push({start: s.start, end: s.end, shots: [s]});
  }
  return out;
};

// ── 承接（carry）：上一页的某个元素长成下一页 ──
// 镜头 props.carry = {anchor: '上一页锚点名', click?: true}；锚点由上一页模板的 anchors() 给出。
export const MORPH = 0.55;
const CONTENT: [number, number, number, number] = [0, TOP, WIN.w, WIN.h - TOP];
const carryOf = (sess: Session, s: Shot): Anchor | null => {
  const c = s.props?.carry; if (!c) return null;
  const i = sess.shots.indexOf(s); if (i <= 0) return null;
  const p = sess.shots[i - 1], tpl = APP_TEMPLATES[p.template];
  return tpl?.anchors?.(p)?.[c.anchor] ?? null;
};
const lerpRect = (a: number[], b: number[], k: number) => a.map((v, i) => lerp(v, b[i], k)) as [number, number, number, number];
const inset = (r: number[], rad: number) => `inset(${r[1]}px ${WIN.w - r[0] - r[2]}px ${WIN.h - r[1] - r[3]}px ${r[0]}px round ${rad}px)`;

// ── 启动承接：窗口从开场里的某个东西长出来 ──
// launch = {from: [x, y, w, h], r, bg}（画面坐标），或 {from: 'opener'}：从开场托盘长出，托盘里的图标飞进这一页
type Launch = {from: [number, number, number, number]; r: number; bg: string; cast?: {items: any[]; opener: Shot}};
const launchOf = (ep: Episode, sess: Session): Launch | null => {
  const l = sess.shots[0].props?.launch;
  if (!l) return null;
  if (l.from === 'opener') {
    const o = openerBefore(ep, sess.shots[0]);
    if (!o) return null;
    return {from: [...trayRect(o.props.cast.length).rect] as any, r: OPENER.trayR, bg: '#FFFFFF', cast: {items: o.props.cast, opener: o}};
  }
  return {from: l.from, r: l.r ?? 24, bg: l.bg ?? '#FFFFFF'};
};
const castEnd = (n: number) => CAST_FLY.delay + (n - 1) * CAST_FLY.stagger + CAST_FLY.dur;

/** 当前画面的相机（背景做视差用） */
export const camOf = (ep: Episode, t: number): Cam => {
  const sess = sessionsOf(ep).find((x) => t >= x.start && t < x.end + FLOW_OUT);
  return sess ? camAt(sess, t) : IDENTITY;
};

/** 这一帧是否处在快速运动里（承接变形、换页、镜头移动、开场图标飞入）→ 需要运动模糊 */
export const appMoving = (ep: Episode, t: number) => sessionsOf(ep).some((sess) => {
  if (t < sess.start - 0.02 || t > sess.end + FLOW_OUT) return false;
  if (sess.shots.some((s) => t >= s.start - 0.02 && t <= s.start + MORPH + 0.1)) return true;
  const L = launchOf(ep, sess);
  if (L?.cast && t <= sess.start + castEnd(L.cast.items.length) + 0.05) return true;
  const fs: Focus[] = sess.shots.flatMap((s) => APP_TEMPLATES[s.template]?.focus(s) ?? []);
  return fs.some((f) => t >= f.at - 0.12 && t <= f.at + 0.72);
});

// 标签栏
const TAB_PAD = 28, TAB_GAP = 6, TAB_Y = BAR_H + 16, TAB_H = 64;
const tabsOf = (ep: Episode) => ep.chapters.filter((c: any) => c.tab).map((c: any) => ({at: c.at, label: c.tab as string}));
const tabGeom = (tabs: {label: string}[]) => {
  // 章节多时自动收窄左右留白（最少 14），保证标签栏不超出窗口
  const text = tabs.reduce((a, tb) => a + textWidth(tb.label, 32), 0);
  const pad = Math.max(14, Math.min(TAB_PAD, (CW - 12 - text - TAB_GAP * (tabs.length - 1)) / (2 * tabs.length)));
  let x = PAD + 6;
  return tabs.map((tb) => { const w = textWidth(tb.label, 32) + pad * 2; const g = {x, w}; x += w + TAB_GAP; return g; });
};

const Tabs: React.FC<{t: number; ep: Episode}> = ({t, ep}) => {
  const tabs = tabsOf(ep), g = tabGeom(tabs);
  if (!tabs.length) return null;
  const i = Math.max(0, tabs.filter((x) => x.at <= t + 0.001).length - 1);
  const pi = Math.max(0, i - 1);
  const k = i === 0 ? 1 : E(t, tabs[i].at, 0.35);
  const x = lerp(g[pi].x, g[i].x, k), w = lerp(g[pi].w, g[i].w, k);
  const last = g[g.length - 1];
  return (
    <div style={{position: 'absolute', left: 0, top: 0}}>
      <div style={{position: 'absolute', left: PAD, top: TAB_Y, width: last.x + last.w - PAD + 6, height: TAB_H + 12, borderRadius: 40, background: '#EEF1F6'}} />
      <div style={{position: 'absolute', left: x, top: TAB_Y + 6, width: w, height: TAB_H, borderRadius: 34, background: '#fff', boxShadow: '0 2px 8px rgba(16,36,58,0.12)'}} />
      {tabs.map((tb, j) => (
        <div key={tb.label} style={{position: 'absolute', left: g[j].x, top: TAB_Y + 6, width: g[j].w, height: TAB_H, display: 'flex', alignItems: 'center', justifyContent: 'center', ...T.caption, fontWeight: 600, color: j === i ? C.ink : C.secondary}}>{tb.label}</div>
      ))}
    </div>
  );
};

// 光标关键帧
type KF = {t: number; x: number; y: number; move: number; click?: boolean; press?: boolean};
const planCursor = (sess: Session, ep: Episode): KF[] => {
  const acts: Act[] = sess.shots.flatMap((s) => APP_TEMPLATES[s.template]?.acts(s) ?? []);
  // 承接点击：光标点上一页的那个元素，它随即长成这一页
  const clicked: number[] = [];
  for (const s of sess.shots) {
    const a = carryOf(sess, s);
    if (a && s.props.carry.click) { const [x, y, w, h] = a.rect; acts.push({at: s.start - 0.1, x: x + Math.min(w * 0.45, 300), y: y + h / 2 + 8, kind: 'click'}); clicked.push(s.start); }
  }
  const tabs = tabsOf(ep), g = tabGeom(tabs);
  tabs.forEach((tb, j) => {
    if (tb.at > sess.start + 0.2 && tb.at < sess.end && !clicked.some((c) => Math.abs(c - tb.at) < 0.1))
      acts.push({at: tb.at - 0.05, x: g[j].x + g[j].w / 2 + 10, y: TAB_Y + TAB_H / 2 + 14, kind: 'click'});
  });
  acts.sort((a, b) => a.at - b.at);
  const kf: KF[] = [{t: sess.start + 0.4, x: WIN.w - 180, y: WIN.h - 120, move: 0}];
  for (const a of acts) {
    const prev = kf[kf.length - 1];
    const gap = a.at - prev.t;
    kf.push({t: a.at, x: a.x, y: a.y, move: Math.max(0.2, Math.min(0.6, gap - 0.05)), click: a.kind === 'click', press: a.kind === 'drag'});
    if (a.kind === 'drag' && a.to) kf.push({t: a.at + (a.dur ?? 0.8), x: a.to[0], y: a.to[1], move: a.dur ?? 0.8});
  }
  return kf;
};
const cursorAt = (kf: KF[], t: number, polish = false) => {
  let i = kf.findIndex((k) => k.t > t);
  if (i === -1) i = kf.length;
  const a = kf[Math.max(0, i - 1)], b = kf[i];
  let x = a.x, y = a.y;
  if (b && !polish) { const p = E(t, b.t - b.move, b.move); x = lerp(a.x, b.x, p); y = lerp(a.y, b.y, p); }
  if (b && polish) {
    // 打磨模式：点击前提前 0.16 秒到位（留出悬停的时间）；路径带一点向上的弧度；快到时冲过头几像素再收回
    const dwell = b.click && b.move >= 0.3 ? 0.16 : 0;
    const raw = clamp01((t - (b.t - b.move)) / (b.move - dwell)), p = ease(raw);
    x = lerp(a.x, b.x, p); y = lerp(a.y, b.y, p);
    const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
    if (dist > 40) {
      const bow = Math.sin(Math.PI * p) * Math.min(46, dist * 0.1) * (dx >= 0 ? -1 : 1);
      x += (-dy / dist) * bow; y += (dx / dist) * bow;
      const over = Math.sin(Math.PI * clamp01((raw - 0.72) / 0.28)) * Math.min(7, dist * 0.02);
      x += (dx / dist) * over; y += (dy / dist) * over;
    }
  }
  // 拖拽中按住；点击瞬间按下
  const dragging = kf.some((k, j) => k.press && kf[j + 1] && t >= k.t && t < kf[j + 1].t);
  const clicking = kf.some((k) => k.click && t >= k.t && t < k.t + 0.14);
  const ripple = kf.filter((k) => k.click && t >= k.t && t < k.t + 0.5).map((k) => ({x: k.x, y: k.y, p: (t - k.t) / 0.5}));
  return {x, y, down: dragging || clicking, ripple};
};

// 相机
const camAt = (sess: Session, t: number): Cam => {
  const fs: Focus[] = sess.shots.flatMap((s) => APP_TEMPLATES[s.template]?.focus(s) ?? []).sort((a, b) => a.at - b.at);
  if (!fs.length) return IDENTITY;
  let i = fs.filter((f) => f.at - 0.1 <= t).length - 1;
  if (i < 0) return IDENTITY;
  const cur = camFor(fs[i].rect, fs[i].scale), prev = i > 0 ? camFor(fs[i - 1].rect, fs[i - 1].scale) : IDENTITY;
  const p = camEase(clamp01((t - (fs[i].at - 0.1)) / 0.8)); // 提前 0.1s 起步，两头慢：跟随感
  return {s: lerp(prev.s, cur.s, p), tx: lerp(prev.tx, cur.tx, p), ty: lerp(prev.ty, cur.ty, p)};
};

// 开场图标飞进页面：从托盘位置沿弧线飞到新页面的锚点（落位后由页面自己的图标接替）
const CastFlight: React.FC<{t: number; ep: Episode; sess: Session; items: any[]; cam: Cam}> = ({t, ep, sess, items, cam}) => {
  const first = sess.shots[0], tpl = APP_TEMPLATES[first.template];
  const anchors = tpl?.anchors?.(first) ?? {};
  const n = items.length, S = OPENER.tile;
  return (
    <>
      {items.map((c, i) => {
        const t0 = sess.start + CAST_FLY.delay + i * CAST_FLY.stagger;
        if (t >= t0 + CAST_FLY.dur) return null;
        const e = morphEase(clamp01((t - t0) / CAST_FLY.dur));
        // 起点：托盘里的位置（画面坐标）→ 换算到相机层里
        const [px, py, ps] = castTray(n, i), sx = (px - cam.tx) / cam.s, sy = (py - cam.ty) / cam.s;
        const a = c.to ? anchors[c.to] : null;
        // 目标：窗口内坐标（相机层里，不用再换算）；没有对应锚点就飞向窗口中部并淡出
        const tr = a ? a.rect : [WIN.w / 2 - 42, WIN.h / 2 - 42, 84, 84];
        const tx = WIN.x + tr[0], ty = WIN.y + tr[1], k = tr[2] / S;
        // 先向上、再横移的弧线（二次贝塞尔）
        const cx = lerp(sx, tx, 0.2), cy = lerp(sy, ty, 0.9);
        const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * tx;
        const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * ty;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: S, height: S, transformOrigin: '0 0', transform: `scale(${lerp(ps / S / cam.s, k, e)})`, opacity: a ? 1 : 1 - e}}>
            <CastTile c={c} ep={ep} size={S} />
          </div>
        );
      })}
    </>
  );
};

const Chrome: React.FC<{title: string}> = ({title}) => (
  <>
    <div style={{position: 'absolute', left: 0, top: 0, width: WIN.w, height: BAR_H, borderBottom: '2px solid #EEF1F6'}}>
      {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: 30 + i * 26, top: BAR_H / 2 - 8, width: 16, height: 16, borderRadius: 8, background: '#D5DCE7'}} />)}
      <div style={{position: 'absolute', left: 0, width: WIN.w, top: 0, height: BAR_H, display: 'flex', alignItems: 'center', justifyContent: 'center', ...T.caption, fontWeight: 600, color: C.ink}}>{title}</div>
      <div style={{position: 'absolute', right: 20, top: (BAR_H - 50) / 2}}><Tag>示意界面</Tag></div>
    </div>
  </>
);

export const AppStage: React.FC<{t: number; ep: Episode; env: Envelope; sess: Session}> = ({t, ep, env, sess}) => {
  if (t < sess.start || t >= sess.end + FLOW_OUT) return null;
  const open = smooth(t, sess.start + 0.15, 0.55); // 等上一镜先退出，再打开窗口
  // 启动承接：窗口从上一镜里的某个东西（开场托盘 / 角色桌上的工具托盘）长出来
  const launch = launchOf(ep, sess);
  const le = launch ? morphEase(clamp01((t - sess.start - 0.05) / 0.65)) : 1;
  const lr = launch ? lerpRect([launch.from[0] - WIN.x, launch.from[1] - WIN.y, launch.from[2], launch.from[3]], [0, 0, WIN.w, WIN.h], le) : null;
  const exit = t >= sess.end ? flowOut(t, sess.end) : {};
  const polish = (ep as any).motion?.polish !== false;  // 动效打磨（v5.3 起默认开；写 "motion": {"polish": false} 关掉）
  // 不做「镜头慢呼吸」：缓慢漂移会被动态自查判为问题（见 scripts/motion_audit.py）。待机靠真实变化填，不靠镜头漂。
  const cam = camAt(sess, t);
  const cur = cursorAt(planCursor(sess, ep), t, polish);
  const appTitle = (ep as any).app?.title ?? '口播工作台';
  return (
    <AbsoluteFill style={{...exit, WebkitMaskImage: `linear-gradient(to bottom, #000 ${VIEW.bottom - 40}px, transparent ${VIEW.bottom}px)`}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})`}}>
        {/* 窗口 */}
        {lr ? <div style={{position: 'absolute', left: WIN.x + lr[0], top: WIN.y + lr[1], width: lr[2], height: lr[3], borderRadius: lerp(launch.r ?? 24, 36, le),
          background: mix(launch.bg ?? '#FFFFFF', '#FFFFFF', le), boxShadow: `0 ${lerp(10, 50, le)}px ${lerp(24, 100, le)}px -${lerp(4, 30, le)}px rgba(16,36,58,${lerp(0.18, 0.3, le)})`}} /> : null}
        <div style={{position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, borderRadius: 36, background: '#fff', overflow: 'hidden',
          boxShadow: lr ? 'none' : '0 50px 100px -30px rgba(16,36,58,0.30), 0 0 0 1.5px rgba(16,36,58,0.06)',
          ...(lr ? {clipPath: inset(lr, lerp(launch.r ?? 24, 36, le)), background: 'transparent'} : {opacity: clamp01(open * 1.6), transform: `translateY(${(1 - open) * 60}px) scale(${0.94 + 0.06 * open})`, transformOrigin: '50% 60%'})}}>
          <div style={{position: 'absolute', inset: 0, opacity: lr ? clamp01((le - 0.35) / 0.5) : 1}}>
          <PointerCtx.Provider value={{polish, x: cur.x, y: cur.y, t}}>
          <Chrome title={appTitle} />
          <Tabs t={t} ep={ep} />
          {/* 页面：有承接时，上一页的元素长成这一页；没有承接时才推入推出 */}
          <div style={{position: 'absolute', left: 0, top: 0, width: WIN.w, height: WIN.h, clipPath: `inset(${TOP}px 0 0 0)`}}>
            {sess.shots.map((s, k) => {
              const next = sess.shots[k + 1];
              const nextCarry = next ? carryOf(sess, next) : null;
              const keep = nextCarry ? MORPH + 0.05 : 0.2;
              if (t < s.start || t >= s.end + keep) return null;
              const tpl = APP_TEMPLATES[s.template];
              if (!tpl) return null;
              const a = carryOf(sess, s);
              // 自己又被下一页承接时，在下一页长大的过程中淡掉
              const outFade = nextCarry && t >= s.end ? 1 - clamp01((t - s.end) / (MORPH * 0.6)) : 1;
              if (a) {
                const e = morphEase(clamp01((t - s.start) / MORPH));
                const R = lerpRect(a.rect, CONTENT, e), rad = lerp(a.r, 0, e);
                return (
                  <React.Fragment key={s.id}>
                    {e < 1 ? <div style={{position: 'absolute', left: R[0], top: R[1], width: R[2], height: R[3], borderRadius: rad, background: mix(a.bg, '#FFFFFF', e), boxShadow: `0 ${20 * (1 - e)}px 40px rgba(16,36,58,${0.18 * (1 - e)})`}} /> : null}
                    <div style={{position: 'absolute', inset: 0, clipPath: e < 1 ? inset(R, rad) : undefined, opacity: clamp01((e - 0.3) / 0.5) * outFade}}><tpl.Page t={t} shot={s} ep={ep} env={env} /></div>
                  </React.Fragment>
                );
              }
              if (nextCarry) {
                // 被承接的旧页：原地不动，边上的内容在新页长大时淡掉，只留下长大的那个元素
                return <div key={s.id} style={{position: 'absolute', inset: 0, opacity: outFade}}><tpl.Page t={t} shot={s} ep={ep} env={env} /></div>;
              }
              // 先退后进：旧页 0.18s 左移淡出，新页延迟 0.12s 从右推入
              const inP = s.start === sess.start ? 1 : smooth(t, s.start + 0.12, 0.45);
              const outP = t >= s.end ? clamp01((t - s.end) / 0.18) : 0;
              const st = {opacity: Math.min(clamp01(inP * 1.4), 1 - outP), transform: `translateX(${(1 - inP) * 70 - outP * 70}px)`};
              return <div key={s.id} style={{position: 'absolute', inset: 0, ...st}}><tpl.Page t={t} shot={s} ep={ep} env={env} /></div>;
            })}
          </div>
          </PointerCtx.Provider>
          </div>
        </div>
        {/* 光标（在窗口坐标系里，跟相机一起缩放） */}
        {launch?.cast ? <CastFlight t={t} ep={ep} sess={sess} items={launch.cast.items} cam={cam} /> : null}
        <div style={{position: 'absolute', left: WIN.x, top: WIN.y, opacity: clamp01((t - sess.start - 0.4) / 0.3)}}>
          {cur.ripple.map((r, i) => (
            <div key={i} style={{position: 'absolute', left: r.x - 8 - 36 * r.p, top: r.y - 8 - 36 * r.p, width: 16 + 72 * r.p, height: 16 + 72 * r.p, borderRadius: '50%', border: `4px solid ${C.voice}`, opacity: 0.6 * (1 - r.p)}} />
          ))}
          <svg width={48} height={48} viewBox="0 0 24 24" style={{position: 'absolute', left: cur.x, top: cur.y, transform: `scale(${cur.down ? 0.86 : 1})`, transformOrigin: '0 0', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.25))'}}>
            <path d="M3 2 L3 19 L7.6 14.8 L10.6 21.6 L13.4 20.4 L10.5 13.8 L16.8 13.6 Z" fill="#111" stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
