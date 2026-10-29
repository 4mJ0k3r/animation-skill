import React from 'react';
import { Composition } from 'remotion';
import { StickmanScene } from './Composition';

export const Root: React.FC = () => {
  return (
    <Composition
      id="StickmanClip"
      component={StickmanScene}
      durationInFrames={240}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
