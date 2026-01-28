'use client';

import React, { useState, useEffect, useRef } from 'react';
import AudioPlayerControlsFooter from './AudioPlayerControlsFooter';

interface AudioPlayerFooterProps {
  audioUrl: string;
  title?: string;
}

export default function AudioPlayerFooter({
  audioUrl,
  title,
}: AudioPlayerFooterProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Initialize audio element
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Set up event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Load the audio
    audio.load();

    // Cleanup
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  // Update playback rate when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const handleSkipBack10 = () => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, audioRef.current.currentTime - 10);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkipForward10 = () => {
    if (!audioRef.current) return;
    const newTime = Math.min(
      duration,
      audioRef.current.currentTime + 10
    );
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
  };

  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    const clampedTime = Math.max(0, Math.min(duration, time));
    audioRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };

  return (
    <AudioPlayerControlsFooter
      title={title}
      currentTime={currentTime}
      duration={duration}
      isPlaying={isPlaying}
      playbackRate={playbackRate}
      onPlayPause={handlePlayPause}
      onSkipBack10={handleSkipBack10}
      onSkipForward10={handleSkipForward10}
      onPlaybackRateChange={handlePlaybackRateChange}
      onSeek={handleSeek}
    />
  );
}

