'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, UploadCloud, Users, GitCompare, ShieldCheck, Globe, Cpu, CreditCard } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale';
import { Badge } from '../../components/ui/Badge';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: <Activity className="w-4 h-4" /> },
    { href: '/upload', label: t('nav.upload'), icon: <UploadCloud className="w-4 h-4" /> },
    { href: '/compare', label: t('nav.compare'), icon: <GitCompare className="w-4 h-4" /> },
    { href: '/billing', label: t('nav.billing'), icon: <CreditCard className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 h-18 border-b border-white/10 bg-[#070b18]/85 backdrop-blur-xl px-6 flex items-center justify-between">
        {/* Brand Logo & Crest */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
              <div className="w-full h-full bg-[#070b18] rounded-[10px] flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-tr from-indigo-400 to-cyan-300 text-lg">
                S2
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  ScoutAI <span className="text-cyan-400 font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">2.0</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase block">
                Athletic Intelligence Platform
              </span>
            </div>
          </Link>

          {/* Active Model Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono">gemini-2.5-flash (Cascade Active)</span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-2xl p-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_0_16px_rgba(99,102,241,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: User Profile Pill with Plan Badge, Accreditation & Language Switcher */}
        <div className="flex items-center gap-3">
          <Link
            href="/billing"
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all group cursor-pointer shadow-sm"
            title={locale === 'ar' ? 'عرض الباقة والاشتراك' : 'Manage Subscription Plan & Quotas'}
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_8px_rgba(99,102,241,0.4)]">
              OK
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                Omar Khalil
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 group-hover:border-cyan-400 group-hover:shadow-[0_0_10px_rgba(56,189,248,0.3)] transition-all">
                <span className="text-amber-400">⚡</span>
                PRO ACADEMY
                <span className="text-[8px] opacity-70">›</span>
              </span>
            </div>
          </Link>

          <Badge variant="emerald" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}>
            FIFA Verified
          </Badge>

          {/* Language Switcher */}
          <button
            onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            title="Toggle English / العربية"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{locale === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
