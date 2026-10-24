// 一期视频 = episode.json。本文件只负责“按时间把模板排起来”，不含任何单期专用代码。
// 两类镜头：
//   · 卡片模板（host / tools / evidence / steps / voice / media / outro）—— 每个镜头独立流入流出
//   · App 模板（app.*，方案 C 产品演示）—— 连续的 app 镜头共用一个示意 App 窗口
import React from 'react';
import {Audio, CalculateMetadataFunction, staticFile, useCurrentFrame} from 'remotion';
import {Episode as Ep, Envelope, assetPath} from './kit/types';
import {Canvas, FontGate, Header, Layer, Subtitle} from './kit/frame';
import {clamp01} from './kit/motion';
import {TEMPLATES} from './templates';
import {AppStage, sessionsOf, appMoving, camOf} from './app/AppStage';
import {Backdrop} from './kit/Backdrop';
import {CameraMotionBlur} from '@remotion/motion-blur';

export type EpisodeProps = {episode: string; ep?: Ep; env?: Envelope; audio?: boolean};

export const Episode: React.FC<EpisodeProps> = ({ep, env, audio = true}) => {
  const t = useCurrentFrame() / 30;
  if (!ep || !env) return null;
  const cur = ep.shots.find((s) => t >= s.start && t < s.end) ?? ep.shots[ep.shots.length - 1];
  const darkOf = (s: any) => (s?.dark ? 1 : 0);
  const idx = ep.shots.indexOf(cur), prev = ep.shots[idx - 1];
  const dark = prev && darkOf(prev) !== darkOf(cur) ? darkOf(prev) + (darkOf(cur) - darkOf(prev)) * clamp01((t - cur.start) / 0.35) : darkOf(cur);
  // 画面（不含字幕）：快速运动的帧用 180° 快门的运动模糊，其余帧照常
  const picture = <Picture ep={ep} env={env} />;
  const blur = (ep as any).motionBlur !== false && (appMoving(ep, t) || ep.shots.some((s) => t >= s.start && t < s.end && (TEMPLATES[s.template] as any)?.moving?.(s, t)));
  return (
    <>
      <FontGate text={JSON.stringify(ep)} />
      {audio && ep.audio ? <Audio src={staticFile(assetPath(ep, ep.audio))} /> : null}
      {blur ? <CameraMotionBlur shutterAngle={180} samples={6}>{picture}</CameraMotionBlur> : picture}
      {/* 整屏色块章节卡盖住时：字幕改白字；字幕念的就是卡上那几个字时不再重复显示 */}
      {(() => {
        const fl = (cur.props?.pieces ?? []).find((d: any) => d.kind === 'flood' && t >= d.at + 0.1 && (d.out == null || t < d.out + 0.1));
        if (!fl) return <Subtitle t={t} ep={ep} dark={dark} />;
        const c = ep.captions.find((x) => t >= x.start && t < x.end), card = `${fl.kicker ?? ''}${fl.title}`;
        return c && card.includes(c.text.replace(/[\s，。、]/g, '')) ? null : <Subtitle t={t} ep={ep} dark={1} />;
      })()}
    </>
  );
};

/** 画面本体：按时间读帧，运动模糊会在不同的时间点多次渲染它 */
const Picture: React.FC<{ep: Ep; env: Envelope}> = ({ep, env}) => {
  const t = useCurrentFrame() / 30;
  const cur = ep.shots.find((s) => t >= s.start && t < s.end) ?? ep.shots[ep.shots.length - 1];
  const darkOf = (s: any) => (s?.dark ? 1 : 0);
  const idx = ep.shots.indexOf(cur), prev = ep.shots[idx - 1];
  const dark = prev && darkOf(prev) !== darkOf(cur) ? darkOf(prev) + (darkOf(cur) - darkOf(prev)) * clamp01((t - cur.start) / 0.35) : darkOf(cur);
  const cardShots = ep.shots.filter((s) => !s.template.startsWith('app.'));
  const headerEp = {...ep, shots: ep.shots.map((s) => (s.template.startsWith('app.') ? {...s, header: undefined} : s))};
  return (
    <Canvas dark={dark} bg={(ep as any).canvas}>
      <Backdrop t={t} spec={(ep as any).backdrop} cam={camOf(ep, t)} dark={dark} />
      <Header t={t} ep={headerEp} dark={dark} />
      {cardShots.map((s) => {
        const T = TEMPLATES[s.template];
        const next = ep.shots.find((x) => Math.abs(x.start - s.end) < 0.01);
        return T ? <Layer key={s.id} t={t} shot={s} hold={!!next?.props?.launch}><T t={t} shot={s} ep={ep} env={env} /></Layer> : null;
      })}
      {sessionsOf(ep).map((sess) => <AppStage key={sess.start} t={t} ep={ep} env={env} sess={sess} />)}
    </Canvas>
  );
};

export const calculateMetadata: CalculateMetadataFunction<EpisodeProps> = async ({props}) => {
  const ep: Ep = await fetch(staticFile(`episodes/${props.episode}/episode.json`)).then((r) => r.json());
  const env: Envelope = await fetch(staticFile(assetPath(ep, ep.envelope))).then((r) => r.json());
  const duration = (ep as any).renderUntil ?? ep.duration;
  return {durationInFrames: Math.round(duration * 30), props: {...props, ep, env}};
};
