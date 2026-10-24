import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ScoutAI 2.0 — Multi-Tenant Athletic Intelligence Platform',
  description: 'AI Computer Vision & Biomechanical Sports Scouting Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className="antialiased min-h-screen bg-[#070b18] text-slate-100 relative overflow-x-hidden">
        {/* Background Ambient Floating Orbs */}
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />

        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
