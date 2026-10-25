'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  UploadCloud,
  FileText,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Badge } from '../../../components/ui/Badge';
import { apiClient } from '../../../lib/api-client';
import { UpgradeModal } from './UpgradeModal';

interface UsageMeterWidgetProps {
  compact?: boolean;
  className?: string;
}

export const UsageMeterWidget: React.FC<UsageMeterWidgetProps> = ({
  compact = false,
  className = '',
}) => {
  const { locale, t } = useLocale();
  const isAr = locale === 'ar';

  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchUsage = async () => {
    try {
      const data = await apiClient.getBillingUsage();
      setUsage(data);
    } catch (e) {
      // Mock fallback if API offline
      setUsage({
        tier: 'PRO',
        tierNameEn: 'Pro Academy',
        tierNameAr: 'الأكاديمية المحترفة',
        status: 'ACTIVE',
        billingPeriod: '2026-10',
        meters: {
          videoUploads: { used: 4, limit: 60, remaining: 56, percentUsed: 7, unit: 'matches', unit_ar: 'مباراة' },
          aiReports: { used: 12, limit: 60, remaining: 48, percentUsed: 20, unit: 'reports', unit_ar: 'تقرير' },
          videoDurationMinutes: { used: 38.5, limit: 360, remaining: 321.5, percentUsed: 11, unit: 'minutes', unit_ar: 'دقيقة' },
          playersManaged: { used: 18, limit: 100, remaining: 82, percentUsed: 18, unit: 'athletes', unit_ar: 'لاعب' },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  if (loading || !usage) {
    return (
      <div className={`p-4 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse ${className}`}>
        <div className="h-4 w-32 bg-white/10 rounded mb-3" />
        <div className="h-2 w-full bg-white/10 rounded" />
      </div>
    );
  }

  const videoMeter = usage.meters.videoUploads;
  const reportMeter = usage.meters.aiReports;

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'from-rose-500 to-red-600';
    if (percent >= 70) return 'from-amber-400 to-orange-500';
    return 'from-emerald-400 to-teal-500';
  };

  if (compact) {
    return (
      <div className={`p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 text-xs ${className}`} dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
            {isAr ? 'حصة المباريات' : 'Matches Quota'}
          </span>
          <span className="font-bold text-white font-mono">
            {videoMeter.used} / {videoMeter.limit}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(videoMeter.percentUsed)}`}
            style={{ width: `${Math.min(100, videoMeter.percentUsed)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <GlassCard className={`relative overflow-hidden ${className}`} dir={isAr ? 'rtl' : 'ltr'}>
        {/* Glow corner accent */}
        <div className="absolute top-0 ltr:right-0 rtl:left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                {t('billing.currentPlan')}
              </span>
              <h4 className="font-extrabold text-sm text-white">
                {isAr ? usage.tierNameAr : usage.tierNameEn}
              </h4>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <span>{t('billing.upgradeCta')}</span>
            <ArrowUpRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-[-90deg]' : ''}`} />
          </button>
        </div>

        {/* Meters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Match Video Uploads */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? 'فيديوهات المباريات' : 'Match Uploads'}</span>
              </div>
              <span className="font-mono font-bold text-white">
                {videoMeter.used} / {videoMeter.limit}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(videoMeter.percentUsed)} transition-all duration-500`}
                style={{ width: `${Math.min(100, videoMeter.percentUsed)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{videoMeter.percentUsed}% {isAr ? 'مستهلك' : 'used'}</span>
              <span>{videoMeter.remaining} {isAr ? 'متبقي' : 'remaining'}</span>
            </div>
          </div>

          {/* AI Scouting Reports */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isAr ? 'تقارير الذكاء الاصطناعي' : 'AI Dossiers'}</span>
              </div>
              <span className="font-mono font-bold text-white">
                {reportMeter.used} / {reportMeter.limit}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(reportMeter.percentUsed)} transition-all duration-500`}
                style={{ width: `${Math.min(100, reportMeter.percentUsed)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{reportMeter.percentUsed}% {isAr ? 'مستهلك' : 'used'}</span>
              <span>{reportMeter.remaining} {isAr ? 'متبقي' : 'remaining'}</span>
            </div>
          </div>
        </div>

        {/* Footer info link */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            {t('billing.nextReset')}: <strong className="text-slate-300 font-mono">{usage.billingPeriod}-30</strong>
          </span>
          <Link href="/billing" className="text-cyan-400 hover:underline">
            {isAr ? 'إدارة الفوترة' : 'Manage Subscription'}
          </Link>
        </div>
      </GlassCard>

      <UpgradeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentCount={videoMeter.used}
        limitCount={videoMeter.limit}
        onUpgradeSuccess={() => fetchUsage()}
      />
    </>
  );
};

export default UsageMeterWidget;
