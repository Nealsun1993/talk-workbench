import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Episode, calculateMetadata, EpisodeProps} from './Episode';

// 渲染哪一期：--props='{"episode":"<目录名>"}'（默认 talking-workflow-v2）
const Root: React.FC = () => (
  <Composition<any, EpisodeProps>
    id="Episode"
    component={Episode}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={300}
    defaultProps={{episode: "talking-workflow-v2-c", audio: true}}
    calculateMetadata={calculateMetadata}
  />
);
registerRoot(Root);
