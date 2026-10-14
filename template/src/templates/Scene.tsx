// 模板 scene · 概念场景（v5.2 试用）：不开窗口，画面中央放一两个界面碎片 + 一个大关键词（参考 FredTalk 的讲法）
// 一个镜头由若干 pieces 叠成，每个 piece 自己按 at 出场；坐标都是画面坐标（1080×1920），y 是中心线。
// pieces[].kind:
//   text     {text, at, y, size?, cps?, mark?: {word, at, tone?}, out?}   逐字打出；mark 是荧光笔扫过某个词；out 时上移淡出
//   toggles  {at, y, items: [{label, type: 'toggle'|'check', on?, flipAt?, emphAt?}]}   几张小卡片：开关可拨动，emphAt 时卡片反黑强调
//   stack    {at, y, n?, hero?: {logo, name, at}}   几张骨架卡片斜着叠上来；hero 时真正的那张落到最上面，其余散开变淡
//   image    {src, size: [w, h], at, y, w, label, mark?: {x, y, w, h, at}}   真实截图卡片，mark 用截图像素坐标
//   count    {at, y, to, dur?, unit?, sub?}   大数字从 0 数到 to
//   input    {at, y, text, typeAt, sendAt, placeholder?, button?}   评论输入框：打字 → 点发送 → 冒出一条评论
//   cursor   {from: [x, y], in, keys: [{at, x, y, click?}]}   光标（一个镜头最多一次关键点击）
//   cover    {at, focusAt, coverAt, y, image, tag?, label?}   自制示意：一张文稿卡 → 三行重点变深 → 卡片变宽成封面，三行重点变成封面标题
//   article  {at, y, readAt, readEnd, slots: [at…], fills: [at…], grid, tag?, label?}   自制示意：长文骨架 → 扫读 → 三处配图位亮起 → 填入同一风格的图（grid = 四宫格图）
import React from 'react';
import {Img, staticFile, interpolate, Easing} from 'remotion';
import {C, T} from '../kit/tokens';
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
  const v = Math.round(d.to * ease(t, d.at, d.dur ?? 0.8, Easing.out(Easing.cubic)));
  return (
    <div style={{position: 'absolute', left: 0, width: 1080, top: d.y - 130, textAlign: 'center', ...popUp(t, d.at, 30)}}>
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

const PIECES: Record<string, React.FC<any>> = {cover: CoverPiece, article: ArticlePiece, text: TextPiece, toggles: TogglesPiece, stack: StackPiece, image: ImagePiece, count: CountPiece, input: InputPiece, cursor: CursorPiece};

export const Scene: React.FC<TemplateProps> = ({t, shot, ep}) => (
  <>
    {(shot.props.pieces as any[]).map((d, i) => {
      const P = PIECES[d.kind];
      return P ? <P key={i} t={t} d={d} ep={ep} /> : null;
    })}
  </>
);
