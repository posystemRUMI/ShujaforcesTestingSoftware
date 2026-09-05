import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Shield, Lock, Save, AlertOctagon } from 'lucide-react';
import { useAuth } from '@/app/providers';

export const ExamShell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F6F8FA] select-none text-[#1F2937] exam-runner">
      {/* Top Locked Telemetry Strip (48px) */}
      <header className="h-12 bg-[#0E1B2A] text-white px-5 flex items-center justify-between z-30 border-b border-[#1C2E42] flex-shrink-0">
        {/* Left: Academy Brand & Cadet Dossier Badge */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-[#C6A75E] flex items-center justify-center text-[#0E1B2A]">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-white">Forces Academy CBT</span>
          </div>

          <div className="h-4 w-[1px] bg-[#2E425A]" />

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#A0AEC0]">CADET:</span>
            <span className="font-semibold text-white">{user?.name || 'Cadet Hamza Tariq'}</span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#1C2E42] text-[#C6A75E] rounded">
              {user?.rollNumber || 'PMA-2601'}
            </span>
          </div>
        </div>

        {/* Center: Secure Air-Gapped Session Seal */}
        <div className="flex items-center space-x-2 bg-[#08111A] px-3 py-1 rounded border border-[#1C2E42] text-[11px] font-mono text-[#A0AEC0]">
          <Lock className="w-3 h-3 text-[#C6A75E]" />
          <span>AIR-GAPPED CBT MODE (WS-01)</span>
        </div>

        {/* Right: Autosave Indicator & Emergency Terminate */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
            <Save className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono uppercase tracking-wide">Autosaved</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/exam/finish')}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#782525]/30 hover:bg-[#782525]/60 text-red-200 border border-[#782525] rounded text-xs font-semibold transition-colors"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Finish Session</span>
          </button>
        </div>
      </header>

      {/* Examination Content Canvas */}
      <main className="flex-1 overflow-y-auto flex justify-center p-6">
        <div className="w-full max-w-5xl h-full flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
