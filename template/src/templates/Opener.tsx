// 模板 opener · 开场（v5）：角色立绘 + 本期内容图标，结尾收进托盘，App 窗口从托盘长出来
// 画面：顶部小标题 + 两行大标题（按 beats 换行，手绘下划线）；中间是角色立绘；
//      castAt 时本期要讲的工具图标从角色身后弹出，围成一道弧、慢慢浮动；
//      gatherAt 时角色头顶出现一条托盘（工具栏），图标收进托盘（「工具可以更精简」）；
//      下一镜写 "launch": {"from": "opener"}：窗口从托盘长出，每个图标飞进新页面的对应位置。
// props: {
//   kicker: string,
//   beats: [{at, title: [string, string], mark?: {line, word, tone: 'problem'|'voice', at}}],
//   figure?: {src, size: [w, h],           // 静态立绘，默认 /brand/figure.png（定妆图里的站姿）
//     clips?: [{src, start, end, offset?}], // 可选：角色表演片段（绿幕抠成透明 WebM，见 scripts/key.sh）；start/end 为画面时间，offset 为片段内起点
//     clipFrame?: {w, h, feet, height}},   // 片段里角色的位置：画面宽高、脚底 y、身高（按首帧填，默认 720×1280、脚底 1120、身高 560）
//   cast: [{logo?, pad?, icon?, bg?: 'voice'|'ink'|'white'|色值, tint?: 'ink'|色值, to?: 锚点名}],   // to：下一页里对应的位置，如 logo:0、logo:orch
//   castAt: number,                        // 图标出现（一般在说到「工作流 / 工具」时）
//   castOrigin?: [x, y], castLayer?: 'back'|'front',  // 图标从哪里冒出来（默认角色头后面）；从画本、屏幕等前景物件冒出时用 front
//   arc?: {cx, cy, rx, ry, from, to},      // 换了立绘（如坐姿）时调整图标围成的弧
//   gatherAt?: number                      // 收进托盘（默认结束前 1.6 秒）
// }
import React from 'react';
import {Img, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {C, G, T} from '../kit/tokens';
import {Sketch, Tile, textWidth} from '../kit/components';
import {rise, draw, springIn, popUp, morphEase, clamp01, lerp} from '../kit/motion';
import {assetPath} from '../kit/types';
import {OPENER, castArc, castTray, trayRect} from '../kit/cast';
import {TemplateProps} from './types';

export const tileBg = (bg?: string) => (bg === 'ink' ? C.ink : bg === 'white' ? '#FFFFFF' : bg === 'voice' || !bg ? C.voice : bg);
const tileTint = (v?: string) => (v === 'ink' ? C.ink : v ?? '#FFFFFF');
export const CastTile: React.FC<{c: any; ep: any; size: number}> = ({c, ep, size}) =>
  c.logo ? <Tile size={size} src={assetPath(ep, c.logo)} pad={c.pad ?? 0.14} /> : <Tile size={size} icon={c.icon ?? 'sparkle'} bg={tileBg(c.bg)} tint={tileTint(c.tint)} />;

const TAU = Math.PI * 2;

export const Opener: React.FC<TemplateProps> = ({t, shot, ep}) => {
  const p = shot.props;
  const beats: any[] = p.beats ?? [{at: shot.start, title: p.title, mark: p.mark}];
  const bi = Math.max(0, beats.filter((b) => b.at <= t + 0.001).length - 1);
  const titleTop = G.headerTop + 50, lh = T.display.fontSize * T.display.lineHeight;

  // 标题：换 beat 时旧标题上移淡出，新标题升起
  const titleBlock = (b: any, k: number) => {
    const isCur = k === bi;
    if (!isCur && k !== bi - 1) return null; // 只画当前和刚退场的上一个
    const outP = !isCur ? clamp01((t - beats[k + 1].at) / 0.18) : 0;
    if (outP >= 1) return null;
    let mark: React.ReactNode = null;
    if (b.mark && isCur) {
      const line: string = b.title[b.mark.line];
      const i = line.indexOf(b.mark.word);
      const x0 = G.left + textWidth(line.slice(0, i), T.display.fontSize), w = textWidth(b.mark.word, T.display.fontSize);
      const y = titleTop + lh * (b.mark.line + 1) - 4;
      mark = <Sketch shape={{kind: 'line', x1: x0 - 4, y1: y, x2: x0 + w + 6, y2: y - 3}} p={draw(t, b.mark.at, 0.45)} color={b.mark.tone === 'problem' ? C.problem : C.voice} seed={11 + k} />;
    }
    const at0 = k === 0 ? shot.start + 0.18 : b.at + 0.08;
    return (
      <React.Fragment key={k}>
        <div style={{position: 'absolute', left: G.left, top: titleTop, ...T.display, color: C.ink, whiteSpace: 'pre', opacity: 1 - outP, transform: `translateY(${-18 * outP}px)`}}>
          {b.title.map((l: string, i: number) => <div key={i} style={isCur ? rise(t, at0 + i * 0.1) : undefined}>{l}</div>)}
        </div>
        {mark}
      </React.Fragment>
    );
  };

  // 立绘：弹入 + 呼吸；换 beat 时轻轻跳一下
  const fig = p.figure ?? {src: '/brand/figure.png', size: [922, 973]};
  const fh = OPENER.figure.h, fw = (fh * fig.size[0]) / fig.size[1];
  const inP = springIn(t, shot.start + 0.3);
  const breathe = 1 + 0.008 * Math.sin((TAU * (t - shot.start)) / 3.2);
  const clips: any[] = fig.clips ?? [];
  const clipNow = clips.find((c) => t >= c.start && t < c.end);
  const cf = fig.clipFrame ?? {w: 720, h: 1280, feet: 1120, height: 560};
  const ck = fh / cf.height; // 片段缩放：让片段里的角色和立绘一样大、脚底对齐
  const hopAt = beats.slice(1).map((b) => b.at + 0.05).filter((a) => t >= a && t < a + 0.45).pop();
  const hp = hopAt !== undefined ? (t - hopAt) / 0.45 : -1;
  const hopY = hp >= 0 ? -22 * Math.sin(Math.PI * Math.min(1, hp / 0.8)) : 0;
  const squash = hp >= 0.75 ? 1 - 0.035 * Math.sin((Math.PI * (hp - 0.75)) / 0.25) : 1;

  // 图标块
  const cast: any[] = p.cast ?? [];
  const n = cast.length, S = OPENER.tile;
  const gatherAt = p.gatherAt ?? shot.end - 1.6;
  const trayIn = popUp(t, gatherAt - 0.08, 30);
  const hide = t >= shot.end; // 之后由 App 窗口接手（托盘长成窗口、图标飞进页面）
  const origin: [number, number] = p.castOrigin ?? [OPENER.figure.cx, OPENER.figure.bottom - fh * 0.72]; // 默认从角色头后面探出来
  const front = p.castLayer === 'front';

  // 图标块：弹出和浮动时在角色身后（从头后面探出来），开始收拢后移到前面（此时和角色不重叠，切换看不出来）
  const tiles = !hide ? cast.map((c, i) => {
    const at = p.castAt + i * 0.12;
    if (t < at) return null;
    const s = springIn(t, at);
    const [ax, ay] = castArc(n, i, p.arc);
    const bob = 8 * Math.sin((TAU * t) / 3.6 + i * 1.3), rot = 2.5 * Math.sin((TAU * t) / 5 + i);
    const gs = gatherAt + i * 0.05, g = morphEase(clamp01((t - gs) / 0.6));
    const tr = castTray(n, i);
    const x = lerp(lerp(origin[0], ax, s), tr[0] + tr[2] / 2, g), y = lerp(lerp(origin[1], ay, s) + bob, tr[1] + tr[3] / 2, g);
    const sc = lerp(0.35 + 0.65 * s, tr[2] / S, g);
    return {front: front || t >= gatherAt - 0.1, el: (
      <div key={i} style={{position: 'absolute', left: x - S / 2, top: y - S / 2, opacity: clamp01((t - at) / 0.12), transform: `scale(${sc}) rotate(${rot * (1 - g)}deg)`}}>
        <CastTile c={c} ep={ep} size={S} />
      </div>
    )};
  }).filter(Boolean) as {front: boolean; el: React.ReactNode}[] : [];

  return (
    <>
      <div style={{position: 'absolute', left: G.left, top: G.headerTop, ...T.caption, fontWeight: 600, color: C.secondary, ...rise(t, shot.start + 0.1)}}>{p.kicker}</div>
      {beats.map(titleBlock)}
      {tiles.filter((x) => !x.front).map((x) => x.el)}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: clamp01((t - shot.start - 0.3) / 0.15), transformOrigin: `${OPENER.figure.cx}px ${OPENER.figure.bottom}px`,
        transform: `translateY(${(1 - Math.min(1, inP)) * 40 + hopY}px) scale(${(0.92 + 0.08 * inP) * squash}, ${(0.92 + 0.08 * inP) * (clipNow ? 1 : breathe) / squash})`}}>
        {/* 有 Omni 片段的时段放片段（角色自己在动，不再加呼吸），其余时段放静态立绘 */}
        {clips.map((c, i) => (
          <Sequence key={i} from={Math.round(c.start * 30)} durationInFrames={Math.max(1, Math.round((c.end - c.start) * 30))} layout="none">
            <OffthreadVideo src={staticFile(assetPath(ep, c.src))} transparent muted startFrom={Math.round((c.offset ?? 0) * 30)}
              style={{position: 'absolute', left: OPENER.figure.cx - (cf.w / 2) * ck, top: OPENER.figure.bottom - cf.feet * ck, width: cf.w * ck, height: cf.h * ck}} />
          </Sequence>
        ))}
        {clipNow ? null : <Img src={staticFile(assetPath(ep, fig.src))} style={{position: 'absolute', left: OPENER.figure.cx - fw / 2, top: OPENER.figure.bottom - fh, width: fw, height: fh}} />}
      </div>
      {n > 0 && !hide ? (
        <div style={{position: 'absolute', left: trayRect(n).rect[0], top: trayRect(n).rect[1], width: trayRect(n).rect[2], height: trayRect(n).rect[3], borderRadius: OPENER.trayR, background: '#fff',
          boxShadow: '0 1px 2px rgba(16,36,58,0.05), 0 18px 40px -8px rgba(16,36,58,0.18)', ...trayIn}} />
      ) : null}
      {tiles.filter((x) => x.front).map((x) => x.el)}
    </>
  );
};
