import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppLogo } from '@/components/ui';
import { ShieldCheck, Lock, Award } from 'lucide-react';

export const AuthShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center p-4 sm:p-6 lg:p-8 select-none font-sans">
      {/* Desktop Split Layout Container */}
      <div className="w-full max-w-5xl bg-white border border-[#E6E8EC] rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[620px]">
        {/* Left Branding Panel (Desktop Only) */}
        <div className="hidden lg:flex w-5/12 bg-[#0E1B2A] text-white p-10 flex-col justify-between relative overflow-hidden border-r border-[#1C2E42]">
          {/* Subtle Institutional Background Grid Accent */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#C6A75E 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#C6A75E]/5 blur-3xl pointer-events-none" />

          {/* Top Branding Header */}
          <div className="relative z-10">
            <AppLogo
              size="lg"
              theme="dark"
              subtitle="Computerized Testing & Examination System"
            />
          </div>

          {/* Middle Copy & Trust Points */}
          <div className="relative z-10 space-y-6 my-auto py-8">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                Institutional Assessment Portal
              </h2>
              <p className="text-xs text-[#A0AEC0] mt-2 leading-relaxed font-normal">
                Secure assessment and examination management for Pakistan Armed Forces preparation.
              </p>
            </div>

            {/* Trust Points List */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center space-x-3 text-xs text-[#E2E8F0]">
                <div className="w-7 h-7 rounded-lg bg-[#1C2E42] text-[#C6A75E] flex items-center justify-center flex-shrink-0 border border-[#2E425A]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Secure role-based access control</span>
              </div>

              <div className="flex items-center space-x-3 text-xs text-[#E2E8F0]">
                <div className="w-7 h-7 rounded-lg bg-[#1C2E42] text-[#C6A75E] flex items-center justify-center flex-shrink-0 border border-[#2E425A]">
                  <Lock className="w-4 h-4" />
                </div>
                <span>Server-authoritative examinations</span>
              </div>

              <div className="flex items-center space-x-3 text-xs text-[#E2E8F0]">
                <div className="w-7 h-7 rounded-lg bg-[#1C2E42] text-[#C6A75E] flex items-center justify-center flex-shrink-0 border border-[#2E425A]">
                  <Award className="w-4 h-4" />
                </div>
                <span>Protected candidate evaluation results</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="relative z-10 pt-4 border-t border-[#1C2E42] text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Shuja Forces Academy Pindsultani</span>
            <span>Version 2.4</span>
          </div>
        </div>

        {/* Right Authentication Panel */}
        <div className="w-full lg:w-7/12 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          {/* Mobile Header (Shown on mobile/tablet) */}
          <div className="lg:hidden mb-8 flex justify-center text-center">
            <AppLogo
              size="md"
              theme="light"
              subtitle="Computerized Testing & Examination System"
            />
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
