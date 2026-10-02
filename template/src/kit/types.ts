// episode.json 的结构。新一期视频 = public/episodes/<id>/ 下的 episode.json + envelope.json + 配音 + 素材。
export type Caption = {text: string; start: number; end: number};
export type Chapter = {at: number; label: string; tab?: string}; // tab：方案 C 标签栏上的短名

export type Shot = {
  id: string;
  template: string; // 卡片：host/tools/evidence/steps/voice/media/outro；App：app.modules/app.browser/app.toggles/app.timeline/app.export
  start: number;
  end: number;
  /** 顶部标题区；host 模板不显示 */
  header?: {title: string; sub?: string};
  /** 深色镜头（只给结尾用） */
  dark?: boolean;
  props: any;
};

export type Episode = {
  id: string;
  title: string;
  duration: number;
  audio?: string;          // 配音（相对本期目录）
  envelope: string;        // 响度包络 json（scripts/envelope.py 生成）
  voiceStart?: number;     // 第一个字的时间
  renderUntil?: number;    // 只渲染到这里（出片段样片用）
  app?: {title: string};   // 方案 C：示意 App 的名字
  chapters: Chapter[];
  captions: Caption[];
  shots: Shot[];
};

export type Envelope = {rate: number; duration: number; values: number[]};

/** 素材路径：以 / 开头 = public 根目录（品牌、Logo）；否则相对本期目录 */
export const assetPath = (ep: Episode, p: string) => (p.startsWith('/') ? p.slice(1) : `episodes/${ep.id}/${p}`);

export const envAt = (env: Envelope, sec: number) => {
  const x = sec * env.rate, i = Math.floor(x), f = x - i, v = env.values;
  if (i < 0 || i >= v.length - 1) return 0;
  return v[i] * (1 - f) + v[i + 1] * f;
};
