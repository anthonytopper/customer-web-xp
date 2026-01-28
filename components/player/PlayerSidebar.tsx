'use client';

import React from 'react';
import type { PlanItem } from '@/lib/plan/item';
import { SectionManifest } from '@/lib/plan/manifest';

export default function PlayerSidebar({ section }: { section: SectionManifest }) {
  const recast = section?.items.find(item => item.type === 'full-overview');
  if (!recast) {
    return <h1>Recast not found</h1>;
  }
  return (
    <div className="w-full md:w-80 flex flex-col md:border-r border-b md:border-b-0 border-gray-200 px-4 md:px-6 pt-4 md:pt-10 bg-1">

      {/* Mobile: Horizontal layout */}
      <div className="flex md:flex-col gap-4 md:gap-0 pb-4 md:pb-0">
        {/* Podcast cover art */}
        <div className="px-2 md:px-6 pb-0 md:pb-6 shrink-0">
          <img src={section.book_image_url} alt={section.title} className="w-24 h-24 md:w-full md:h-full object-cover rounded-lg shadow-lg" />
        </div>

        {/* Mobile: Compact info */}
        <div className="flex-1 md:flex-none">
          {/* Podcast title */}
          <div className="px-2 md:px-6 pb-2 md:pb-4">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 line-clamp-2 md:line-clamp-none">{recast.title}</h1>
          </div>

          {/* Description - hidden on mobile */}
          <div className="hidden md:block px-6 pb-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              {section.title}
            </p>
          </div>
        </div>
      </div>
      
      {/* Hosted by section - hidden on mobile */}
      <div className="hidden md:block px-6 pb-6">
        <div className="flex items-start gap-2">
          {/* <div className="writing-vertical-rl text-xs text-gray-500 font-medium">
            Hosted by
          </div> */}
          <div className="text-sm text-slate-600 leading-relaxed">
            {recast.rebinder}
          </div>
        </div>
      </div>

      {/* About section - hidden on mobile */}
      <div className="hidden md:block px-6 pb-6">
        {/* <div className="flex items-start gap-2 mb-3">
          <div className="w-1 h-4 bg-pink-500 rounded"></div>
          <h3 className="text-sm font-semibold text-gray-900">About</h3>
        </div> */}
        <p className="text-sm text-slate-600 leading-relaxed">
          {recast.description}
        </p>
      </div>

      {/* Listen section */}
      {/* <div className="px-6 pb-6">
        <div className="flex items-start gap-2 mb-3">
          <div className="w-1 h-4 bg-pink-500 rounded"></div>
          <h3 className="text-sm font-semibold text-gray-900">Listen</h3>
        </div>
        <div className="flex flex-col gap-3">
          <a href="#" className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <span>Spotify</span>
          </a>
          <a href="#" className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-900">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.96-3.24-1.44-2.03-1.02-3.2-2.36-2.12-4.7.54-1.17 1.08-2.34 1.71-3.45 1.12-1.99 2.8-3.61 4.86-4.98.88-.59 1.78-1.1 2.77-1.49.4-.16.81-.29 1.23-.4.49-.13.99-.12 1.29.33.29.45.27.84-.15 1.25-.99.96-2.01 1.89-3.05 2.78-.45.38-.92.76-1.37 1.15-.19.16-.33.35-.14.58.19.22.38.46.58.7.9 1.09 1.84 2.17 2.73 3.29.38.48.78.95 1.07 1.5.33.63.25 1.12-.25 1.62z"/>
            </svg>
            <span>Apple Podcast</span>
          </a>
        </div>
      </div> */}
    </div>
  );
}

