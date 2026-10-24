'use client';

import React, { useState, useRef } from 'react';
import { Upload, Video, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';
import { useScoutStore } from '../../store/useScoutStore';
import { apiClient } from '../../lib/api-client';
import { useLocale } from '../../hooks/useLocale';

export const VideoUploader: React.FC = () => {
  const { t } = useLocale();
  const { sport, setVideo, setCachedFrames, setIsScanning, setDetectedPlayers } = useScoutStore();
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractFramesFromVideoFile = async (file: File, count = 10): Promise<string[]> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = async () => {
        const duration = video.duration || 10;
        const frames: string[] = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = Math.min(1280, video.videoWidth || 1280);
        const scale = width / (video.videoWidth || 1280);
        const height = (video.videoHeight || 720) * scale;
        canvas.width = width;
        canvas.height = height;

        const timestamps = Array.from({ length: count }, (_, i) => 0.05 + (0.9 / Math.max(1, count - 1)) * i * duration);

        let idx = 0;
        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const b64 = canvas.toDataURL('image/jpeg', 0.88).split(',')[1];
            if (b64) frames.push(b64);
          }
          idx++;
          if (idx < timestamps.length) {
            video.currentTime = timestamps[idx];
          } else {
            URL.revokeObjectURL(url);
            resolve(frames);
          }
        };

        video.currentTime = timestamps[0];
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve([]);
      };
    });
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setErrorMsg('Please select a valid video file (.mp4, .mov, .webm).');
      return;
    }

    setErrorMsg(null);
    const objectUrl = URL.createObjectURL(file);
    setVideo(file, objectUrl);

    try {
      setIsScanning(true, 'Extracting 10 high-action keyframes...');
      const frames = await extractFramesFromVideoFile(file, 10);
      setCachedFrames(frames);

      setIsScanning(true, 'Detecting players and team colors with Gemini Vision...');
      const res = await apiClient.detectPlayers({
        sport,
        framesBase64: frames,
      });

      setDetectedPlayers(res.players);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMsg(err.message || 'Player detection failed. You can still proceed to analysis.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
            : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400 shadow-[0_0_24px_rgba(99,102,241,0.3)]">
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">{t('upload.dropzoneTitle')}</h3>
        <p className="text-sm text-slate-400 max-w-md mb-6">{t('upload.dropzoneSubtitle')}</p>

        <GlassButton variant="primary" size="md" icon={<Video className="w-4 h-4" />}>
          {t('upload.browse')}
        </GlassButton>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
