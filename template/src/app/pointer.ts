// 动效打磨（v5.3 起默认开；episode.json 里写 "motion": {"polish": false} 可关掉）：
// 把光标的实时位置交给界面零件，零件自己判断「光标是不是靠近我」，做出悬停反馈。
import React from 'react';
import {clamp01} from '../kit/motion';

/** x、y 是光标尖端（窗口内坐标）；t 是当前时间 */
export type Pointer = {polish: boolean; x: number; y: number; t: number};
export const PointerCtx = React.createContext<Pointer>({polish: false, x: -9999, y: -9999, t: 0});
export const usePointer = () => React.useContext(PointerCtx);

/** 悬停程度 0–1：光标在矩形里 = 1，离开 reach 像素以外 = 0，中间线性过渡（光标靠近时自然亮起、离开时自然熄灭） */
export const hoverOf = (p: Pointer, x: number, y: number, w: number, h: number, reach = 34) => {
  if (!p.polish) return 0;
  const dx = Math.max(x - p.x, 0, p.x - (x + w)), dy = Math.max(y - p.y, 0, p.y - (y + h));
  return clamp01(1 - Math.hypot(dx, dy) / reach);
};
