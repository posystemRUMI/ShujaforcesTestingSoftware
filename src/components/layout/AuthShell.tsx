import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppLogo } from '@/components/ui';

export const AuthShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col justify-center items-center p-4 select-none">
      <div className="mb-6 flex flex-col items-center text-center">
        <AppLogo size="lg" theme="light" subtitle="Air-Gapped Armed Forces Examination & Induction" />
      </div>

      <div className="w-full max-w-md bg-white border-2 border-[#0E1B2A] rounded p-8 shadow-[0_4px_0_0_rgba(14,27,42,0.08)]">
        <Outlet />
      </div>

      <div className="mt-8 text-center text-[11px] text-[#64748B] space-y-1 font-mono">
        <p>Restricted Institutional Access — Pakistan Armed Forces Preparation</p>
        <p className="text-[10px] text-[#A0AEC0]">STATION ENCRYPTION: SHA-256 | LAN AIR-GAP: VERIFIED</p>
      </div>
    </div>
  );
};

export default AuthShell;
