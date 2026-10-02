import React from 'react';
import {Episode, Envelope, Shot} from '../kit/types';

export type PageProps = {t: number; shot: Shot; ep: Episode; env: Envelope};

/** 光标动作（窗口内坐标）。click：点击；hover：只移到这里；drag：按住从 (x,y) 拖到 to，用时 dur 秒 */
export type Act = {at: number; x: number; y: number; kind: 'click' | 'hover' | 'drag'; to?: [number, number]; dur?: number};
/** 相机焦点：at 时刻起把 rect（窗口内坐标）放到画面中心；rect=null 表示看整个窗口 */
export type Focus = {at: number; rect: [number, number, number, number] | null; scale?: number};

/**
 * App 页面模板 = 画面 + 光标动作 + 相机焦点。
 * 三者都从同一份 props 算出来，所以光标永远点在按钮上、相机永远对准正在发生的事。
 */
/** 承接锚点：页面里可以“长成下一页”的元素（窗口内坐标、圆角、底色） */
export type Anchor = {rect: [number, number, number, number]; r: number; bg: string};

export type AppTemplate = {
  Page: React.FC<PageProps>;
  acts: (shot: Shot) => Act[];
  focus: (shot: Shot) => Focus[];
  /** 可选：本页哪些元素可以承接到下一页（下一镜 props.carry.anchor 引用它的名字） */
  anchors?: (shot: Shot) => Record<string, Anchor>;
};
