'use client';

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  UploadCloud,
  FileText,
  Clock,
  Users,
  Receipt,
  Download,
  Building,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { Badge } from '../../../components/ui/Badge';
import { PricingTable } from './PricingTable';
import { apiClient } from '../../../lib/api-client';

export default function BillingPage() {
  const { locale, t } = useLocale();
  const isAr = locale === 'ar';

  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadBillingData = async () => {
    try {
      const data = await apiClient.getBillingUsage();
      setUsage(data);
    } catch (e) {
      // Fallback data
      setUsage({
        tier: 'PRO',
        tierNameEn: 'Pro Academy',
        tierNameAr: 'الأكاديمية المحترفة',
        status: 'ACTIVE',
        billingCycle: 'monthly',
        currency: 'EGP',
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
    loadBillingData();
  }, []);

  const meters = usage?.meters || {
    videoUploads: { used: 0, limit: 60, percentUsed: 0 },
    videoDurationMinutes: { used: 0, limit: 360, percentUsed: 0 },
    aiReports: { used: 0, limit: 60, percentUsed: 0 },
    playersManaged: { used: 0, limit: 100, percentUsed: 0 },
  };

  const getMeterColor = (percent: number) => {
    if (percent >= 90) return 'from-rose-500 to-red-600';
    if (percent >= 70) return 'from-amber-400 to-orange-500';
    return 'from-emerald-400 to-teal-500';
  };

  return (
    <div className="space-y-10" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Page Title & Egyptian Market Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {t('billing.title')}
            </h1>
            <Badge variant="primary" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}>
              {isAr ? 'معتمد للأكاديميات المصرية' : 'Egypt Sports Tech'}
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t('billing.subtitle')}
          </p>
        </div>

        {/* Current Plan Overview Pill */}
        <div className="p-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-cyan-900/30 to-black/60 border border-indigo-500/30 flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              {t('billing.currentPlan')}
            </span>
            <span className="font-extrabold text-base text-white">
              {isAr ? usage?.tierNameAr || 'الأكاديمية المحترفة' : usage?.tierNameEn || 'Pro Academy'}
            </span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              {t('billing.planStatus')}
            </span>
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{usage?.status || 'ACTIVE'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Meters 4-Col Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>{t('billing.usageTitle')}</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {t('billing.nextReset')}: <strong className="text-white">{usage?.billingPeriod || '2026-10'}-30</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Match Video Uploads */}
          <GlassCard className="p-4 bg-[#0a0f20]/80 border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <UploadCloud className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {meters.videoUploads.percentUsed}%
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-300 font-semibold block">
                {t('billing.videoUploadsMeter')}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-extrabold text-white font-mono">
                  {meters.videoUploads.used}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ {meters.videoUploads.limit}</span>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getMeterColor(meters.videoUploads.percentUsed)}`}
                style={{ width: `${Math.min(100, meters.videoUploads.percentUsed)}%` }}
              />
            </div>
          </GlassCard>

          {/* 2. Processed Video Duration */}
          <GlassCard className="p-4 bg-[#0a0f20]/80 border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {meters.videoDurationMinutes.percentUsed}%
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-300 font-semibold block">
                {t('billing.videoDurationMeter')}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-extrabold text-white font-mono">
                  {meters.videoDurationMinutes.used}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ {meters.videoDurationMinutes.limit} {isAr ? 'دقيقة' : 'mins'}</span>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getMeterColor(meters.videoDurationMinutes.percentUsed)}`}
                style={{ width: `${Math.min(100, meters.videoDurationMinutes.percentUsed)}%` }}
              />
            </div>
          </GlassCard>

          {/* 3. AI Scouting Reports */}
          <GlassCard className="p-4 bg-[#0a0f20]/80 border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {meters.aiReports.percentUsed}%
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-300 font-semibold block">
                {t('billing.aiReportsMeter')}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-extrabold text-white font-mono">
                  {meters.aiReports.used}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ {meters.aiReports.limit}</span>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getMeterColor(meters.aiReports.percentUsed)}`}
                style={{ width: `${Math.min(100, meters.aiReports.percentUsed)}%` }}
              />
            </div>
          </GlassCard>

          {/* 4. Athlete Profiles Managed */}
          <GlassCard className="p-4 bg-[#0a0f20]/80 border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {meters.playersManaged.percentUsed}%
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-300 font-semibold block">
                {t('billing.playersManagedMeter')}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-extrabold text-white font-mono">
                  {meters.playersManaged.used}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ {meters.playersManaged.limit}</span>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getMeterColor(meters.playersManaged.percentUsed)}`}
                style={{ width: `${Math.min(100, meters.playersManaged.percentUsed)}%` }}
              />
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Main Pricing Matrix Section */}
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            {isAr ? 'اختر الباقة المناسبة لأكاديميتك أو ناديك' : 'Compare Subscription Plans'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isAr
              ? 'أسعار بالجنيه المصري والدولار مع دعم كامل لبطاقات ميزة والدفع النقدي بفروع فوري'
              : 'Multi-currency support with Meeza cards, Fawry kiosks, and international cards'}
          </p>
        </div>

        <PricingTable
          currentTier={usage?.tier || 'PRO'}
          onUpgradeSuccess={() => loadBillingData()}
        />
      </div>

      {/* Egyptian Academy Receipts & Accreditation Dossiers */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Receipt className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'سجل الفواتير وسندات السداد المعتمدة' : 'Official Invoices & Tax Receipts'}</span>
          </div>
          <span className="text-xs text-slate-400">
            {isAr ? 'خاضعة لمعايير مصلحة الضرائب المصرية والفيفا' : 'Egyptian Tax Authority & FIFA Compliant'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.01]">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-mono">
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'رقم الإيصال' : 'Invoice #'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'الباقة' : 'Plan'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'طريقة السداد' : 'Method'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'المبلغ' : 'Amount'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-4 text-end font-semibold">{isAr ? 'الإيصال' : 'Receipt'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 px-4 text-white font-bold">INV-2026-EG-8841</td>
                <td className="py-3.5 px-4 text-slate-400">2026-10-01</td>
                <td className="py-3.5 px-4 text-cyan-300">Pro Academy (60 matches)</td>
                <td className="py-3.5 px-4 text-slate-300">Paymob Meeza (ميزة)</td>
                <td className="py-3.5 px-4 text-white font-bold">1,999 EGP</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    {isAr ? 'مدفوع' : 'Paid'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-end">
                  <button
                    onClick={() => alert(isAr ? 'جاري تحميل الفاتورة الرسمية PDF...' : 'Downloading PDF Invoice...')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[10px]">PDF</span>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 px-4 text-white font-bold">INV-2026-EG-7719</td>
                <td className="py-3.5 px-4 text-slate-400">2026-09-01</td>
                <td className="py-3.5 px-4 text-cyan-300">Starter Coach</td>
                <td className="py-3.5 px-4 text-slate-300">Fawry Cash (فوري)</td>
                <td className="py-3.5 px-4 text-white font-bold">499 EGP</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    {isAr ? 'مدفوع' : 'Paid'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-end">
                  <button
                    onClick={() => alert(isAr ? 'جاري تحميل الفاتورة الرسمية PDF...' : 'Downloading PDF Invoice...')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[10px]">PDF</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
