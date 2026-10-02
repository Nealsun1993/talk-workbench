// 占位模板：骨架里 template = "TODO" 的镜头先显示这张卡，提醒还没选模板，方便边填边预览。
import React from 'react';
import {C, G, T} from '../kit/tokens';
import {Card, Tag} from '../kit/components';
import {TemplateProps} from './types';

export const Placeholder: React.FC<TemplateProps> = ({shot}) => (
  <div style={{position: 'absolute', left: G.left, top: G.contentTop, width: G.width}}>
    <Card style={{padding: 40, border: `3px dashed ${C.quiet}`, boxShadow: 'none'}}>
      <Tag tone="problem">待选模板</Tag>
      <div style={{...T.body, color: C.ink, marginTop: 20}}>{shot.props?._口播 ?? ''}</div>
      <div style={{...T.caption, color: C.secondary, marginTop: 16}}>app.modules · app.browser · app.toggles · app.timeline · app.tts · app.gallery · app.character · app.export · app.draft</div>
    </Card>
  </div>
);
