'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Receipt,
  Download,
  QrCode,
} from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { Badge } from '../../../components/ui/Badge';

function PaymentSuccessContent() {
  const { locale, t } = useLocale();
  const isAr = locale === 'ar';
  const searchParams = useSearchParams();

  const gateway = searchParams.get('gateway') || 'paymob';
  const tier = (searchParams.get('tier') || 'PRO').toUpperCase();
  const orderId = searchParams.get('order_id') || searchParams.get('session_id') || 'SCOUT-EG-88912';
  const fawryCode = searchParams.get('fawry_code');
  const method = searchParams.get('method') || (gateway === 'paymob' ? 'Meeza / Cards' : 'Stripe');

  const tierName =
    tier === 'PRO'
      ? isAr ? 'الأكاديمية المحترفة (Pro Academy)' : 'Pro Academy'
      : tier === 'STARTER'
      ? isAr ? 'المدرب المستقل (Starter Coach)' : 'Starter Coach'
      : isAr ? 'الأندية والاتحادات' : 'Enterprise Club';

  return (
    <div className="max-w-xl mx-auto py-12 px-4" dir={isAr ? 'rtl' : 'ltr'}>
      <GlassCard className="p-8 text-center space-y-6 relative overflow-hidden bg-[#0c1228]/90 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
        {/* Animated Celebration Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce duration-1000">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <Badge variant="emerald" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}>
            {isAr ? 'تم تأكيد المعاملة بنجاح' : 'Payment Confirmed'}
          </Badge>
          <h2 className="text-2xl md:text-3xl font-black text-white mt-3">
            {t('billing.successTitle')}
          </h2>
          <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            {t('billing.successSubtitle')}
          </p>
        </div>

        {/* Fawry Cash Box if relevant */}
        {fawryCode && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1 text-center">
            <span className="text-xs font-mono uppercase block">{t('billing.fawryCodeLabel')}:</span>
            <span className="font-mono text-2xl font-black tracking-widest">{fawryCode}</span>
            <p className="text-[11px] text-slate-300 pt-1">{t('billing.fawryInstruction')}</p>
          </div>
        )}

        {/* Receipt Breakdown Box */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/10 text-xs font-mono space-y-3 text-slate-300 text-start">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Receipt className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAr ? 'رقم الطلب / الفاتورة:' : 'Order / Reference:'}</span>
            </span>
            <span className="font-bold text-white">{orderId}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">{isAr ? 'الباقة المفعلة:' : 'Activated Tier:'}</span>
            <span className="font-bold text-cyan-300">{tierName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">{isAr ? 'بوابة السداد:' : 'Payment Gateway:'}</span>
            <span className="font-bold text-emerald-400 uppercase">
              {gateway === 'paymob' ? 'Paymob Egypt (Central Bank Approved)' : 'Stripe Global'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">{isAr ? 'طريقة الدفع:' : 'Payment Method:'}</span>
            <span className="font-bold text-white">{method}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-slate-400">{isAr ? 'حالة الحصص:' : 'Quota Status:'}</span>
            <span className="font-bold text-emerald-400">
              {isAr ? 'تم تفعيل 60 مباراة وتقرير فوراً' : '60 Matches & Reports Active'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link href="/dashboard" className="w-full">
            <GlassButton variant="emerald" className="w-full justify-center text-xs py-3 font-bold">
              <span>{t('billing.returnDashboard')}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
            </GlassButton>
          </Link>

          <Link href="/upload" className="w-full">
            <GlassButton variant="outline" className="w-full justify-center text-xs py-3 font-bold">
              <span>{isAr ? 'رفع مباراة وتحليلها الآن' : 'Upload Match Now'}</span>
            </GlassButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

export const PaymentSuccess = () => (
  <Suspense fallback={<div className="p-12 text-center text-white">Loading...</div>}>
    <PaymentSuccessContent />
  </Suspense>
);

export default PaymentSuccess;
