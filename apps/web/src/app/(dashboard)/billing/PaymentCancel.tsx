'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, RefreshCw, MessageSquare } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { Badge } from '../../../components/ui/Badge';

function PaymentCancelContent() {
  const { locale, t } = useLocale();
  const isAr = locale === 'ar';
  const searchParams = useSearchParams();
  const gateway = searchParams.get('gateway') || 'paymob';

  return (
    <div className="max-w-md mx-auto py-12 px-4" dir={isAr ? 'rtl' : 'ltr'}>
      <GlassCard className="p-8 text-center space-y-6 bg-[#0c1228]/90 border-white/10 shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div>
          <Badge variant="amber" size="sm">
            {isAr ? 'تم الإلغاء' : 'Transaction Canceled'}
          </Badge>
          <h2 className="text-2xl font-black text-white mt-3">
            {t('billing.cancelTitle')}
          </h2>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {t('billing.cancelSubtitle')}
          </p>
        </div>

        {/* Local Support Notice for Egypt */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 text-start space-y-1">
          <span className="font-semibold text-slate-200 block">
            {isAr ? 'تواجه مشكلة في الدفع عبر البطاقة أو فوري؟' : 'Trouble checking out?'}
          </span>
          <p>
            {isAr
              ? 'فريق الدعم الفني متواجد بالقاهرة على مدار الساعة لمساعدتك في إتمام الاشتراك عبر فودافون كاش أو إنستاباي أو التحويل البنكي.'
              : 'Our support desk in Cairo is ready to assist with InstaPay, Vodafone Cash, or manual bank wire.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Link href="/billing" className="w-full">
            <GlassButton variant="primary" className="w-full justify-center text-xs py-2.5 font-bold">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('billing.retryPayment')}</span>
            </GlassButton>
          </Link>

          <Link href="/dashboard" className="w-full">
            <GlassButton variant="outline" className="w-full justify-center text-xs py-2.5">
              <span>{t('billing.returnDashboard')}</span>
            </GlassButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

export const PaymentCancel = () => (
  <Suspense fallback={<div className="p-12 text-center text-white">Loading...</div>}>
    <PaymentCancelContent />
  </Suspense>
);

export default PaymentCancel;
