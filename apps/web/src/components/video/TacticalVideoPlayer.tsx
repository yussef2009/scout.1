'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Maximize, Volume2, VolumeX } from 'lucide-react';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { DetectedPlayer } from '@scoutai/shared-types';

interface TacticalVideoPlayerProps {
  src: string;
  detectedPlayers?: DetectedPlayer[];
  selectedPlayerId?: string | null;
  onSelectPlayer?: (player: DetectedPlayer) => void;
  onExtractKeyframes?: (frames: string[]) => void;
}

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
  const [containerDim, setContainerDim] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDim({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const stepFrame = (frames: number) => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    videoRef.current.currentTime += frames * (1 / 25);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl">
      {/* Video Viewport & Interactive Overlay */}
      <div
        ref={containerRef}
        className="relative aspect-video w-full bg-black/60 flex items-center justify-center overflow-hidden"
      >
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          muted={isMuted}
          playsInline
          loop
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

      {/* Control Bar */}
      <div className="p-3 bg-slate-900/90 backdrop-blur-md border-t border-white/10 flex flex-col gap-2">
        {/* Scrubber */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 w-12">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.05}
            value={currentTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setCurrentTime(val);
              if (videoRef.current) videoRef.current.currentTime = val;
            }}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-xs font-mono text-slate-400 w-12 text-right">{formatTime(duration)}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => stepFrame(-1)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
              title="Previous Frame (-1/25s)"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)] transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <button
              onClick={() => stepFrame(1)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
              title="Next Frame (+1/25s)"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                if (containerRef.current?.requestFullscreen) {
                  containerRef.current.requestFullscreen();
                }
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
