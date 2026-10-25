'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Maximize,
  Volume2,
  VolumeX,
  Gauge,
  RotateCcw,
} from 'lucide-react';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { DetectedPlayer } from '@scoutai/shared-types';

interface TacticalVideoPlayerProps {
  src: string;
  detectedPlayers?: DetectedPlayer[];
  selectedPlayerId?: string | null;
  onSelectPlayer?: (player: DetectedPlayer) => void;
  onExtractKeyframes?: (frames: string[]) => void;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 1.0, 1.5, 2.0];

export const TacticalVideoPlayer: React.FC<TacticalVideoPlayerProps> = ({
  src,
  detectedPlayers = [],
  selectedPlayerId,
  onSelectPlayer,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [containerDim, setContainerDim] = useState({ width: 1280, height: 720 });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // ResizeObserver for reliable container measurement
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerDim({ width, height });
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const stepFrame = useCallback((frames: number) => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    // Standard 25 fps broadcast video delta
    const dt = frames * (1 / 25);
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 100, videoRef.current.currentTime + dt));
  }, []);

  const setSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  // Tactical Keyboard Shortcuts (Space: Play/Pause, Left/Right: Frame step, J-K-L: Jog shuttle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
        case 'j':
        case 'J':
          e.preventDefault();
          stepFrame(-1);
          break;
        case 'ArrowRight':
        case 'l':
        case 'L':
          e.preventDefault();
          stepFrame(1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepFrame]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.playbackRate = playbackSpeed;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 25); // Current frame index at 25fps
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-[#070b18] shadow-2xl">
      {/* Video Viewport & Interactive Overlay */}
      <div
        ref={containerRef}
        className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden select-none"
      >
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain pointer-events-auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          muted={isMuted}
          playsInline
          loop
          onClick={togglePlay}
        />

        {/* Bounding Box SVG Layer */}
        {onSelectPlayer && (
          <BoundingBoxOverlay
            players={detectedPlayers}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={onSelectPlayer}
            containerWidth={containerDim.width}
            containerHeight={containerDim.height}
          />
        )}
      </div>

      {/* Tactical Control Bar */}
      <div className="p-3.5 bg-[#0b132b]/95 backdrop-blur-xl border-t border-white/10 flex flex-col gap-2.5">
        {/* Scrubber with precision frame indicator */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-slate-300 w-16 select-none">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.04}
              value={currentTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurrentTime(val);
                if (videoRef.current) videoRef.current.currentTime = val;
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
            />
          </div>
          <span className="text-xs font-mono font-medium text-slate-400 w-16 text-right select-none">
            {formatTime(duration)}
          </span>
        </div>

        {/* Bottom Playback Action Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Jog shuttle / Step buttons (44px touch targets) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => stepFrame(-1)}
              className="touch-target-44 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 transition-colors border border-white/5 active:scale-95"
              title="Step -1 Frame [J / ←]"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="touch-target-44 p-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold shadow-[0_0_16px_rgba(99,102,241,0.5)] transition-all active:scale-95 flex items-center justify-center gap-1.5"
              title="Play / Pause [Space / K]"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span className="text-xs hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span className="text-xs hidden sm:inline">Play</span>
                </>
              )}
            </button>

            <button
              onClick={() => stepFrame(1)}
              className="touch-target-44 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 transition-colors border border-white/5 active:scale-95"
              title="Step +1 Frame [L / →]"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (videoRef.current) videoRef.current.currentTime = 0;
              }}
              className="touch-target-44 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors border border-white/5 active:scale-95"
              title="Restart Video"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tactical Speed Selector & Volume Controls */}
          <div className="flex items-center gap-2 relative">
            {/* Speed Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="touch-target-44 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 active:scale-95"
              >
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                <span>{playbackSpeed}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-12 right-0 bg-[#0b132b] border border-white/10 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 z-30 min-w-[90px]">
                  {PLAYBACK_SPEEDS.map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSpeed(spd)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono text-left transition-colors cursor-pointer ${
                        playbackSpeed === spd
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {spd}x {spd === 1.0 ? '(Normal)' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Audio Mute */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="touch-target-44 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors border border-white/5 active:scale-95"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => {
                if (containerRef.current?.requestFullscreen) {
                  containerRef.current.requestFullscreen();
                }
              }}
              className="touch-target-44 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors border border-white/5 active:scale-95"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
