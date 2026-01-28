'use client';

import React, { useState } from 'react';
import PlayButton from './PlayButton';
import Image from 'next/image';

interface AudioPlayerControlsFooterProps {
  title?: string;
  currentTime?: number; // in seconds
  duration?: number; // in seconds
  isPlaying?: boolean;
  playbackRate?: number;
  onPlayPause?: () => void;
  onSkipBack10?: () => void;
  onSkipForward10?: () => void;
  onPlaybackRateChange?: (rate: number) => void;
  onSeek?: (time: number) => void;
}

const SkipBack10Icon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3L3 17M3 10L17 3L17 17L3 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="4" y="13" fontSize="7" fill="currentColor" fontWeight="600">10</text>
  </svg>
);

const SkipForward10Icon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 3L17 17M17 10L3 3L3 17L17 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="4" y="13" fontSize="7" fill="currentColor" fontWeight="600">10</text>
  </svg>
);

const VolumeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L7 9H3V11H7L12 16V4Z" fill="currentColor"/>
    <path d="M14 7C14.5 7.5 15 8.5 15 10C15 11.5 14.5 12.5 14 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const CastIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M2 8L18 8" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 12L6 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function AudioPlayerControlsFooter({
  title,
  currentTime = 7,
  duration = 64,
  isPlaying = false,
  playbackRate = 1,
  onPlayPause,
  onSkipBack10,
  onSkipForward10,
  onPlaybackRateChange,
  onSeek,
}: AudioPlayerControlsFooterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  const progress = duration > 0 ? (isDragging ? dragValue : currentTime) / duration : 0;
  const progressPercent = Math.min(100, Math.max(0, progress * 100));

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * duration;
    onSeek(newTime);
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !onSeek) return;
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percent * duration;
    setDragValue(newTime);
  };

  const handleMouseUp = () => {
    if (isDragging && onSeek) {
      onSeek(dragValue);
    }
    setIsDragging(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 md:h-24 bg-white border-t border-gray-200 flex flex-col md:flex-row items-center px-4 md:px-6 gap-3 md:gap-6 z-50">
      {/* Episode title - hidden on mobile */}
      <div className="hidden md:block min-w-[150px]">
        <span className="text-sm text-gray-900 font-medium">{title}</span>
      </div>

      {/* Main controls */}
      <div className="flex-1 w-full md:w-auto flex flex-col items-center gap-2">
        {/* Control buttons */}
        <div className="flex items-center gap-4">
          {/* Skip back 10 seconds */}
          <button
            onClick={onSkipBack10}
            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Skip back 10 seconds"
          >
            <Image src="/skip-back-15.svg" alt="Skip back 15 seconds" width={20} height={20} />
          </button>

          {/* Play button */}
          <PlayButton isPlaying={isPlaying} onClick={onPlayPause} />


          {/* Skip forward 10 seconds */}
          <button
            onClick={onSkipForward10}
            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Skip forward 10 seconds"
          >
            <Image src="/skip-forward-15.svg" alt="Skip forward 15 seconds" width={20} height={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full flex items-center gap-2 md:gap-3">
          <span className="text-xs text-gray-600 min-w-[35px] md:min-w-[40px] text-right">
            {formatTime(currentTime)}
          </span>
          <div
            className="flex-1 h-1 bg-gray-200 rounded-full cursor-pointer relative"
            onClick={handleProgressClick}
            onMouseDown={handleProgressDrag}
            onMouseMove={isDragging ? handleProgressDrag : undefined}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full -translate-x-1/2"
              style={{ left: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 min-w-[35px] md:min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="hidden md:flex items-center gap-4">
        {/* Playback speed */}
        <button
          onClick={() => onPlaybackRateChange?.(playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1)}
          className="text-sm text-gray-700 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
        >
          {playbackRate}x
        </button>

        {/* Volume */}
        <button
          className="text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Volume control"
        >
          <VolumeIcon />
        </button>

        {/* Cast/Fullscreen */}
        <button
          className="text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Cast or fullscreen"
        >
          <CastIcon />
        </button>
      </div>
    </div>
  );
}

