'use client';

import React from 'react';
import PlayerSidebar from './PlayerSidebar';
import PlayerMainContent from './PlayerMainContent';
import AudioPlayerFooter from './AudioPlayerFooter';
import type { SectionManifest } from '@/lib/plan/manifest';

export default function PlayerScreen({ section }: { section: SectionManifest }) {
  const recast = section?.items.find(item => item.type === 'full-overview');
  if (!recast) {
    return <h1>Recast not found</h1>;
  }
  const audioUrl = recast?.paths_signed?.audio;
  if (!audioUrl) {
    return <h1>Audio URL not found</h1>;
  }
  return (
    <div className="flex flex-col h-content pt-[64px] bg-white">
      {/* Main content area */}
      <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">
        {/* Sidebar - appears above on mobile, left on desktop */}
        <PlayerSidebar section={section} />

        {/* Main content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <PlayerMainContent section={section} />
        </div>
      </div>

      {/* Sticky footer audio player */}
      <AudioPlayerFooter audioUrl={audioUrl} />
    </div>
  );
}

