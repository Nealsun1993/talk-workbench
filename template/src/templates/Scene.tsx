// 模板 scene · 概念场景（v5.2 试用）：不开窗口，画面中央放一两个界面碎片 + 一个大关键词（参考 FredTalk 的讲法）
// 一个镜头由若干 pieces 叠成，每个 piece 自己按 at 出场；坐标都是画面坐标（1080×1920），y 是中心线。
// pieces[].kind:
//   text     {text, at, y, size?, cps?, mark?: {word, at, tone?}, out?}   逐字打出；mark 是荧光笔扫过某个词；out 时上移淡出
//   toggles  {at, y, items: [{label, type: 'toggle'|'check', on?, flipAt?, emphAt?}]}   几张小卡片：开关可拨动，emphAt 时卡片反黑强调
//   stack    {at, y, n?, hero?: {logo, name, at}}   几张骨架卡片斜着叠上来；hero 时真正的那张落到最上面，其余散开变淡
//   image    {src, size: [w, h], at, y, w, label, mark?: {x, y, w, h, at}}   真实截图卡片，mark 用截图像素坐标
//   count    {at, y, to, dur?, unit?, sub?, out?}   大数字从 0 数到 to；out 时上移淡出
//   input    {at, y, text, typeAt, sendAt, placeholder?, button?}   评论输入框：打字 → 点发送 → 冒出一条评论
//   cursor   {from: [x, y], in, keys: [{at, x, y, click?}]}   光标（一个镜头最多一次关键点击）
//   cover    {at, focusAt, coverAt, y, image, tag?, label?}   自制示意：一张文稿卡 → 三行重点变深 → 卡片变宽成封面，三行重点变成封面标题
//   article  {at, y, readAt, readEnd, slots: [at…], fills: [at…], grid, tag?, label?}   自制示意：长文骨架 → 扫读 → 三处配图位亮起 → 填入同一风格的图（grid = 四宫格图）
//   wall     {y, cols?, size?, gap?, items: [{src, dur, code, label, at}], focus?: [{index, from, to}], allAt?}   组件墙：每格循环播放一段真实画面，标代码名；focus 时那一格放大加黑框、其余变淡
//   decks    {y, at, step?, items: [{src?, name, ok}], popAt?, liftAt?, pickAt?, badAt?, goodAt?, shakeAt?, note?}   六份 PPT 发牌排成 3×2；popAt 时整组依次弹一下；liftAt 时 ok=false 的三张抬起，pickAt 时 ok=true 的变暗；写了 badAt / goodAt 才盖「改不了」「能改」
//   chooser  {y, at, rows: [{need, sub, picks: [{text, at}], tag, tagAt?, at}], saveAt?}   选择图：按需求一行一行亮起，说到哪个名字哪个变黑，saveAt 时角上弹出「先存下来」
//   slides   {y, w?, h?, items: [{src, size: [w, h], at, video?, from?}], label?, flag?: {at, text}, punch?: [{at, x, y, s}]}   示例轮播：新的一张从右边推进来；video 为真实录屏；flag 是压在图上的提醒条；punch 时镜头推到图上某处（x、y 为 0–1，s 为倍数，s=1 退回全图），0.45 秒到位后停住
//   chips    {y, items: [{text, at, tone?: 'plain'|'ink'|'voice'|'problem', icon?}]}   一行标签，按时间弹出
//   verdict  {y, at, rows: [{ok, text, at}], thumb?, tag?, icon?}   判断卡：顶上一张示例图 + 输出格式标签，下面适合（勾）/ 别选（叉）
//   poll     {y, options: [{key, text, at}]}   选择题：三个选项依次弹出
//   file     {y, at, badge, icon?, pages?: [at…], label?, out?}   自制示意：一份文件卡（icon 默认 file-ppt），pages 时右边多出一页
//   prompt   {y, at, text, typeAt, sendAt?, cps?, label?, attach?: {text, at}}   对 Agent 说的一句话：对话框里逐字打出，点发送
//   flow     {y, at, steps: [{icon, label, at}], final?: {at, y, badge}}   几步图标依次点亮（少字流程），最后落到一张文件卡
//   film     {at, src, len, hold, screen?: {x, y, w, h, at, src}, notes?: [{text, at}], notesY, box?: {x, y, at, label}, labels?: [{text, x, y, w, h, rot?, size?, at, hlAt?}]}   整屏动画素材（如 Omni 角色表演）+ 屏幕里放视频、便签、箱子上的字
//   bill     {y, at, label, rows: [{name, icon, amount?, at}], total: {to, unit, at, sub?: {text, at}}}   账单卡：说到哪项加一行，没念金额的用灰块；合计从 0 滚上去
//   split    {y, at, cards: [{title, icon, note?: {text, at}}, …], lens: [{at}, {at}], splitAt, result: {title, titleAt?, sub?}, subAt?, pushAt?}   放大镜分屏：两种做法上下叠放，放大镜说到哪张看哪张；splitAt 上下分开露出中间的答案卡，pushAt 答案卡往前推
//   terminal {at, y, w?, h?, fs?, title?, label?, out?, lines: [{text, at, tone?: 'fg'|'dim'|'ok'|'warn', hlAt?, progress?: {total, end, label?}}], x?}   终端：照真实日志一行行重绘；写 x 时嵌进画面里的屏幕（左上角 x, y）
//   flood    {at, out, title, kicker?, no?, color?, fg?, size?}   整屏色块章节卡：色块铺满、巨字砸入、描边大序号，out 时往上退走（10-21 试行，只用在章节切换）
//   kit      {y, at, openAt, boxAt, envAt, flyAt, bookLabel?}   自制插画（粗线卡通）：风格说明书翻开、露出几种 PPT 风格；AI 工具包打开、弹出扳手、AI 星星和安装说明；最后两样一起飞进信封
import React from 'react';
import {Img, Loop, OffthreadVideo, Sequence, staticFile, interpolate, Easing} from 'remotion';
import {C, T, MONO} from '../kit/tokens';
import {Icon} from '../kit/components';
import {snap, mix, clamp01, lerp, springIn, popUp, morphEase} from '../kit/motion';
import {assetPath} from '../kit/types';
import {TemplateProps} from './types';

const ease = (t: number, a: number, d: number, e = Easing.bezier(0.16, 1, 0.3, 1)) =>
  interpolate(t, [a, a + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});
const CARD: React.CSSProperties = {position: 'absolute', background: '#FFFFFF', borderRadius: 28, boxShadow: '0 1px 2px rgba(16,36,58,0.05), 0 18px 40px -8px rgba(16,36,58,0.16)'};
const GRAY = '#E3E8EF';
const HL = {voice: 'rgba(40,91,240,0.22)', problem: 'rgba(255,121,92,0.35)'};
const ARROW = 'M3 2 L3 19 L7.6 14.8 L10.6 21.6 L13.4 20.4 L10.5 13.8 L16.8 13.6 Z';

/** 荧光笔：包住一段字，背后一条色块从左往右扫出来 */
const Marker: React.FC<{p: number; tone?: string; children: React.ReactNode}> = ({p, tone, children}) => (
  <span style={{position: 'relative', zIndex: 0}}>
    <span style={{position: 'absolute', left: -10, top: '18%', height: '72%', width: `calc((100% + 20px) * ${p})`, background: HL[tone === 'problem' ? 'problem' : 'voice'], borderRadius: 8, zIndex: -1}} />
    {children}
  </span>
);

const TextPiece = ({t, d}: any) => {
  if (t < d.at) return null;
  const outP = d.out != null ? ease(t, d.out, 0.25, Easing.in(Easing.quad)) : 0;
  if (outP >= 1) return null;
  const chars = [...d.text], n = Math.floor((t - d.at) / (d.cps ?? 0.09)) + 1;
  const mi = d.mark ? d.text.indexOf(d.mark.word) : -1, ml = d.mark ? [...d.mark.word].length : 0;
  const ch = (c: string, i: number) => <span key={i} style={{opacity: i < n ? 1 : 0}}>{c}</span>;
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, top: d.y - (d.size ?? 112) * 0.7, textAlign: 'center', ...T.display, fontSize: d.size ?? 112, lineHeight: 1.4, fontWeight: 700, color: C.ink,
      opacity: 1 - outP, transform: `translateY(${-30 * outP}px)`}}>
      {mi < 0 ? chars.map(ch) : (
        <>
          {chars.slice(0, mi).map(ch)}
          <Marker p={ease(t, d.mark.at, 0.35, Easing.out(Easing.quad))} tone={d.mark.tone}>{chars.slice(mi, mi + ml).map((c, k) => ch(c, mi + k))}</Marker>
          {chars.slice(mi + ml).map((c, k) => ch(c, mi + ml + k))}
        </>
      )}
    </div>
  );
};

const TogglesPiece = ({t, d}: any) => {
  const W = 320, H = 250, GAP = 40, n = d.items.length, x0 = 540 - (n * W + (n - 1) * GAP) / 2;
  return d.items.map((it: any, i: number) => {
    const at = d.at + i * 0.1;
    if (t < at) return null;
    const em = it.emphAt != null ? snap(t, it.emphAt) : 0;
    const fg = mix(C.ink, '#FFFFFF', em);
    const on = it.flipAt != null ? (it.on ? 1 - snap(t, it.flipAt) : snap(t, it.flipAt)) : it.on ? 1 : 0;
    return (
      <div key={i} style={{...CARD, left: x0 + i * (W + GAP), top: d.y - H / 2, width: W, height: H, background: mix('#FFFFFF', C.ink, em), ...popUp(t, at),
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34}}>
        <div style={{...T.heading, fontSize: 44, fontWeight: 600, color: fg}}>{it.label}</div>
        {it.type === 'check' ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {[0, 1, 2].map((k) => (
              <div key={k} style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <Icon name="check" size={30} color={fg} />
                <div style={{width: 120 - k * 24, height: 8, borderRadius: 4, background: em > 0.5 ? 'rgba(255,255,255,0.45)' : GRAY}} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{position: 'relative', width: 140, height: 70, borderRadius: 35, background: mix(GRAY, C.ink, on)}}>
            <div style={{position: 'absolute', top: 7, left: lerp(7, 77, on), width: 56, height: 56, borderRadius: 28, background: '#FFFFFF', boxShadow: '0 2px 6px rgba(16,36,58,0.25)'}} />
          </div>
        )}
      </div>
    );
  });
};

const StackPiece = ({t, d, ep}: any) => {
  const n = d.n ?? 3, W = 290, H = 360;
  const h = d.hero ? springIn(t, d.hero.at) : 0, hp = Math.min(1, h);
  const slots = n === 3 ? [[-230, 30, -9], [0, 0, 0], [230, 30, 9]] : Array.from({length: n}, (_, i) => [(i - (n - 1) / 2) * 200, 0, (i - (n - 1) / 2) * 6]);
  const cards = slots.map(([dx, dy, rot], i) => {
    const at = d.at + i * 0.12;
    if (t < at) return null;
    const s = springIn(t, at);
    const x = 540 + dx * (1 + 0.28 * hp) - W / 2, y = d.y + dy + (1 - Math.min(1, s)) * 220 - H / 2;
    return (
      <div key={i} style={{...CARD, left: x, top: y, width: W, height: H, opacity: clamp01((t - at) / 0.12) * (1 - 0.55 * hp), transform: `rotate(${rot * (1 + 0.4 * hp)}deg) scale(${1 - 0.08 * hp})`, padding: 34, boxSizing: 'border-box'}}>
        <div style={{width: 92, height: 92, borderRadius: 24, background: GRAY}} />
        <div style={{marginTop: 34, width: 180, height: 22, borderRadius: 11, background: GRAY}} />
        <div style={{marginTop: 18, width: 140, height: 16, borderRadius: 8, background: '#EEF1F5'}} />
        <div style={{marginTop: 12, width: 160, height: 16, borderRadius: 8, background: '#EEF1F5'}} />
      </div>
    );
  });
  const HW = 340, HH = 420;
  return (
    <>
      {cards}
      {d.hero && t >= d.hero.at ? (
        <div style={{...CARD, left: 540 - HW / 2, top: d.y - HH / 2 + (1 - hp) * -260, width: HW, height: HH, opacity: clamp01((t - d.hero.at) / 0.1), transform: `scale(${1.12 - 0.12 * h})`,
          boxShadow: '0 30px 70px -12px rgba(16,36,58,0.32)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30}}>
          <Img src={staticFile(assetPath(ep, d.hero.logo))} style={{width: 170, height: 170, borderRadius: 40}} />
          <div style={{...T.display, fontSize: 64, fontWeight: 700, color: C.ink}}>{d.hero.name}</div>
        </div>
      ) : null}
    </>
  );
};

const ImagePiece = ({t, d, ep}: any) => {
  if (t < d.at) return null;
  const k = d.w / d.size[0], h = d.size[1] * k, s = springIn(t, d.at);
  const sweep = d.mark ? ease(t, d.mark.at, 0.4, Easing.out(Easing.quad)) : 0;
  return (
    <div style={{position: 'absolute', left: 540 - d.w / 2 - 16, top: d.y - h / 2 - 16, opacity: clamp01((t - d.at) / 0.15), transform: `translateY(${(1 - Math.min(1, s)) * 90}px) rotate(${(1 - s) * 4}deg)`}}>
      {d.label ? <div style={{position: 'absolute', left: 16, top: -56, ...T.caption, fontWeight: 600, color: C.secondary, whiteSpace: 'nowrap'}}>{d.label}</div> : null}
      <div style={{...CARD, position: 'relative', padding: 16, borderRadius: 24}}>
        <div style={{position: 'relative', width: d.w, height: h, borderRadius: 12, overflow: 'hidden'}}>
          <Img src={staticFile(assetPath(ep, d.src))} style={{width: d.w, height: h, display: 'block'}} />
          {d.mark && sweep > 0 ? <div style={{position: 'absolute', left: (d.mark.x - 6) * k, top: (d.mark.y - 3) * k, width: (d.mark.w + 12) * k * sweep, height: (d.mark.h + 6) * k, background: HL.voice, mixBlendMode: 'multiply', borderRadius: 4}} /> : null}
        </div>
      </div>
    </div>
  );
};

const CountPiece = ({t, d}: any) => {
  if (t < d.at) return null;
  const outP = d.out != null ? ease(t, d.out, 0.25, Easing.in(Easing.quad)) : 0;   // out：上移淡出（10-21 加）
  if (outP >= 1) return null;
  const v = Math.round(d.to * ease(t, d.at, d.dur ?? 0.8, Easing.out(Easing.cubic)));
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, top: d.y - 130 - 30 * outP, textAlign: 'center', ...popUp(t, d.at, 30), opacity: 1 - outP}}>
      <div style={{display: 'inline-flex', alignItems: 'baseline', gap: 12, color: C.ink}}>
        <span style={{...T.display, fontSize: 210, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{v}</span>
        {d.unit ? <span style={{...T.display, fontSize: 72, fontWeight: 700}}>{d.unit}</span> : null}
      </div>
      {d.sub ? <div style={{...T.body, fontWeight: 600, color: C.secondary, marginTop: 18}}>{d.sub}</div> : null}
    </div>
  );
};

const InputPiece = ({t, d}: any) => {
  if (t < d.at) return null;
  const W = 840, H = 124, x = 540 - W / 2;
  const chars = [...d.text], n = t >= d.typeAt ? Math.min(chars.length, Math.floor((t - d.typeAt) / 0.14) + 1) : 0;
  const sent = t >= d.sendAt + 0.12;
  const press = t >= d.sendAt && t < d.sendAt + 0.14 ? 0.92 : 1;
  const b = springIn(t, d.sendAt + 0.12);
  return (
    <>
      {sent ? (
        <div style={{position: 'absolute', left: x, top: d.y - H / 2 - 190, display: 'flex', alignItems: 'center', gap: 22, opacity: clamp01((t - d.sendAt - 0.12) / 0.12),
          transform: `translateY(${(1 - Math.min(1, b)) * 60}px) scale(${0.9 + 0.1 * b})`, transformOrigin: 'left center'}}>
          <div style={{width: 84, height: 84, borderRadius: 42, background: GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name="user-circle-plus" size={50} color="#9AA8B8" /></div>
          <div style={{...CARD, position: 'relative', padding: '20px 34px', borderRadius: 30, ...T.heading, fontSize: 48, fontWeight: 600, color: C.ink}}>{d.text}</div>
        </div>
      ) : null}
      <div style={{...CARD, left: x, top: d.y - H / 2, width: W, height: H, borderRadius: H / 2, ...popUp(t, d.at), display: 'flex', alignItems: 'center', paddingLeft: 48, boxSizing: 'border-box'}}>
        <div style={{flex: 1, ...T.heading, fontSize: 48, fontWeight: 600, color: n && !sent ? C.ink : '#A5B1BF'}}>
          {n && !sent ? chars.slice(0, n).join('') : d.placeholder ?? '说点什么…'}
          {n && !sent && Math.floor(t * 2.5) % 2 === 0 ? <span style={{color: C.ink, fontWeight: 400}}>|</span> : null}
        </div>
        <div style={{width: 168, height: 88, marginRight: 18, borderRadius: 44, background: C.problem, color: '#FFFFFF', ...T.heading, fontSize: 40, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${press})`}}>{d.button ?? '发送'}</div>
      </div>
    </>
  );
};

const CursorPiece = ({t, d}: any) => {
  const keys: any[] = d.keys, last = keys[keys.length - 1];
  if (t < d.in || t > last.at + 0.8) return null;
  const kf = [{at: d.in, x: d.from[0], y: d.from[1]}, ...keys];
  let x = kf[0].x, y = kf[0].y;
  for (let i = 1; i < kf.length; i++) {
    const mv = Math.min(0.7, kf[i].at - kf[i - 1].at - 0.05);
    const p = ease(t, kf[i].at - mv, mv, Easing.inOut(Easing.sin));
    x = lerp(x, kf[i].x, p); y = lerp(y, kf[i].y, p);
  }
  const click = keys.find((k) => k.click && t >= k.at && t < k.at + 0.5);
  const rp = click ? (t - click.at) / 0.5 : -1;
  const down = keys.some((k) => k.click && t >= k.at && t < k.at + 0.14);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: clamp01((t - d.in) / 0.2) * (1 - clamp01((t - last.at - 0.45) / 0.3))}}>
      {rp >= 0 ? <div style={{position: 'absolute', left: x - 8 - 60 * rp, top: y - 8 - 60 * rp, width: 16 + 120 * rp, height: 16 + 120 * rp, borderRadius: '50%', border: `4px solid ${C.ink}`, opacity: 0.4 * (1 - rp)}} /> : null}
      <svg width={56} height={56} viewBox="0 0 24 24" style={{position: 'absolute', left: x, top: y, transform: `scale(${down ? 0.86 : 1})`, transformOrigin: '0 0', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.25))'}}>
        <path d={ARROW} fill="#111" stroke="#fff" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// 终端：深色卡片里按时间一行行出现（照真实日志重绘）。progress 行从 0 数到 total；hl 行在 hlAt 时被一条蓝色高亮扫过。
// 写了 x 时是「嵌进画面里的屏幕」：左上角放在 (x, y)、宽高 w × h，没有标题栏和阴影（例如叠在角色动画里的笔记本屏幕上）
const TERM = {bg: '#12161D', fg: '#D8DEE8', dim: '#7D8794', ok: '#6FD08C', warn: '#FF9B82'};
const TerminalPiece = ({t, d}: any) => {
  if (t < d.at) return null;
  const outP = d.out != null ? ease(t, d.out, 0.25, Easing.in(Easing.quad)) : 0;
  if (outP >= 1) return null;
  const inset = d.x != null, fs = d.fs ?? 34, lh = fs * 1.55, pad = inset ? fs * 0.6 : 40, bar = inset ? 0 : 64;
  const W = d.w ?? 920, H = d.h ?? bar + pad * 2 + d.lines.length * lh;
  const left = inset ? d.x : 540 - W / 2, top = inset ? d.y : d.y - H / 2, s = springIn(t, d.at);
  return (
    <>
      <div style={{position: 'absolute', left, top: top + (inset ? 0 : (1 - Math.min(1, s)) * 60), width: W, height: H, borderRadius: inset ? 8 : 24, background: TERM.bg, overflow: 'hidden',
        boxShadow: inset ? 'none' : '0 18px 40px -8px rgba(16,36,58,0.35)', opacity: clamp01((t - d.at) / 0.15) * (1 - outP)}}>
        {inset ? null : (
          <div style={{height: bar, display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 28, borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />)}
            <div style={{marginLeft: 18, fontFamily: MONO, fontSize: 26, color: TERM.dim}}>{d.title ?? 'terminal'}</div>
          </div>
        )}
        <div style={{padding: pad}}>
          {d.lines.map((l: any, i: number) => {
            if (t < l.at) return null;
            let text = l.text;
            if (l.progress) {
              const p = ease(t, l.at, l.progress.end - l.at, Easing.out(Easing.quad)), n = Math.round(l.progress.total * p), k = Math.round(14 * p);
              text = `[${'█'.repeat(k)}${'░'.repeat(14 - k)}] ${n}/${l.progress.total} ${l.progress.label ?? ''}`;
            }
            const hl = l.hlAt != null ? ease(t, l.hlAt, 0.35, Easing.out(Easing.quad)) : 0;
            return (
              <div key={i} style={{position: 'relative', height: lh, display: 'flex', alignItems: 'center', fontFamily: MONO, fontSize: fs, whiteSpace: 'pre', color: TERM[(l.tone ?? 'fg') as keyof typeof TERM],
                opacity: clamp01((t - l.at) / 0.1), transform: `translateX(${(1 - clamp01((t - l.at) / 0.12)) * 12}px)`}}>
                {hl > 0 ? <div style={{position: 'absolute', left: -10, top: lh * 0.1, height: lh * 0.8, width: `calc((100% + 20px) * ${hl})`, background: 'rgba(40,91,240,0.55)', borderRadius: 6}} /> : null}
                <span style={{position: 'relative'}}>{text}</span>
              </div>
            );
          })}
        </div>
      </div>
      {d.label && !inset ? <Note x={140} y={top + H + 22} w={800} text={d.label} o={clamp01((t - d.at - 0.3) / 0.3) * (1 - outP)} /> : null}
    </>
  );
};

// 整屏色块章节卡（借鉴 huashu-art-motion 动态文字语法，10-21 试行）：色块从下往上铺满（盖住章节栏），巨字砸进来，
// 右下角一个描边大序号；out 时色块继续往上退走，露出下面的场景。只用在章节切换，和浅纸色底形成反差
const FloodPiece = ({t, d}: any) => {
  if (t < d.at) return null;
  const inP = ease(t, d.at, 0.32, Easing.out(Easing.exp)), outP = d.out != null ? ease(t, d.out, 0.28, Easing.in(Easing.cubic)) : 0;
  if (outP >= 1) return null;
  const top = 1920 * (1 - inP) - 1920 * outP, slam = Math.min(1, springIn(t, d.at + 0.18)), fg = d.fg ?? '#FFFFFF';
  return (
    <div style={{position: 'absolute', left: 0, top, width: 1080, height: 1920, background: d.color ?? C.voice, overflow: 'hidden'}}>
      {d.no ? <div style={{position: 'absolute', right: -30, bottom: 120, ...T.display, fontSize: 760, fontWeight: 800, lineHeight: 1, color: 'transparent', WebkitTextStroke: `6px ${fg}`, opacity: 0.22 * clamp01((t - d.at - 0.2) / 0.3)}}>{d.no}</div> : null}
      {d.kicker ? <div style={{position: 'absolute', left: 90, top: 560, ...T.heading, fontSize: 52, fontWeight: 700, color: fg, opacity: clamp01((t - d.at - 0.15) / 0.2), letterSpacing: 4}}>{d.kicker}</div> : null}
      <div style={{position: 'absolute', left: 80, top: 640, ...T.display, fontSize: d.size ?? 260, fontWeight: 800, lineHeight: 1.05, color: fg, whiteSpace: 'nowrap',
        opacity: clamp01((t - d.at - 0.18) / 0.08), transform: `scale(${1.25 - 0.25 * slam})`, transformOrigin: 'left center'}}>{d.title}</div>
    </div>
  );
};

/** 小标签：自制示意 / 来源 */
const Note: React.FC<{x: number; y: number; w: number; text: string; o?: number}> = ({x, y, w, text, o = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, textAlign: 'center', ...T.caption, fontWeight: 600, color: C.secondary, opacity: o, whiteSpace: 'nowrap'}}>{text}</div>
);

// 自制示意：文稿 → 提炼三行重点 → 封面。同一张卡片一路变过去，三行重点最后成为封面上的标题。
const CoverPiece = ({t, d, ep}: any) => {
  if (t < d.at) return null;
  const f = ease(t, d.focusAt, 0.4), m = interpolate(t, [d.coverAt, d.coverAt + 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: morphEase});
  const w = lerp(420, 800, m), h = lerp(520, 450, m), x = 540 - w / 2, y = d.y - h / 2, s = springIn(t, d.at);
  const N = 9, KEY = [1, 4, 6], lw = [300, 340, 250, 330, 310, 220, 290, 340, 180];
  const imgW = 800 * 0.46;
  return (
    <>
      <div style={{...CARD, left: x, top: y + (1 - Math.min(1, s)) * 80, width: w, height: h, overflow: 'hidden', opacity: clamp01((t - d.at) / 0.15)}}>
        <div style={{position: 'absolute', left: 36, top: 28, ...T.caption, fontSize: 28, fontWeight: 600, color: C.secondary, opacity: 1 - m}}>{d.tag ?? '文章 / 字幕'}</div>
        {/* 封面左侧的图 */}
        <div style={{position: 'absolute', left: 0, top: 0, width: imgW, height: 450, opacity: m, overflow: 'hidden'}}>
          <Img src={staticFile(assetPath(ep, d.image))} style={{width: imgW, height: 450, objectFit: 'cover'}} />
        </div>
        {Array.from({length: N}, (_, i) => {
          const k = KEY.indexOf(i), key = k >= 0;
          const x0 = 40, y0 = 88 + i * 46;                                   // 文稿里的位置
          const x1 = imgW + 44, y1 = 120 + k * 78;                            // 封面里的位置（只有三行重点会过去）
          const wd = key ? lerp(lw[i], [330, 280, 200][k], m) : lw[i], ht = key ? lerp(16 + 4 * f, 34 - 8 * k, m) : 16;
          return <div key={i} style={{position: 'absolute', left: key ? lerp(x0, x1, m) : x0, top: key ? lerp(y0, y1, m) : y0, width: wd, height: ht, borderRadius: ht / 2,
            background: key ? mix(GRAY, C.ink, f) : GRAY, opacity: key ? 1 : (1 - 0.7 * f) * (1 - clamp01(m * 2.5))}} />;
        })}
      </div>
      <Note x={140} y={d.y + 284} w={800} text={d.label ?? '自制示意'} o={clamp01((t - d.at - 0.3) / 0.3)} />
    </>
  );
};

// 自制示意：长文骨架。扫读一遍 → 三处配图位依次亮起 → 填入同一风格的三张图（取四宫格里的三格）。
const ArticlePiece = ({t, d, ep}: any) => {
  if (t < d.at) return null;
  const W = 640, H = 900, x = 540 - W / 2, y = d.y - H / 2, s = springIn(t, d.at), IN = 44, BW = 230, BH = 150;
  const read = interpolate(t, [d.readAt, d.readEnd], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rows: React.ReactNode[] = []; let cy = 132, slot = 0;
  const line = (key: string, lx: number, ly: number, lw: number, o = 1) => <div key={key} style={{position: 'absolute', left: lx, top: ly, width: lw, height: 14, borderRadius: 7, background: GRAY, opacity: o}} />;
  for (let para = 0; para < 6; para++) {
    if (para % 2 === 1) {                                                   // 带配图位的一段：左边 230×150 是图位，右边是字
      const k = slot++, a = snap(t, d.slots[k]), fl = t >= d.fills[k] ? springIn(t, d.fills[k]) : 0, col = k % 2, row = Math.floor(k / 2);
      for (let j = 0; j < 4; j++) {
        rows.push(line(`l${para}${j}`, IN, cy + 14 + j * 36, BW, 1 - a));                                  // 图位里原来的字，亮起时让开
        rows.push(line(`r${para}${j}`, IN + BW + 24, cy + 14 + j * 36, [300, 270, 300, 180][j]));
      }
      rows.push(<div key={'box' + para} style={{position: 'absolute', left: IN, top: cy, width: BW, height: BH, borderRadius: 16, boxSizing: 'border-box', border: `3px dashed ${C.ink}`, background: HL.voice,
        opacity: a * (1 - Math.min(1, fl)), transform: `scale(${0.92 + 0.08 * a})`}} />);
      if (fl > 0) rows.push(
        <div key={'img' + para} style={{position: 'absolute', left: IN, top: cy, width: BW, height: BH, borderRadius: 16, overflow: 'hidden', transform: `scale(${0.8 + 0.2 * fl})`, opacity: clamp01((t - d.fills[k]) / 0.1), boxShadow: '0 8px 18px rgba(16,36,58,0.18)'}}>
          <Img src={staticFile(assetPath(ep, d.grid))} style={{position: 'absolute', width: BW * 2, height: BW * 2, left: -col * BW, top: -row * BW - 22}} />
        </div>);
      cy += BH + 22;
    } else {
      for (let j = 0; j < 2; j++) rows.push(line(`p${para}${j}`, IN, cy + j * 34, [552, 380][j]));
      cy += 2 * 34 + 10;
    }
  }
  return (
    <>
      <div style={{...CARD, left: x, top: y + (1 - Math.min(1, s)) * 80, width: W, height: H, overflow: 'hidden', opacity: clamp01((t - d.at) / 0.15)}}>
        <div style={{position: 'absolute', left: IN, top: 40, width: 360, height: 34, borderRadius: 17, background: C.ink}} />
        <div style={{position: 'absolute', left: IN, top: 90, width: 200, height: 14, borderRadius: 7, background: '#EEF1F5'}} />
        {rows}
        {/* 扫读：一条浅色带子从上扫到下 */}
        {read > 0 && read < 1 ? <div style={{position: 'absolute', left: 0, top: lerp(110, H - 90, read), width: W, height: 70, background: `linear-gradient(to bottom, rgba(40,91,240,0), ${HL.voice}, rgba(40,91,240,0))`}} /> : null}
      </div>
      <Note x={140} y={d.y + H / 2 + 22} w={800} text={d.label ?? '自制示意'} o={clamp01((t - d.at - 0.3) / 0.3)} />
    </>
  );
};


// 组件墙：每格循环播放一段真实画面，底部标代码名和中文名；点名时那一格放大加黑框，其余变淡
const WallPiece = ({t, d, ep}: any) => {
  const cols = d.cols ?? 3, S = d.size ?? 296, GAP = d.gap ?? 22, x0 = 540 - (cols * S + (cols - 1) * GAP) / 2;
  const f = (d.focus ?? []).find((x: any) => t >= x.from && t < x.to), all = d.allAt != null && t >= d.allAt;
  return d.items.map((it: any, i: number) => {
    if (t < it.at) return null;
    const x = x0 + (i % cols) * (S + GAP), y = d.y + Math.floor(i / cols) * (S + GAP), s = springIn(t, it.at);
    const on = f && f.index === i ? ease(t, f.from, 0.25) : 0, dim = f && !all && f.index !== i ? ease(t, f.from, 0.2) : 0;
    return (
      <div key={i} style={{...CARD, left: x, top: y, width: S, height: S, borderRadius: 22, overflow: 'hidden', zIndex: on > 0 ? 2 : 1,
        opacity: clamp01((t - it.at) / 0.12) * (1 - 0.55 * dim), transform: `scale(${(0.7 + 0.3 * Math.min(1.05, s)) * (1 + 0.1 * on)})`,
        boxShadow: `0 0 0 ${5 * on}px ${C.ink}, 0 ${18 + 16 * on}px ${40 + 30 * on}px -8px rgba(16,36,58,${0.16 + 0.14 * on})`}}>
        <Sequence from={Math.round(it.at * 30)} layout="none"><Loop durationInFrames={Math.round(it.dur * 30)} layout="none">
          <OffthreadVideo src={staticFile(assetPath(ep, it.src))} muted style={{width: S, height: S, objectFit: 'cover'}} />
        </Loop></Sequence>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 74, background: 'rgba(255,255,255,0.94)', borderTop: `1px solid ${GRAY}`,
          display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', boxSizing: 'border-box', whiteSpace: 'nowrap'}}>
          <span style={{fontFamily: MONO, fontSize: 18, color: C.secondary}}>{it.code}</span>
          <span style={{...T.caption, fontSize: 26, fontWeight: 700, color: C.ink}}>{it.label}</span>
        </div>
      </div>
    );
  });
};


// ── 翻新版 PPT 合集用到的零件 ──
/** 盖章：从大到小砸下来，略带旋转 */
const Stamp: React.FC<{t: number; at: number; text: string; color: string}> = ({t, at, text, color}) => {
  if (t < at) return null;
  const s = springIn(t, at);
  return (
    <div style={{position: 'absolute', left: '50%', top: '42%', transform: `translate(-50%, -50%) rotate(-12deg) scale(${2.2 - 1.2 * Math.min(1, s)})`, opacity: clamp01((t - at) / 0.06),
      border: `6px solid ${color}`, color, background: 'rgba(255,255,255,0.92)', borderRadius: 16, padding: '6px 22px', ...T.heading, fontSize: 46, fontWeight: 800, whiteSpace: 'nowrap'}}>{text}</div>
  );
};
const DecksPiece = ({t, d, ep}: any) => {
  const W = 300, IH = 170, H = IH + 64, GAP = 30, x0 = 540 - (3 * W + 2 * GAP) / 2;
  let bad = 0, good = 0;
  const cards = d.items.map((it: any, i: number) => {
    const at = d.at + i * (d.step ?? 0.08);
    if (t < at) return null;
    const s = springIn(t, at), st = (it.ok ? d.goodAt : d.badAt) == null ? Infinity : it.ok ? d.goodAt + 0.14 * good++ : d.badAt + 0.14 * bad++;
    const pa = d.popAt != null ? d.popAt + i * 0.06 : Infinity, bounce = t >= pa ? Math.sin(Math.min(1, (t - pa) / 0.4) * Math.PI) : 0;
    const gray = !it.ok && t >= st ? ease(t, st + 0.15, 0.3) : 0, dim = it.ok && d.pickAt != null ? ease(t, d.pickAt, 0.3) * (1 - ease(t, st - 0.1, 0.2)) : 0;
    const lift = !it.ok && d.liftAt != null ? Math.min(1, springIn(t, d.liftAt)) * (1 - ease(t, st, 0.2)) : 0;
    const shake = !it.ok && d.shakeAt != null && t >= d.shakeAt ? Math.sin((t - d.shakeAt) * 40) * 10 * Math.exp(-(t - d.shakeAt) * 5) : 0;
    const x = x0 + (i % 3) * (W + GAP), y = d.y - H - 20 + Math.floor(i / 3) * (H + 40);
    return (
      <div key={i} style={{position: 'absolute', left: x + shake, top: y + (1 - Math.min(1, s)) * 120, width: W, height: H, opacity: clamp01((t - at) / 0.1) * (1 - 0.7 * dim), filter: dim ? `grayscale(${dim})` : undefined, transform: `translateY(${-40 * lift - 30 * bounce}px) scale(${(1 + 0.08 * lift + 0.08 * bounce) * (1 - 0.15 * dim)}) rotate(${(1 - s) * (i % 2 ? 6 : -6)}deg)`}}>
        <div style={{...CARD, position: 'relative', width: W, height: IH, borderRadius: 18, overflow: 'hidden', filter: gray ? `grayscale(${0.8 * gray})` : undefined, opacity: 1 - 0.35 * gray,
          boxShadow: lift > 0.01 ? `0 0 0 ${7 * lift}px ${C.problem}, 0 20px 40px rgba(255,121,92,${0.35 * lift})` : CARD.boxShadow}}>
          {it.src ? <Img src={staticFile(assetPath(ep, it.src))} style={{width: W, height: IH, objectFit: 'cover'}} /> : (
            <div style={{width: W, height: IH, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F5F9'}}><Icon name="file-ppt" size={96} color={C.ink} /></div>)}
        </div>
        <div style={{marginTop: 14, textAlign: 'center', ...T.heading, fontSize: 34, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap'}}>{it.name}</div>
        {st < Infinity ? <Stamp t={t} at={st} text={it.ok ? '能改' : '改不了'} color={it.ok ? C.ink : C.problem} /> : null}
      </div>
    );
  });
  return <>{cards}{d.note ? <Note x={140} y={d.y + H + 60} w={800} text={d.note} o={clamp01((t - d.at - 0.4) / 0.3)} /> : null}</>;
};

const ChooserPiece = ({t, d}: any) => {
  if (t < d.at) return null;
  const W = 940, RH = 196, H = 96 + d.rows.length * RH, x = 540 - W / 2, y = d.y - H / 2, s = springIn(t, d.at), sv = d.saveAt != null && t >= d.saveAt ? springIn(t, d.saveAt) : 0;
  return (
    <div style={{...CARD, left: x, top: y + (1 - Math.min(1, s)) * 80, width: W, height: H, opacity: clamp01((t - d.at) / 0.15), transform: `scale(${1 + 0.02 * Math.sin(Math.PI * Math.min(1, sv))})`}}>
      <div style={{position: 'absolute', left: 44, top: 30, ...T.caption, fontWeight: 700, color: C.secondary}}>{d.label ?? '6 个 PPT Skill · 怎么选'}</div>
      {d.rows.map((r: any, i: number) => {
        const p = ease(t, r.at, 0.4), on = t >= r.at;
        return (
          <div key={i} style={{position: 'absolute', left: 44, top: 96 + i * RH, width: W - 88, height: RH - 24, opacity: on ? 1 : 0.18, transform: `translateX(${on ? 30 * (1 - p) : 0}px)`,
            borderTop: i ? `2px solid ${GRAY}` : undefined, paddingTop: i ? 20 : 0, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 24}}>
            <div style={{width: 300}}>
              <div style={{...T.heading, fontSize: 50, fontWeight: 800, color: C.ink}}>{r.need}</div>
              <div style={{...T.caption, fontWeight: 600, color: C.secondary, marginTop: 6}}>{r.sub}</div>
            </div>
            <Icon name="arrow-right" size={44} color={C.secondary} />
            <div style={{flex: 1, display: 'flex', flexWrap: 'wrap', gap: 12}}>
              {r.picks.map((k: any, j: number) => { const pa = k.at ?? r.at + 0.1 + j * 0.08, po = t >= pa; return (
                <span key={k.text ?? k} style={{padding: '8px 20px', borderRadius: 14, border: `3px solid ${C.ink}`, ...T.heading, fontSize: 34, fontWeight: 700, color: po ? '#FFFFFF' : C.ink, background: po ? C.ink : 'transparent', whiteSpace: 'nowrap',
                  transform: `scale(${po ? 0.8 + 0.2 * Math.min(1.1, springIn(t, pa)) : 1})`}}>{k.text ?? k}</span>); })}
              {r.tag ? <span style={{opacity: r.tagAt == null || t >= r.tagAt ? 1 : 0.25, padding: '8px 18px', borderRadius: 14, background: r.tag === 'PPTX 可编辑' || r.tagTone === 'ink' ? C.ink : C.problem, color: '#FFFFFF', ...T.caption, fontSize: 30, fontWeight: 700, whiteSpace: 'nowrap', alignSelf: 'center'}}>{r.tag}</span> : null}
            </div>
          </div>
        );
      })}
      {sv > 0 ? (
        <div style={{position: 'absolute', right: 30, top: -34, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 40, background: C.voice, color: '#FFFFFF',
          ...T.heading, fontSize: 36, fontWeight: 700, transform: `scale(${0.5 + 0.5 * Math.min(1.1, sv)})`, opacity: clamp01((t - d.saveAt) / 0.08), boxShadow: '0 12px 30px rgba(40,91,240,0.35)'}}>
          <Icon name="bookmark-simple" size={40} color="#FFFFFF" />先存下来
        </div>
      ) : null}
    </div>
  );
};

const SlidesPiece = ({t, d, ep}: any) => {
  const W = d.w ?? 900, items = d.items.filter((it: any) => t >= it.at);
  if (!items.length) return null;
  const cur = items.length - 1, H = d.h ?? Math.round(W * 9 / 16), y = d.y - H / 2;
  const fl = d.flag && t >= d.flag.at ? springIn(t, d.flag.at) : 0;
  /** 某张图在时刻 tt 的推镜状态 */
  const zoom = (it: any, tt: number) => {
    const ps = (d.punch ?? []).filter((p: any) => p.at >= it.at && p.at <= tt);
    if (!ps.length) return {s: 1, x: 0.5, y: 0.5};
    const p = ps[ps.length - 1], q = ps.length > 1 ? ps[ps.length - 2] : {s: 1, x: 0.5, y: 0.5}, e = ease(tt, p.at, 0.45, morphEase);
    return {s: lerp(q.s, p.s, e), x: lerp(q.x, p.x, e), y: lerp(q.y, p.y, e)};
  };
  const card = (it: any, k: number, x: number, o: number, sc: number) => {
    const h = Math.min(H, Math.round(W * it.size[1] / it.size[0])), nx = d.items[k + 1], z = zoom(it, nx && t >= nx.at ? nx.at : t);
    return (
      <div key={k} style={{...CARD, left: x - 14, top: y - 14, width: W + 28, height: H + 28, borderRadius: 26, overflow: 'hidden', opacity: o, transform: `scale(${sc})`, background: '#F3F5F9'}}>
        <div style={{position: 'absolute', left: 14, top: 14 + (H - h) / 2, width: W, height: h, borderRadius: 14, overflow: 'hidden'}}>
          <div style={{width: W, height: h, transform: `scale(${z.s})`, transformOrigin: `${z.x * 100}% ${z.y * 100}%`}}>
          {it.video ? <Sequence from={Math.round(it.at * 30)} layout="none"><OffthreadVideo src={staticFile(assetPath(ep, it.src))} startFrom={Math.round((it.from ?? 0) * 30)} muted style={{width: W, height: h, objectFit: 'cover'}} /></Sequence>
            : <Img src={staticFile(assetPath(ep, it.src))} style={{width: W, height: h, objectFit: 'cover', display: 'block'}} />}
          </div>
        </div>
      </div>
    );
  };
  const p = ease(t, items[cur].at, 0.45, morphEase), x = 540 - W / 2;
  return (
    <>
      {cur > 0 && p < 1 ? card(items[cur - 1], cur - 1, x - 160 * p, 1 - p, 1 - 0.06 * p) : null}
      {card(items[cur], cur, x + 220 * (1 - p), cur === 0 ? clamp01((t - items[0].at) / 0.15) : p, cur === 0 ? 0.92 + 0.08 * Math.min(1, springIn(t, items[0].at)) : 1)}
      {fl > 0 ? (
        <div style={{position: 'absolute', left: 540 - 380, width: 760, top: y + H - 70 + (1 - Math.min(1, fl)) * 40, opacity: clamp01((t - d.flag.at) / 0.1), display: 'flex', justifyContent: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '14px 30px', borderRadius: 40, background: C.problem, color: '#FFFFFF', ...T.heading, fontSize: 38, fontWeight: 700, boxShadow: '0 12px 30px rgba(255,121,92,0.4)'}}>
            <Icon name="x-circle" size={42} color="#FFFFFF" />{d.flag.text}
          </div>
        </div>
      ) : null}
      {d.label ? <Note x={140} y={y + H + 34} w={800} text={d.label} o={clamp01((t - items[0].at - 0.3) / 0.3)} /> : null}
      {d.items.length > 1 ? (
        <div style={{position: 'absolute', left: 0, width: 1080, top: y + H + 90, display: 'flex', justifyContent: 'center', gap: 14}}>
          {d.items.map((_: any, k: number) => <div key={k} style={{width: k === cur ? 40 : 14, height: 14, borderRadius: 7, background: k === cur ? C.ink : GRAY}} />)}
        </div>
      ) : null}
    </>
  );
};

const CHIP: Record<string, [string, string, string]> = {plain: ['#FFFFFF', C.ink, GRAY], ink: [C.ink, '#FFFFFF', C.ink], voice: [C.voice, '#FFFFFF', C.voice], problem: [C.problem, '#FFFFFF', C.problem]};
const ChipsPiece = ({t, d}: any) => (
  <div style={{position: 'absolute', left: 80, width: 920, top: d.y - 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16}}>
    {d.items.map((it: any, i: number) => {
      if (t < it.at) return null;
      const [bg, fg, bd] = CHIP[it.tone ?? 'plain'];
      return (
        <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 44, background: bg, color: fg, border: `3px solid ${bd}`, ...T.heading, fontSize: 40, fontWeight: 700, whiteSpace: 'nowrap', ...popUp(t, it.at)}}>
          {it.icon ? <Icon name={it.icon} size={42} color={fg} /> : null}{it.text}
        </div>
      );
    })}
  </div>
);

const VerdictPiece = ({t, d, ep}: any) => {
  if (t < d.at) return null;
  const W = 900, RH = 110, TH = d.thumb ? 340 : 0, H = 40 + TH + d.rows.length * RH, s = springIn(t, d.at);
  return (
    <div style={{...CARD, left: 540 - W / 2, top: d.y - H / 2 + (1 - Math.min(1, s)) * 60, width: W, height: H, overflow: 'hidden', opacity: clamp01((t - d.at) / 0.12)}}>
      {d.thumb ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: TH, overflow: 'hidden', borderBottom: `2px solid ${GRAY}`}}>
          <Img src={staticFile(assetPath(ep, d.thumb))} style={{width: W, height: TH, objectFit: 'cover'}} />
          {d.tag ? <div style={{position: 'absolute', left: 28, bottom: 24, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 24px', borderRadius: 40, background: C.ink, color: '#FFFFFF', ...T.heading, fontSize: 34, fontWeight: 700}}>
            {d.icon ? <Icon name={d.icon} size={36} color="#FFFFFF" /> : null}{d.tag}</div> : null}
        </div>
      ) : null}
      {d.rows.map((r: any, i: number) => {
        const on = t >= r.at, p = ease(t, r.at, 0.35);
        return (
          <div key={i} style={{position: 'absolute', left: 40, top: TH + 20 + i * RH, height: RH, display: 'flex', alignItems: 'center', gap: 22, opacity: on ? 1 : 0.15, transform: `translateX(${on ? 24 * (1 - p) : 0}px)`}}>
            <Icon name={r.ok ? 'check-circle' : 'x-circle'} size={64} color={r.ok ? C.ink : C.problem} />
            <span style={{...T.heading, fontSize: 46, fontWeight: 700, color: r.ok ? C.ink : C.problem, whiteSpace: 'nowrap'}}>{r.text}</span>
          </div>
        );
      })}
    </div>
  );
};

const PollPiece = ({t, d}: any) => d.options.map((o: any, i: number) => {
  if (t < o.at) return null;
  const W = 820, H = 150, y = d.y - (d.options.length * (H + 30)) / 2 + i * (H + 30);
  return (
    <div key={i} style={{...CARD, left: 540 - W / 2, top: y, width: W, height: H, display: 'flex', alignItems: 'center', gap: 34, paddingLeft: 44, boxSizing: 'border-box', ...popUp(t, o.at, 40)}}>
      <div style={{width: 88, height: 88, borderRadius: 44, background: C.ink, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 48, fontWeight: 600}}>{o.key}</div>
      <div style={{...T.display, fontSize: 76, fontWeight: 800, color: C.ink}}>{o.text}</div>
    </div>
  );
});

// 放大镜分屏（参考 CreatorMotion 的 inspect-split，按竖屏重做）：上下两张卡是两种常见做法，放大镜依次看过、图标变成问题色；
// 卡片的 note 是说到时淡入的一行说明；splitAt 两张卡上下分开并略微倾斜，露出压在中间的答案卡（反黑 = 选中），写了 titleAt 时先是问号、说到答案才出字；
// subAt 答案卡出副标题；pushAt 答案卡往前推、两边变淡。
// 只用在观点讲解段，开场留给角色或大纲
const SP = {W: 800, H: 220, RW: 740, RH: 280, gap: 215, R: 84, zoom: 1.35};
const SplitPiece = ({t, d}: any) => {
  if (t < d.at) return null;
  const yA = d.y - SP.H / 2, yB = d.y + SP.H / 2, sp = ease(t, d.splitAt, 0.65), pu = d.pushAt != null ? ease(t, d.pushAt, 0.6) : 0;
  const cards = d.cards.map((c: any, i: number) => {
    const hot = d.lens?.[i] ? snap(t, d.lens[i].at + 0.15) : 0, dir = i ? 1 : -1, pu0 = popUp(t, d.at + i * 0.12, 40);
    return (
      <div key={i} style={{position: 'absolute', left: 0, top: (i ? yB : yA) + dir * SP.gap * sp, width: 1080, height: 0, transform: `rotate(${dir * 3 * sp}deg)`, transformOrigin: '540px 0', opacity: lerp(1, 0.4, pu), zIndex: 2}}>
        <div style={{...CARD, left: 540 - SP.W / 2, top: -SP.H / 2, width: SP.W, height: SP.H, display: 'flex', alignItems: 'center', gap: 36, padding: '0 56px', boxSizing: 'border-box', ...pu0,
          transform: `${pu0.transform} scale(${c.note ? 1 + 0.05 * Math.sin(Math.PI * clamp01((t - c.note.at) / 0.35)) : 1})`}}>
          <div style={{width: 112, height: 112, borderRadius: 56, background: GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon name={c.icon} size={60} color={mix(C.ink, C.problem, hot)} />
          </div>
          <div>
            <div style={{fontFamily: MONO, fontSize: 32, color: C.secondary}}>{`0${i + 1}`}</div>
            <div style={{...T.display, fontSize: 72, fontWeight: 800, color: C.ink, whiteSpace: 'nowrap'}}>{c.title}</div>
            {c.note ? <div style={{display: 'inline-block', marginTop: 6, padding: '4px 20px', borderRadius: 30, border: `3px solid ${C.problem}`, background: '#FFF1EC', ...T.caption, fontSize: 34, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', transformOrigin: '0 50%', ...popUp(t, c.note.at, 16)}}>{c.note.text}</div> : null}
          </div>
        </div>
      </div>
    );
  });
  // 放大镜：说到哪张卡就到哪张卡、从左往右扫一遍；扫完第二张立刻从右下角出画，和分开之间留一拍停顿（否则连成一段过长的移动）
  const [l0, l1] = d.lens.map((l: any) => l.at), ex = l1 + 0.45;
  const keys = [[l0 - 0.35, -120, yA], [l0, 420, yA], [l0 + 0.45, 700, yA], [l1 - 0.35, 700, yA], [l1, 420, yB], [ex, 700, yB], [ex + 0.3, 1200, yB + 140]];
  const k = keys.findIndex((x) => t < x[0]), [a, ax, ay] = keys[Math.max(0, k - 1)], [b, bx, by] = keys[k < 0 ? keys.length - 1 : k];
  const lp = k <= 0 ? (k < 0 ? 1 : 0) : Easing.inOut(Easing.sin)((t - a) / (b - a)), lx = lerp(ax, bx, lp), ly = lerp(ay, by, lp);
  const r = ease(t, d.splitAt + 0.25, 0.5), sub = d.subAt != null ? ease(t, d.subAt, 0.35) : 0;
  return (
    <>
      {cards}
      {t >= d.splitAt + 0.15 ? (
        <div style={{...CARD, left: 540 - SP.RW / 2, top: d.y - SP.RH / 2, width: SP.RW, height: SP.RH, background: C.ink, zIndex: pu > 0 ? 3 : 1,
          opacity: clamp01((t - d.splitAt - 0.15) / 0.2), transform: `scale(${lerp(0.9, 1, r) * lerp(1, 1.06, pu)})`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18}}>
          {d.result.titleAt != null && t < d.result.titleAt ? <Icon name="question" size={110} color="#FFFFFF" /> : (
            <div style={{...T.display, fontSize: 76, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', opacity: d.result.titleAt != null ? ease(t, d.result.titleAt, 0.3) : 1}}>{d.result.title}</div>)}
          {d.result.sub ? <div style={{...T.heading, fontSize: 42, color: '#FFFFFF', opacity: 0.9 * sub, transform: `translateY(${12 * (1 - sub)}px)`}}>{d.result.sub}</div> : null}
        </div>
      ) : null}
      {t >= l0 - 0.35 && t < ex + 0.3 ? (
        <>
          <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, clipPath: `circle(${SP.R}px at ${lx}px ${ly}px)`, background: C.paper, zIndex: 4}}>
            <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${SP.zoom})`, transformOrigin: `${lx}px ${ly}px`}}>{cards}</div>
          </div>
          <div style={{position: 'absolute', left: lx - SP.R, top: ly - SP.R, width: SP.R * 2, height: SP.R * 2, borderRadius: SP.R, boxSizing: 'border-box', zIndex: 5,
            border: `10px solid ${C.ink}`, boxShadow: 'inset 0 0 0 4px #FFFFFF, 0 12px 28px -6px rgba(16,36,58,0.35)'}}>
            <div style={{position: 'absolute', left: SP.R * 2 - 22, top: SP.R * 2 - 22, width: 92, height: 24, borderRadius: 12, background: C.ink, transform: 'rotate(45deg)', transformOrigin: '0 50%'}} />
          </div>
        </>
      ) : null}
    </>
  );
};

// 对 Agent 说的一句话：对话框（左上角小机器人 + 「你的 Agent」），typeAt 起逐字打出，sendAt 点发送（按钮按下）
const PromptPiece = ({t, d}: any) => {
  if (t < d.at) return null;
  const W = 920, H = 260, x = 540 - W / 2, y = d.y - H / 2, s = springIn(t, d.at);
  const chars = [...d.text], n = t >= d.typeAt ? Math.min(chars.length, Math.floor((t - d.typeAt) / (d.cps ?? 0.07)) + 1) : 0;
  const sent = d.sendAt != null && t >= d.sendAt, press = sent && t < d.sendAt + 0.14 ? 0.9 : 1;
  return (
    <div style={{...CARD, left: x, top: y + (1 - Math.min(1, s)) * 50, width: W, height: H, opacity: clamp01((t - d.at) / 0.15)}}>
      <div style={{position: 'absolute', left: 36, top: 26, display: 'flex', alignItems: 'center', gap: 12, ...T.caption, fontWeight: 700, color: C.secondary}}>
        <Icon name="robot" size={36} color={C.secondary} />{d.label ?? '你的 Agent'}</div>
      <div style={{position: 'absolute', left: 36, right: 150, top: 92, ...T.heading, fontSize: 50, fontWeight: 700, lineHeight: 1.35, color: C.ink}}>
        {chars.slice(0, n).join('')}{n > 0 && (n < chars.length || Math.floor(t * 2) % 2 === 0) && !sent ? <span style={{color: C.voice}}>|</span> : null}
      </div>
      {d.attach && t >= d.attach.at ? (                                     // 附件：项目文件夹「丢」进对话框
        <div style={{position: 'absolute', right: 30, top: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 16, background: C.voiceSoft, border: `3px solid ${C.voice}`,
          ...T.caption, fontWeight: 700, color: C.ink, transform: `translateY(${(1 - Math.min(1, springIn(t, d.attach.at))) * -50}px) scale(${0.8 + 0.2 * Math.min(1.08, springIn(t, d.attach.at))})`, opacity: clamp01((t - d.attach.at) / 0.1)}}>
          <Icon name="folder" size={34} color={C.voice} />{d.attach.text}</div>
      ) : null}
      <div style={{position: 'absolute', right: 30, bottom: 30, width: 96, height: 96, borderRadius: 48, background: sent ? C.ink : GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${press})`}}>
        <Icon name="paper-plane-right" size={50} color={sent ? '#FFFFFF' : C.secondary} />
      </div>
    </div>
  );
};

// 几步依次点亮的图标（圆形，中间连线），最后一步可以是一张文件卡（final）：少字的「流程」画法
const FlowPiece = ({t, d}: any) => {
  if (t < d.at) return null;
  const n = d.steps.length, gap = 280, x0 = 540 - ((n - 1) * gap) / 2;
  const fin = d.final && t >= d.final.at ? springIn(t, d.final.at) : 0;
  return (
    <>
      {d.steps.map((st: any, i: number) => {
        const on = t >= st.at, p = on ? springIn(t, st.at) : 0, cx = x0 + i * gap;
        return (
          <React.Fragment key={i}>
            {i ? <div style={{position: 'absolute', left: cx - gap + 92, top: d.y - 4, width: gap - 184, height: 8, borderRadius: 4, background: on ? C.ink : GRAY, opacity: clamp01((t - d.at) / 0.2)}} /> : null}
            <div style={{position: 'absolute', left: cx - 90, top: d.y - 90, width: 180, height: 180, borderRadius: 90, background: on ? C.ink : '#FFFFFF', boxShadow: CARD.boxShadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.85 + 0.15 * Math.min(1.08, on ? p : 1)})`, opacity: clamp01((t - d.at) / 0.2)}}>
              <Icon name={st.icon} size={92} color={on ? '#FFFFFF' : C.secondary} />
            </div>
            <div style={{position: 'absolute', left: cx - 120, width: 240, top: d.y + 110, textAlign: 'center', ...T.heading, fontSize: 44, fontWeight: 700, color: on ? C.ink : C.secondary, opacity: clamp01((t - d.at) / 0.2)}}>{st.label}</div>
          </React.Fragment>
        );
      })}
      {fin > 0 ? (
        <div style={{...CARD, left: 540 - 170, top: d.final.y - 120, width: 340, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
          transform: `translateY(${(1 - Math.min(1, fin)) * 60}px) scale(${0.9 + 0.1 * Math.min(1.06, fin)})`, opacity: clamp01((t - d.final.at) / 0.12)}}>
          <Icon name="file-video" size={110} color={C.ink} />
          <div style={{padding: '6px 22px', borderRadius: 12, background: C.ink, color: '#FFFFFF', fontFamily: MONO, fontSize: 40, fontWeight: 600}}>{d.final.badge}</div>
        </div>
      ) : null}
    </>
  );
};

// 整屏动画素材（如 Omni 生成的角色表演）+ 后期叠加：src 从 at 起放 len 秒，之后停在 hold（末帧图）；
// screen = 素材里屏幕的位置（1080×1920 坐标），screen.at 起往里放 screen.src；notes 说到时在 notesY 一行弹出，box.at 时飞进 box 并在箱子上出 box.label
const FilmPiece = ({t, d, ep}: any) => {
  if (t < d.at) return null;
  const INK = '#292522', sc = d.screen, bx = d.box;
  const note = (n: any, k: number) => {
    if (t < n.at) return null;
    const p = springIn(t, n.at), fly = bx ? ease(t, bx.at + 0.15 + k * 0.08, 0.45) : 0;
    const x0 = 540 + (k - (d.notes.length - 1) / 2) * 210, x = lerp(x0, bx?.x ?? x0, fly), y = lerp(d.notesY, bx?.y ?? d.notesY, fly) - Math.sin(Math.PI * fly) * 160;
    return fly >= 1 ? null : (
      <g key={k} transform={`translate(${x} ${y}) rotate(${(k - 1) * 4 * (1 - fly)}) scale(${Math.min(1.08, p) * (1 - 0.65 * fly)})`} opacity={clamp01((t - n.at) / 0.1)}>
        <rect x={-88} y={-42} width={176} height={84} rx={10} fill="#FFE59A" stroke={INK} strokeWidth={5} />
        <text x={0} y={15} textAnchor="middle" fontSize={44} fontWeight={800} fill={INK}>{n.text}</text>
      </g>
    );
  };
  const lb = bx && t >= bx.at + 0.5 ? springIn(t, bx.at + 0.5) : 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: clamp01((t - d.at) / 0.15), ...(d.top ? {WebkitMaskImage: `linear-gradient(to bottom, transparent ${d.top - 70}px, black ${d.top + 50}px)`} : {})}}>   {/* top：上面渐隐掉，露出章节栏和标题，和底色自然过渡 */}
      {t < d.at + d.len
        ? <Sequence from={Math.round(d.at * 30)} durationInFrames={Math.round(d.len * 30)} layout="none"><OffthreadVideo src={staticFile(assetPath(ep, d.src))} muted style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}} /></Sequence>
        : <Img src={staticFile(assetPath(ep, d.hold))} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}} />}
      {sc && t >= sc.at ? (
        <div style={{position: 'absolute', left: sc.x, top: sc.y, width: sc.w, height: sc.h, borderRadius: 12, overflow: 'hidden', opacity: clamp01((t - sc.at) / 0.2), background: '#1C212A'}}>
          <Sequence from={Math.round(sc.at * 30)} layout="none"><OffthreadVideo src={staticFile(assetPath(ep, sc.src))} muted style={{width: sc.w, height: sc.w, marginTop: -(sc.w - sc.h) / 2}} /></Sequence>
          {Math.floor(t * 2) % 2 === 0 ? <div style={{position: 'absolute', left: 14, top: 10, display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 24, color: '#FFFFFF'}}>
            <div style={{width: 16, height: 16, borderRadius: 8, background: C.problem}} />REC</div> : null}
        </div>
      ) : null}
      {/* labels：叠在生成画面里的空白牌面上的字（10-23 加，如路牌「考研 / 考公 / 工作」）；hlAt 时字变蓝、弹一下 */}
      {(d.labels ?? []).map((lb: any, k: number) => {
        if (t < lb.at) return null;
        const hl = lb.hlAt != null && t >= lb.hlAt ? Math.min(1.12, springIn(t, lb.hlAt)) : 0;
        return (
          <div key={k} style={{position: 'absolute', left: lb.x, top: lb.y, width: lb.w, height: lb.h, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `rotate(${lb.rot ?? 0}deg) scale(${(0.6 + 0.4 * Math.min(1.08, springIn(t, lb.at))) * (1 + 0.08 * Math.sin(Math.PI * Math.min(1, hl)))})`, opacity: clamp01((t - lb.at) / 0.1)}}>
            <span style={{...T.display, fontSize: lb.size ?? Math.round(lb.h * 0.78), fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap', color: hl > 0 ? '#245CF3' : INK}}>{lb.text}</span>
          </div>
        );
      })}
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {(d.notes ?? []).map(note)}
        {lb > 0 ? <g transform={`translate(${bx.x} ${bx.y}) scale(${Math.min(1.1, lb)})`}>
          <text x={0} y={16} textAnchor="middle" fontSize={46} fontWeight={800} fill={INK} stroke="#F3D3A2" strokeWidth={8} paintOrder="stroke">{bx.label}</text>
        </g> : null}
      </svg>
    </div>
  );
};

const BillPiece = ({t, d}: any) => {
  if (t < d.at) return null;
  const W = 820, RH = 96, TOP = 92, TH = 170, H = TOP + d.rows.length * RH + TH, s = springIn(t, d.at), tot = d.total;
  const v = Math.round(tot.to * ease(t, tot.at, 0.8, Easing.out(Easing.cubic)));
  return (
    <div style={{...CARD, left: 540 - W / 2, top: d.y - H / 2 + (1 - Math.min(1, s)) * 60, width: W, height: H, overflow: 'hidden', opacity: clamp01((t - d.at) / 0.12)}}>
      <div style={{position: 'absolute', left: 48, top: 30, ...T.caption, fontWeight: 600, color: C.secondary}}>{d.label}</div>
      {(() => {                                   // 说到哪项亮哪项：荧光笔色带从上一行滑到这一行
        const k = d.rows.filter((r: any) => t >= r.at).length - 1;
        if (k < 0) return null;
        const y = TOP + lerp(Math.max(0, k - 1), k, ease(t, d.rows[k].at, 0.3)) * RH;
        return <div style={{position: 'absolute', left: 30, right: 30, top: y + 8, height: RH - 16, borderRadius: 16, background: HL.voice, opacity: (k ? 1 : ease(t, d.rows[0].at, 0.3)) * (1 - ease(t, tot.at, 0.3))}} />;
      })()}
      {d.rows.map((r: any, i: number) => {
        const p = ease(t, r.at, 0.35);
        return t < r.at ? null : (
          <div key={i} style={{position: 'absolute', left: 48, right: 48, top: TOP + i * RH, height: RH, display: 'flex', alignItems: 'center', gap: 22, borderTop: `2px solid ${GRAY}`, opacity: p, transform: `translateX(${24 * (1 - p)}px)`}}>
            <Icon name={r.icon} size={48} color={C.ink} />
            <span style={{...T.heading, fontSize: 44, fontWeight: 700, color: C.ink, flex: 1, whiteSpace: 'nowrap'}}>{r.name}</span>
            {r.amount ? <span style={{fontFamily: MONO, fontSize: 44, fontWeight: 600, color: C.ink}}>{r.amount}</span> : <div style={{width: 120, height: 22, borderRadius: 11, background: GRAY}} />}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 48, right: 48, top: TOP + d.rows.length * RH, height: TH, borderTop: `4px solid ${C.ink}`, display: 'flex', alignItems: 'center', opacity: t >= tot.at ? 1 : 0.15}}>
        <div style={{flex: 1}}>
          <div style={{...T.heading, fontSize: 48, fontWeight: 800, color: C.ink}}>合计</div>
          {tot.sub ? <div style={{...T.caption, fontWeight: 600, color: C.secondary, opacity: ease(t, tot.sub.at, 0.3)}}>{tot.sub.text}</div> : null}
        </div>
        <span style={{...T.display, fontSize: 120, fontWeight: 800, color: C.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums', transform: `scale(${t >= tot.at ? 1 + 0.08 * Math.max(0, 1 - Math.abs(t - tot.at - 0.85) / 0.2) : 1})`}}>{t >= tot.at ? v : 0}</span>
        <span style={{...T.display, fontSize: 52, fontWeight: 700, color: C.ink, marginLeft: 10}}>{tot.unit}</span>
      </div>
    </div>
  );
};

// 自制示意：一份 PPTX 文件卡；pages 每到一个时间，右边多出一页（补页 / 合并）
const FilePiece = ({t, d}: any) => {
  if (t < d.at) return null;
  const outP = d.out != null ? ease(t, d.out, 0.25, Easing.in(Easing.quad)) : 0;   // out：上移淡出（10-23 加）
  if (outP >= 1) return null;
  const W = 330, H = 420, s = springIn(t, d.at), n = (d.pages ?? []).filter((a: number) => t >= a).length;
  const total = W + n * 130, x0 = 540 - total / 2;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - outP, transform: `translateY(${-40 * outP}px)`}}>
      <div style={{...CARD, left: x0, top: d.y - H / 2 + (1 - Math.min(1, s)) * 80, width: W, height: H, opacity: clamp01((t - d.at) / 0.15), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22}}>
        <Icon name={d.icon ?? 'file-ppt'} size={170} color={C.ink} />
        <div style={{padding: '6px 24px', borderRadius: 12, background: C.ink, color: '#FFFFFF', fontFamily: MONO, fontSize: 36, fontWeight: 600}}>{d.badge}</div>
      </div>
      {(d.pages ?? []).map((a: number, k: number) => {
        if (t < a) return null;
        const p = springIn(t, a);
        return (
          <div key={k} style={{...CARD, left: x0 + W + 30 + k * 130 - (1 - Math.min(1, p)) * 120, top: d.y - 130 + k * 14, width: 160, height: 220, borderRadius: 16, opacity: clamp01((t - a) / 0.1), padding: 18, boxSizing: 'border-box'}}>
            <div style={{width: 100, height: 14, borderRadius: 7, background: C.ink}} />
            {[0, 1, 2, 3].map((j) => <div key={j} style={{marginTop: 16, width: [124, 96, 116, 70][j], height: 10, borderRadius: 5, background: GRAY}} />)}
          </div>
        );
      })}
      <Note x={140} y={d.y + H / 2 + 26} w={800} text={d.label ?? '自制示意'} o={clamp01((t - d.at - 0.3) / 0.3)} />
    </div>
  );
};

// ── 自制插画：风格说明书 + AI 工具包 → 装进信封（粗线卡通画法） ──
const LINE = '#1F2328', LW = 6;
const SWATCH = [                                                      // 书页上的六种 PPT 风格（示意色块）
  {bg: '#1F2328', a: '#F2E6CF', b: '#9C8F78'}, {bg: '#F6EFE3', a: '#E9A2C8', b: '#DDE36A'}, {bg: '#FBF3E2', a: '#F39C6B', b: '#8DB8E8'},
  {bg: '#FFFFFF', a: '#2B3A55', b: '#C9CFD8'}, {bg: '#EEF3FB', a: '#5B8DEF', b: '#F7C25C'}, {bg: '#FFFFFF', a: '#F39C6B', b: '#1F2328'},
];
const Swatch: React.FC<{x: number; y: number; k: number; s: number}> = ({x, y, k, s}) => {
  const c = SWATCH[k], w = 120, h = 76;
  return (
    <g transform={`translate(${x + w / 2} ${y + h / 2}) scale(${s}) translate(${-w / 2} ${-h / 2})`} opacity={Math.min(1, s * 1.5)}>
      <rect width={w} height={h} rx={10} fill={c.bg} stroke={LINE} strokeWidth={4} />
      <rect x={12} y={12} width={52} height={10} rx={5} fill={c.a} />
      <rect x={12} y={30} width={34} height={8} rx={4} fill={c.b} />
      {k === 5 ? <text x={68} y={60} fontFamily={MONO} fontSize={20} fontWeight={700} fill={c.a}>PPTX</text> : <rect x={60} y={40} width={48} height={26} rx={6} fill={c.a} opacity={0.85} />}
    </g>
  );
};
const KitPiece = ({t, d}: any) => {
  if (t < d.at) return null;
  const bw = 260, bh = 340, Y = d.y;
  const bin = Math.min(1, springIn(t, d.at)), open = ease(t, d.openAt, 0.55, morphEase), sp = lerp(410, 300, open);   // 书脊：合上时书在正中，翻开时往左让出工具箱的位置
  const lab = d.envAt != null ? 1 - ease(t, d.envAt, 0.2) : 1;                     // 信封出来时，两个标签先让开
  const fly = d.flyAt != null ? ease(t, d.flyAt, 0.6, morphEase) : 0, env = d.envAt != null && t >= d.envAt ? Math.min(1.08, springIn(t, d.envAt)) : 0;
  const ex = 540, ey = Y + 360;                                        // 信封位置
  const toEnv = (x: number, y: number) => `translate(${lerp(x, ex, fly)} ${lerp(y, ey - 10, fly)}) scale(${lerp(1, 0.18, fly)}) translate(${-x} ${-y})`;   // 绕自己的中心缩小、飞进信封
  const box = d.boxAt != null && t >= d.boxAt ? Math.min(1, springIn(t, d.boxAt)) : 0, lid = d.boxAt != null ? ease(t, d.boxAt + 0.35, 0.4, Easing.out(Easing.back(1.6))) : 0;
  const tool = (k: number) => (d.boxAt != null ? Math.min(1.1, springIn(t, d.boxAt + 0.55 + k * 0.14)) : 0);
  const seal = d.flyAt != null ? ease(t, d.flyAt + 0.5, 0.25) : 0, hop = d.flyAt != null && t >= d.flyAt + 0.75 ? Math.sin(Math.min(1, (t - d.flyAt - 0.75) / 0.45) * Math.PI) : 0;
  const coverS = open < 0.5 ? 1 - 2 * open : 0, leftS = open > 0.5 ? 2 * open - 1 : 0;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {/* 风格说明书 */}
      <g transform={toEnv(sp, Y)} opacity={1 - clamp01((fly - 0.85) / 0.15)}>
        <g transform={`translate(${sp} ${Y}) scale(${0.6 + 0.4 * bin}) translate(${-sp} ${-Y})`} opacity={clamp01((t - d.at) / 0.12)}>
          {/* 右页 */}
          <rect x={sp} y={Y - bh / 2} width={bw} height={bh} rx={14} fill="#FFFDF8" stroke={LINE} strokeWidth={LW} />
          {[0, 1, 2].map((k) => <Swatch key={k} x={sp + 70} y={Y - 140 + k * 96} k={k + 3} s={open > 0 ? Math.min(1.08, springIn(t, d.openAt + 0.35 + (k + 3) * 0.1)) : 0} />)}
          {/* 左页（封面翻过去以后露出来） */}
          {leftS > 0 ? <g transform={`translate(${sp} 0) scale(${leftS} 1) translate(${-sp} 0)`}>
            <rect x={sp - bw} y={Y - bh / 2} width={bw} height={bh} rx={14} fill="#FFFDF8" stroke={LINE} strokeWidth={LW} />
            {[0, 1, 2].map((k) => <Swatch key={k} x={sp - bw + 70} y={Y - 140 + k * 96} k={k} s={Math.min(1.08, springIn(t, d.openAt + 0.3 + k * 0.1))} />)}
          </g> : null}
          {/* 封面 */}
          {coverS > 0 ? <g transform={`translate(${sp} 0) scale(${coverS} 1) translate(${-sp} 0)`}>
            <rect x={sp} y={Y - bh / 2} width={bw} height={bh} rx={14} fill="#8DB8E8" stroke={LINE} strokeWidth={LW} />
            <rect x={sp + 40} y={Y - 90} width={bw - 80} height={86} rx={12} fill="#FFFDF8" stroke={LINE} strokeWidth={4} />
            <text x={sp + bw / 2} y={Y - 36} textAnchor="middle" fontSize={34} fontWeight={800} fill={LINE}>{d.bookLabel ?? '风格说明书'}</text>
            <circle cx={sp + bw / 2} cy={Y + 70} r={34} fill="#F7C25C" stroke={LINE} strokeWidth={4} />
            <path d={`M${sp + bw / 2 - 14} ${Y + 70} l10 10 l20 -22`} fill="none" stroke={LINE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          </g> : null}
          <line x1={sp} y1={Y - bh / 2 + 6} x2={sp} y2={Y + bh / 2 - 6} stroke={LINE} strokeWidth={LW} strokeLinecap="round" />
          <text x={open > 0.5 ? sp : sp + bw / 2} y={Y + bh / 2 + 66} textAnchor="middle" fontSize={40} fontWeight={700} fill={C.ink} opacity={lab}>{d.bookLabel ?? '风格说明书'}</text>
        </g>
      </g>
      {/* AI 工具包 */}
      {box > 0 ? <g transform={toEnv(800, Y + 60)} opacity={1 - clamp01((fly - 0.85) / 0.15)}>
        <g transform={`translate(800 ${Y + 60}) scale(${0.5 + 0.5 * box})`} opacity={clamp01((t - d.boxAt) / 0.1)}>
          {/* 弹出来的东西：安装说明、扳手、AI 星星 */}
          <g transform={`translate(-70 ${-60 - 150 * tool(0)}) rotate(${-12 * tool(0)}) scale(${tool(0)})`}>
            <rect x={-50} y={-62} width={100} height={124} rx={10} fill="#FFFFFF" stroke={LINE} strokeWidth={4} />
            {[0, 1, 2].map((k) => <rect key={k} x={-32} y={-34 + k * 24} width={[64, 48, 56][k]} height={9} rx={4} fill="#C9CFD8" />)}
            <text x={0} y={52} textAnchor="middle" fontSize={20} fontWeight={800} fill={LINE}>安装说明</text>
          </g>
          <g transform={`translate(10 ${-70 - 175 * tool(1)}) rotate(${20 * tool(1)}) scale(${tool(1)})`}>
            <path d="M-12 50 L-12 -20 A26 26 0 1 1 12 -20 L12 50 Z" fill="#B8C3CF" stroke={LINE} strokeWidth={4} strokeLinejoin="round" />
            <circle cx={0} cy={-34} r={11} fill="#FFFDF8" stroke={LINE} strokeWidth={4} />
          </g>
          <g transform={`translate(95 ${-55 - 140 * tool(2)}) rotate(${10 * tool(2)}) scale(${tool(2)})`}>
            <path d="M0 -48 C8 -14 14 -8 48 0 C14 8 8 14 0 48 C-8 14 -14 8 -48 0 C-14 -8 -8 -14 0 -48 Z" fill="#F7C25C" stroke={LINE} strokeWidth={4} strokeLinejoin="round" />
            <text x={0} y={9} textAnchor="middle" fontFamily={MONO} fontSize={22} fontWeight={800} fill={LINE}>AI</text>
          </g>
          {/* 箱子 */}
          <path d="M-60 -78 Q-60 -112 -26 -112 L26 -112 Q60 -112 60 -78" fill="none" stroke={LINE} strokeWidth={LW} strokeLinecap="round" />
          <rect x={-140} y={-80} width={280} height={170} rx={20} fill="#F39C6B" stroke={LINE} strokeWidth={LW} />
          <rect x={-30} y={-14} width={60} height={34} rx={8} fill="#FFFDF8" stroke={LINE} strokeWidth={4} />
          <g transform={`translate(-140 -80) rotate(${-38 * lid})`}>
            <rect x={0} y={-56} width={280} height={56} rx={16} fill="#E2834F" stroke={LINE} strokeWidth={LW} />
          </g>
          <text x={0} y={160} textAnchor="middle" fontSize={40} fontWeight={700} fill={C.ink} opacity={lab}>AI 工具包</text>
        </g>
      </g> : null}
      {/* 信封：后台向我获取 */}
      {env > 0 ? <g transform={`translate(${ex} ${ey - 26 * hop}) scale(${env})`}>
        {hop > 0 ? [-1, 0, 1].map((k) => <line key={k} x1={k * 60} y1={110} x2={k * 60 * 1.3} y2={110 + 40 * hop} stroke={LINE} strokeWidth={5} strokeLinecap="round" opacity={hop} />) : null}
        <rect x={-150} y={-95} width={300} height={190} rx={18} fill="#FFF6E5" stroke={LINE} strokeWidth={LW} />
        <path d="M-150 75 L-40 0 M150 75 L40 0" fill="none" stroke={LINE} strokeWidth={4} strokeLinecap="round" />
        <g transform={`translate(0 -95) scale(1 ${2 * seal - 1})`}>                {/* 封口：先朝上（开着），装好后翻下来 */}
          <path d="M-150 0 L0 105 L150 0" fill={seal > 0.5 ? '#F7D79A' : '#FFF6E5'} stroke={LINE} strokeWidth={LW} strokeLinejoin="round" />
        </g>
        {seal > 0.5 ? <circle cx={0} cy={10} r={24} fill={C.problem} stroke={LINE} strokeWidth={4} /> : null}
      </g> : null}
    </svg>
  );
};

const PIECES: Record<string, React.FC<any>> = {prompt: PromptPiece, flow: FlowPiece, film: FilmPiece, bill: BillPiece, split: SplitPiece, kit: KitPiece, decks: DecksPiece, chooser: ChooserPiece, slides: SlidesPiece, chips: ChipsPiece, verdict: VerdictPiece, poll: PollPiece, file: FilePiece, wall: WallPiece, cover: CoverPiece, article: ArticlePiece, text: TextPiece, toggles: TogglesPiece, stack: StackPiece, image: ImagePiece, count: CountPiece, input: InputPiece, cursor: CursorPiece, terminal: TerminalPiece, flood: FloodPiece};

export const Scene: React.FC<TemplateProps> = ({t, shot, ep}) => (
  <>
    {(shot.props.pieces as any[]).map((d, i) => {
      const P = PIECES[d.kind];
      return P ? <P key={i} t={t} d={d} ep={ep} /> : null;
    })}
  </>
);
