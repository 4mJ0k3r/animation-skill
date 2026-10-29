import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export const StickmanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // In Remotion, frame is deterministic and provided by useCurrentFrame().
  // Render canvas or SVG stick figure using the rig's FK/IK solver.
  return (
    <div style={{ flex: 1, backgroundColor: '#f4efe6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ fontFamily: 'system-ui', color: '#1c1c1c' }}>
        Remotion Stickman Frame {frame} / {fps} fps
      </h1>
    </div>
  );
};
