// 画面框架：顶部标题区、镜头层（沿线流动）、字幕、字体加载
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {C, G, T, FONT} from './tokens';
import {flowIn, flowOut, FLOW_OUT, rise, mix} from './motion';
import {Episode, Shot} from './types';

/** 顶部标题区：章节名 / 标题 / 副标题 常驻，只替换变化的那一行 */
export const Header: React.FC<{t: number; ep: Episode; dark: number}> = ({t, ep, dark}) => {
  const shots = ep.shots;
  const i = Math.max(0, shots.findIndex((s) => t >= s.start && t < s.end));
  const cur = shots[i];
  if (!cur || !cur.header) return null;
  const prev = i > 0 && shots[i - 1].header ? shots[i - 1] : null;
  const chapterOf = (s: Shot) => [...ep.chapters].reverse().find((c) => c.at <= s.start + 0.01)?.label ?? '';
  const val = (s: Shot, k: 'ch' | 'title' | 'sub') => (k === 'ch' ? chapterOf(s) : k === 'title' ? s.header!.title : s.header!.sub ?? '');
  const ink = mix(C.ink, '#FFFFFF', dark), sec = mix(C.secondary, C.dark.secondary, dark);
  const row = (k: 'ch' | 'title' | 'sub', top: number, style: React.CSSProperties) => {
    const now = val(cur, k), before = prev ? val(prev, k) : null;
    const changed = before === null || before !== now;
    const outP = Math.min(1, Math.max(0, (t - cur.start) / 0.15));
    return (
      <div style={{position: 'absolute', left: G.left, top, width: G.width, ...style}}>
        {prev && changed && outP < 1 ? <div style={{position: 'absolute', opacity: 1 - outP, transform: `translateY(${-16 * outP}px)`}}>{before}</div> : null}
        <div style={changed ? rise(t, cur.start + 0.12, 16) : undefined}>{now}</div>
      </div>
    );
  };
  return (
    <>
      {row('ch', G.headerTop, {...T.caption, fontWeight: 600, color: sec})}
      {row('title', G.headerTop + 50, {...T.display, color: ink, ...((cur.header as any).size ? {fontSize: (cur.header as any).size, whiteSpace: 'nowrap'} : {})})}   {/* header.size：长标题缩小、不折行 */}
      {row('sub', G.headerTop + 146, {...T.body, color: sec})}
    </>
  );
};

/** 镜头层：从右侧流入，结束后向左流走（与下一镜重叠 0.22s，画面不留空白） */
export const Layer: React.FC<{t: number; shot: Shot; hold?: boolean; children: React.ReactNode}> = ({t, shot, hold, children}) => {
  // hold：下一镜要从这一镜里的东西长出来（如窗口从角色的工具托盘长出），这一镜原地停住、稍后淡出
  const out = hold ? 0.6 : FLOW_OUT;
  if (t < shot.start || t >= shot.end + out) return null;
  const st = t >= shot.end ? (hold ? {opacity: 1 - Math.min(1, Math.max(0, (t - shot.end - 0.25) / 0.35))} : flowOut(t, shot.end)) : flowIn(t, shot.start + 0.05);
  return <AbsoluteFill style={st}>{children}</AbsoluteFill>;
};

/** 字幕 */
export const Subtitle: React.FC<{t: number; ep: Episode; dark: number}> = ({t, ep, dark}) => {
  const c = ep.captions.find((x) => t >= x.start && t < x.end);
  if (!c) return null;
  return <div style={{position: 'absolute', left: G.left, top: G.subtitleTop, width: G.width, textAlign: 'center', fontFamily: FONT, ...T.subtitle, fontSize: c.text.length > 18 ? 42 : 46, color: mix(C.ink, '#FFFFFF', dark)}}>{c.text}</div>;
};

/** 字体：MiSans（按字符分片）+ JetBrains Mono；每帧等字体就绪再截图 */
export const FontGate: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const [boot] = useState(() => delayRender('fonts'));
  useEffect(() => {
    if (document.getElementById('vl-fonts')) { continueRender(boot); return; }
    const st = document.createElement('style');
    st.id = 'vl-fonts';
    st.textContent = [400, 500, 600].map((w) => `@font-face{font-family:"JetBrains Mono";font-weight:${w};src:url(${staticFile(`fonts/jetbrains-mono-${w}.woff2`)}) format("woff2")}`).join('\n');
    document.head.appendChild(st);
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = staticFile('fonts/misans/MiSansVF.min.css');
    const fonts = (document as any).fonts;
    l.onload = () => Promise.all([
      ...[500, 600].map((w) => fonts.load(`${w} 40px "MiSans VF"`, text)),
      ...[500, 600].map((w) => fonts.load(`${w} 32px "JetBrains Mono"`, '0123456789:%/·ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')),
    ]).then(() => fonts.ready).then(() => continueRender(boot)).catch(() => continueRender(boot));
    l.onerror = () => continueRender(boot);
    document.head.appendChild(l);
  }, [boot, text]);
  useEffect(() => { const h = delayRender('frame fonts'); (document as any).fonts.ready.then(() => continueRender(h)); }, [frame]);
  return null;
};

export const Canvas: React.FC<{dark: number; bg?: string; children: React.ReactNode}> = ({dark, bg, children}) => (   // bg：整期固定底色（如黑底片头）
  <AbsoluteFill style={{background: bg ?? mix(C.paper, C.navy, dark), fontFamily: FONT, overflow: 'hidden'}}>{children}</AbsoluteFill>
);
