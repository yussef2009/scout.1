'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale';
import { GlassButton } from '../../../components/ui/GlassButton';
import { Badge } from '../../../components/ui/Badge';
import { apiClient } from '../../../lib/api-client';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceName?: string;
  currentCount?: number;
  limitCount?: number;
  onUpgradeSuccess?: (newTier: string) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  resourceName = 'video_uploads',
  currentCount = 3,
  limitCount = 3,
  onUpgradeSuccess,
}) => {
  const { locale, t } = useLocale();
  const isAr = locale === 'ar';
  const [loading, setLoading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  if (!isOpen) return null;

  const resourceTitle =
    resourceName === 'video_uploads'
      ? isAr ? 'فيديوهات المباريات' : 'Match Video Uploads'
      : resourceName === 'ai_reports'
      ? isAr ? 'تقارير الذكاء الاصطناعي التكتيكية' : 'AI Scouting Dossiers'
      : isAr ? 'ملفات اللاعبين' : 'Athlete Profiles';

  const handleSimulateUpgrade = async (targetTier: string) => {
    setLoading(true);
    try {
      await apiClient.simulateUpgrade(targetTier);
      setUpgraded(true);
      if (onUpgradeSuccess) onUpgradeSuccess(targetTier);
      setTimeout(() => {
        setUpgraded(false);
        onClose();
      }, 1500);
    } catch (e) {
      console.error('Upgrade simulation error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative max-w-lg w-full p-6 md:p-8 rounded-3xl bg-[#0c1228] border border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.25)] text-white space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 ltr:right-5 rtl:left-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Badge & Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <Badge variant="rose" size="sm" icon={<Zap className="w-3 h-3 text-rose-400" />}>
              {isAr ? 'تم بلوغ الحد الشهري للباقة' : 'Monthly Quota Exhausted'}
            </Badge>
            <h3 className="text-xl font-extrabold text-white mt-1">
              {isAr ? `استنفاد حصة ${resourceTitle}` : `${resourceTitle} Limit Reached`}
            </h3>
          </div>
        </div>

        {/* Quota Progress Status */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">{isAr ? 'الاستهلاك الفعلي:' : 'Current Consumption:'}</span>
            <span className="font-bold text-rose-400">
              {currentCount} / {limitCount} ({isAr ? '100% مستنفد' : '100% Used'})
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full w-full" />
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {isAr
              ? `لقد استنفدت الحصة المجانية المتاحة لهذا الشهر (${limitCount}/${currentCount}). للوصول غير المحدود وتوليد المزيد من التحليلات التكتيكية، اختر باقة الأكاديميات المحترفة.`
              : `You have consumed all ${limitCount} free slots allocated for this month. Upgrade to Pro Academy for 60 matches and official FIFA-grade dossiers.`}
          </p>
        </div>

        {/* Quick Upgrade Recommendations */}
        <div className="space-y-3">
          <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
            {isAr ? 'خيارات الترقية الفورية:' : 'Instant Upgrade Options:'}
          </span>

          {/* Option 1: Pro Academy (Recommended) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-cyan-950/40 border border-indigo-500/40 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  {isAr ? 'الأكاديمية المحترفة (Pro Academy)' : 'Pro Academy'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  {isAr ? 'الموصى بها' : 'Recommended'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr ? '60 مباراة + 60 تقرير + مسح جماعي للقمصان' : '60 Matches + 60 Reports + Multi-Player CV'}
              </p>
              <div className="text-sm font-mono font-extrabold text-cyan-300 mt-1">
                1,999 {isAr ? 'ج.م / شهرياً' : 'EGP / mo'}
              </div>
            </div>

            <GlassButton
              variant="primary"
              size="sm"
              className="font-bold text-xs shrink-0"
              disabled={loading}
              onClick={() => handleSimulateUpgrade('PRO')}
            >
              {loading ? (
                <span>{t('common.loading')}</span>
              ) : upgraded ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <div className="flex items-center gap-1">
                  <span>{isAr ? 'ترقية الآن' : 'Upgrade'}</span>
                  <ArrowRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
                </div>
              )}
            </GlassButton>
          </div>

          {/* Option 2: Starter Coach */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-sm text-white">
                {isAr ? 'المدرب المستقل (Starter Coach)' : 'Starter Coach'}
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr ? '15 مباراة + 15 تقرير تكتيكي' : '15 Matches + 15 Reports / mo'}
              </p>
              <div className="text-sm font-mono font-bold text-slate-200 mt-1">
                499 {isAr ? 'ج.م / شهرياً' : 'EGP / mo'}
              </div>
            </div>

            <GlassButton
              variant="outline"
              size="sm"
              className="font-bold text-xs shrink-0"
              disabled={loading}
              onClick={() => handleSimulateUpgrade('STARTER')}
            >
              <span>{isAr ? 'ترقية للبدء' : 'Select'}</span>
            </GlassButton>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-400">
          <a
            href="/billing"
            className="text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1"
          >
            <span>{isAr ? 'عرض جدول مقارنة الباقات الكامل' : 'View Full Pricing Table'}</span>
          </a>
          <button
            onClick={onClose}
            className="hover:text-white transition-colors cursor-pointer"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
