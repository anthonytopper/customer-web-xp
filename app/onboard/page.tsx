'use client';

import OnboardRecastList from '@/components/onboard/OnboardRecastList';
import { ChatIcon } from '@/components/chat/ChatIcon';
import ChatTray from '@/components/chat/ChatTray';
import { onboardTeaserSectionManifests } from '@/data/onboard/sections';
import { useChatSessionOnboard } from '@/hooks/useChatSession';
import { useState } from 'react';

export default function OnboardPage() {

  const session = useChatSessionOnboard();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen pt-[80px] bg-white dark:bg-black">
      <div className="flex h-content">
        {/* Main content area */}
        <main className="flex flex-col items-center justify-center flex-1 min-h-full pb-24 transition-all duration-300 overflow-hidden">
          <OnboardRecastList sectionManifests={onboardTeaserSectionManifests} isBlurred={true} />
        </main>
        
        {/* Chat sidebar */}
        {isChatOpen && (
          <ChatTray session={session} onClose={() => setIsChatOpen(false)} />
        )}
      </div>
      
      {/* Raia icon in bottom right */}
      {!isChatOpen && <ChatIcon onClick={() => setIsChatOpen(true)} />}
    </div>
  );
}
