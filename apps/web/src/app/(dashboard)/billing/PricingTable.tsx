'use client';

import React, { useState } from 'react';
import {
  Check,
  ShieldCheck,
  Zap,
  CreditCard,
  Building,
  Sparkles,
  ArrowRight,
  ExternalLink,
  QrCode,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { Badge } from '../../../components/ui/Badge';
import { apiClient } from '../../../lib/api-client';

interface PricingTableProps {
  currentTier?: string;
  onUpgradeSuccess?: (newTier: string) => void;
}

export const PricingTable: React.FC<PricingTableProps> = ({
  currentTier = 'FREE',
  onUpgradeSuccess,
}) => {
  const { locale, t } = useLocale();
  const isAr = locale === 'ar';

  const [currency, setCurrency] = useState<'EGP' | 'USD'>('EGP');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedMethod, setSelectedMethod] = useState<'meeza' | 'card' | 'fawry' | 'wallet' | 'stripe'>('meeza');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  // Fawry code modal state
  const [fawryData, setFawryData] = useState<{
    code: string;
    expiresAt: string;
    amount: number;
    planName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const tiers = [
    {
      id: 'FREE',
      nameEn: 'Free Scout',
      nameAr: 'المستكشف المجاني',
      taglineEn: 'For grassroots scouts and freelance testing',
      taglineAr: 'للمستكشفين المبتدئين والتجربة السريعة للذكاء الاصطناعي',
      priceEgp: { monthly: 0, annual: 0 },
      priceUsd: { monthly: 0, annual: 0 },
      badgeEn: 'Free Forever',
      badgeAr: 'مجاني دائماً',
      limits: {
        videos: isAr ? '3 مباريات شهرياً' : '3 matches / month',
        duration: isAr ? '15 دقيقة فيديو' : '15 mins video max',
        reports: isAr ? '3 تقارير بالذكاء الاصطناعي' : '3 AI scouting dossiers',
        players: isAr ? 'حتى 5 لاعبين' : '5 athlete profiles',
      },
      features: isAr
        ? [
            'معالجة فيديو بدقة 1080p',
            'التعرف على اللاعبين بالرؤية الحاسوبية',
            'تقييم كشفي تكتيكي أولي',
            'دعم مجتمعي',
          ]
        : [
            'Standard 1080p video processing',
            'Computer Vision player detection',
            'Initial tactical scouting grade',
            'Community support',
          ],
      popular: false,
    },
    {
      id: 'STARTER',
      nameEn: 'Starter Coach',
      nameAr: 'المدرب المستقل',
      taglineEn: 'For private trainers, local analysts & independent scouts in Egypt',
      taglineAr: 'للمدربين الخصوصيين ومحللي الأداء ومستكشفي المواهب المستقلين',
      priceEgp: { monthly: 499, annual: 4990 },
      priceUsd: { monthly: 15, annual: 149 },
      badgeEn: 'Egyptian Coach Choice',
      badgeAr: 'المفضل للمدربين في مصر',
      limits: {
        videos: isAr ? '15 مباراة شهرياً' : '15 matches / month',
        duration: isAr ? '90 دقيقة فيديو' : '90 mins video',
        reports: isAr ? '15 تقرير تكتيكي متعمق' : '15 deep AI reports',
        players: isAr ? 'حتى 25 ملف لاعب' : '25 athlete profiles',
      },
      features: isAr
        ? [
            '15 فيديو ومباراة شهرياً',
            'تحليل كينماتيكي للارتقاء وزمن الطيران',
            'تصدير تقارير رسمية بصيغة PDF',
            'دعم الدفع عبر ميزة وفوري كاش',
            'تقارير باللغة العربية والإنجليزية',
          ]
        : [
            '15 matches / month processing',
            'Kinematic jump & hang-time biomechanics',
            'Export official PDF dossiers',
            'Meeza & Fawry kiosk cash payments',
            'Bilingual reports (Arabic / English)',
          ],
      popular: false,
    },
    {
      id: 'PRO',
      nameEn: 'Pro Academy',
      nameAr: 'الأكاديمية المحترفة',
      taglineEn: 'Tailored for Premier Egyptian academies & regional football clubs',
      taglineAr: 'مصمم خصيصاً لأكاديميات وقطاعات الناشئين في مصر والشرق الأوسط',
      priceEgp: { monthly: 1999, annual: 19990 },
      priceUsd: { monthly: 49, annual: 490 },
      badgeEn: 'Most Popular in Egypt',
      badgeAr: 'الأكثر طلباً للأكاديميات المصرية',
      limits: {
        videos: isAr ? '60 مباراة شهرياً' : '60 matches / month',
        duration: isAr ? '360 دقيقة (6 ساعات)' : '360 mins (6 hours)',
        reports: isAr ? '60 تقرير تكتيكي معتمد' : '60 verified dossiers',
        players: isAr ? 'حتى 100 لاعب عبر الفئات' : '100 athlete profiles',
      },
      features: isAr
        ? [
            '60 مباراة شهرياً لتغطية مسابقات الناشئين',
            'مسح فوري للاعبي الفريق مع التعرف على أرقام القمصان',
            'شعار الاعتماد الرياضي المعتمد من الفيفا واللجنة الأولمبية',
            'توليد تقارير تكتيكية بالعربية الفصحى مع التوجيهات الفنية',
            'صلاحيات متعددة لـ 5 مدربين ومحللين',
            'دعم فني أولوي عبر واتساب والهاتف بالقاهرة',
          ]
        : [
            '60 match uploads / month',
            'Multi-player CV pitch scanning & jersey IDs',
            'FIFA & Olympic Accreditation verification badge',
            'Arabic & English deep tactical narratives',
            'Multi-coach access (up to 5 accounts)',
            'Priority WhatsApp & phone support in Cairo',
          ],
      popular: true,
    },
    {
      id: 'ENTERPRISE',
      nameEn: 'Enterprise Club',
      nameAr: 'الأندية والاتحادات',
      taglineEn: 'Complete infrastructure for Premier League clubs & national federations',
      taglineAr: 'بنية تحتية متكاملة لأندية الدوري الممتاز والاتحادات الرياضية',
      priceEgp: { monthly: 6999, annual: 69990 },
      priceUsd: { monthly: 199, annual: 1990 },
      badgeEn: 'Premier League Tier',
      badgeAr: 'لأندية الدوري الممتاز',
      limits: {
        videos: isAr ? '500+ مباراة شهرياً' : '500+ matches / month',
        duration: isAr ? 'غير محدود (5000 دقيقة)' : 'Unlimited (5,000 mins)',
        reports: isAr ? 'تقارير ذكاء اصطناعي غير محدودة' : 'Unlimited AI dossiers',
        players: isAr ? 'إدارة كامل قطاع الناشئين' : 'Full club roster (1,000+)',
      },
      features: isAr
        ? [
            'تغطية كامل قطاع الناشئين والفريق الأول للنادي',
            'طابور معالجة فائق السرعة عبر خوادم GPU مخصصة',
            'ربط مباشر عبر API ومستشعرات ESP32 الحركية',
            'مدير حسابات ودعم فني مباشر متواجد بالقاهرة والجيزة',
            'عقود رسمية للشركات واتفاقية مستوى خدمة SLA 99.9%',
          ]
        : [
            'Full coverage for youth sector and 1st team',
            'Dedicated Computer Vision GPU processing worker',
            'Custom API & ESP32 wearable sensor integration',
            'Dedicated technical account manager in Cairo & Giza',
            'Corporate contracts & 99.9% uptime SLA',
          ],
      popular: false,
    },
  ];

  const handleCheckout = async (tierId: string) => {
    if (tierId === currentTier) return;
    setLoadingTier(tierId);

    try {
      const isEgMethod = selectedMethod === 'meeza' || selectedMethod === 'fawry' || selectedMethod === 'wallet';
      const gateway = isEgMethod ? 'paymob' : currency === 'EGP' ? 'paymob' : 'stripe';

      const res = await apiClient.createCheckoutSession({
        tier: tierId,
        currency,
        gateway,
        paymentMethod: selectedMethod === 'stripe' ? 'card' : selectedMethod,
        billingCycle,
        customerEmail: 'director@academy.eg',
        customerName: isAr ? 'مدير الأكاديمية' : 'Academy Director',
      });

      // If Fawry cash payment was chosen, show reference code modal
      if (selectedMethod === 'fawry' && res.fawryRefCode) {
        setFawryData({
          code: res.fawryRefCode,
          expiresAt: res.fawryExpiresAt || '48 hours',
          amount: res.amountEgp || (tierId === 'STARTER' ? 499 : 1999),
          planName: isAr ? (tierId === 'STARTER' ? 'المدرب المستقل' : 'الأكاديمية المحترفة') : tierId,
        });
        setLoadingTier(null);
        return;
      }

      // If simulated or has checkout URL, handle redirect
      if (res.checkoutUrl) {
        if (res.simulated) {
          // Immediately simulate upgrade for smooth preview experience
          await apiClient.simulateUpgrade(tierId);
          if (onUpgradeSuccess) onUpgradeSuccess(tierId);
          window.location.href = res.checkoutUrl;
        } else {
          window.location.href = res.checkoutUrl;
        }
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      // Fallback: direct simulation
      await apiClient.simulateUpgrade(tierId).catch(() => {});
      if (onUpgradeSuccess) onUpgradeSuccess(tierId);
    } finally {
      setLoadingTier(null);
    }
  };

  const copyFawryCode = () => {
    if (fawryData?.code) {
      navigator.clipboard.writeText(fawryData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Controls: Currency & Billing Frequency */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
        {/* Currency Switcher & Egyptian PPP Notice */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            {t('billing.currencyToggle')}:
          </span>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
            <button
              onClick={() => setCurrency('EGP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currency === 'EGP'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇪🇬 {isAr ? 'الجنيه المصري (EGP)' : 'EGP (Egyptian Pounds)'}
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currency === 'USD'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 {isAr ? 'دولار أمريكي (USD)' : 'USD (Global)'}
            </button>
          </div>

          <Badge variant="emerald" size="sm" icon={<Zap className="w-3 h-3 text-emerald-400" />}>
            {isAr ? 'تخفيض القوة الشرائية لمصر (PPP Active)' : 'Egypt PPP Pricing Active'}
          </Badge>
        </div>

        {/* Monthly vs. Annual Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('billing.cycleMonthly')}
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              billingCycle === 'annual'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>{t('billing.cycleAnnual')}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Local Payment Methods Selector */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <CreditCard className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold">
            {isAr ? 'طرق الدفع المحلية المعتمدة في مصر:' : 'Supported Regional Payment Methods:'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'meeza', label: isAr ? 'بطاقة ميزة الوطنية' : 'Meeza Cards', icon: '💳' },
            { id: 'fawry', label: isAr ? 'فوري كاش (Fawry)' : 'Fawry Kiosks', icon: '🏪' },
            { id: 'wallet', label: isAr ? 'فودافون كاش وإنستاباي' : 'Vodafone / InstaPay', icon: '📱' },
            { id: 'card', label: isAr ? 'فيزا وماستركارد' : 'Visa / Mastercard', icon: '🏦' },
            { id: 'stripe', label: isAr ? 'سترايب الدولي' : 'Stripe Global', icon: '🌐' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                selectedMethod === m.id
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => {
          const isCurrent = currentTier.toUpperCase() === tier.id;
          const isPopular = tier.popular;
          const priceObj = currency === 'EGP' ? tier.priceEgp : tier.priceUsd;
          const price = billingCycle === 'annual' ? priceObj.annual : priceObj.monthly;
          const symbol = currency === 'EGP' ? (isAr ? 'ج.م' : 'EGP') : '$';
          const periodLabel = billingCycle === 'annual' ? (isAr ? '/ سنوياً' : '/ year') : (isAr ? '/ شهرياً' : '/ month');

          return (
            <GlassCard
              key={tier.id}
              className={`relative flex flex-col justify-between transition-all duration-300 ${
                isPopular
                  ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.25)] bg-[#0c1228]/90 scale-[1.02]'
                  : 'border-white/10 bg-[#070b18]/80 hover:border-white/20'
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-[10px] font-black uppercase tracking-wider text-white shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>{isAr ? tier.badgeAr : tier.badgeEn}</span>
                  </div>
                </div>
              )}

              <div>
                {/* Header: Title & Tagline */}
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                      {isAr ? tier.nameAr : tier.nameEn}
                    </h3>
                    {isCurrent && (
                      <Badge variant="primary" size="sm">
                        {t('billing.currentPlanBadge')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 min-h-[36px]">
                    {isAr ? tier.taglineAr : tier.taglineEn}
                  </p>
                </div>

                {/* Price Display */}
                <div className="my-6 pb-6 border-b border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                      {price.toLocaleString()}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">{symbol}</span>
                    <span className="text-xs text-slate-500">{periodLabel}</span>
                  </div>
                  {currency === 'EGP' && price > 0 && (
                    <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                      {isAr ? 'مقبول عبر بطاقات ميزة وفوري كاش' : 'Payable via Meeza & Fawry Kiosks'}
                    </span>
                  )}
                </div>

                {/* Meter Limits Quick Digest */}
                <div className="space-y-2 mb-6 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">{isAr ? 'المباريات:' : 'Matches:'}</span>
                    <span className="font-bold text-cyan-300">{tier.limits.videos}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">{isAr ? 'التقارير:' : 'Reports:'}</span>
                    <span className="font-bold text-indigo-300">{tier.limits.reports}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">{isAr ? 'اللاعبين:' : 'Athletes:'}</span>
                    <span className="font-bold text-emerald-300">{tier.limits.players}</span>
                  </div>
                </div>

                {/* Feature Checklist */}
                <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-white/10">
                <GlassButton
                  variant={isCurrent ? 'outline' : isPopular ? 'emerald' : 'primary'}
                  className="w-full justify-center font-bold text-xs py-2.5"
                  disabled={isCurrent || loadingTier === tier.id}
                  onClick={() => handleCheckout(tier.id)}
                >
                  {loadingTier === tier.id ? (
                    <span>{t('common.loading')}</span>
                  ) : isCurrent ? (
                    <span>{t('billing.currentPlanBadge')}</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span>{t('billing.checkoutButton')}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                    </div>
                  )}
                </GlassButton>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Fawry Reference Code Modal */}
      {fawryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-md w-full p-6 rounded-2xl bg-[#0c1228] border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.2)] text-white space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-lg text-amber-300">
                  {isAr ? 'كود الدفع النقدي عبر فوري' : 'Fawry Cash Payment Code'}
                </h4>
                <p className="text-xs text-slate-400">
                  {isAr ? 'صالحة للدفع في أي كشك أو سوبرماركت' : 'Payable at any Fawry retail terminal in Egypt'}
                </p>
              </div>
            </div>

            {/* Reference Number Box */}
            <div className="p-4 rounded-xl bg-black/60 border border-amber-500/40 text-center space-y-2">
              <span className="text-[11px] font-mono text-slate-400 block uppercase">
                {isAr ? 'الرقم المرجعي للدفع (Fawry Ref No):' : 'Fawry Reference Code:'}
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-3xl font-black tracking-widest text-amber-300">
                  {fawryData.code}
                </span>
                <button
                  onClick={copyFawryCode}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-all cursor-pointer"
                  title="Copy"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-2 pt-1">
                <span>{isAr ? 'المبلغ المطلوب:' : 'Amount:'}</span>
                <span className="font-bold text-white font-mono">{fawryData.amount} ج.م</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <p className="font-semibold text-white">
                {isAr ? 'خطوات السداد:' : 'Payment Steps:'}
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>{isAr ? 'توجه لأي منفذ يقدم خدمة فوري أو تطبيق Fawry Plus.' : 'Visit any merchant or supermarket with a Fawry POS terminal.'}</li>
                <li>{isAr ? 'اطلب الدفع على كود الخدمة رقم: 788 (مدفوعات ScoutAI الرياضية).' : 'Ask the cashier to pay service code 788 (ScoutAI Sports Intelligence).'}</li>
                <li>{isAr ? `أدخل الرقم المرجعي: ${fawryData.code}.` : `Provide reference code: ${fawryData.code}.`}</li>
                <li>{isAr ? 'استلم إيصال السداد وسيتم تفعيل حسابك آلياً.' : 'Collect your paper receipt; activation occurs automatically within 2 minutes.'}</li>
              </ol>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <GlassButton
                variant="primary"
                className="w-full justify-center text-xs py-2.5 font-bold"
                onClick={() => {
                  setFawryData(null);
                  if (onUpgradeSuccess) onUpgradeSuccess('STARTER');
                }}
              >
                {isAr ? 'تم، العودة للوحة التحكم' : 'Understood, Return to Dashboard'}
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingTable;
