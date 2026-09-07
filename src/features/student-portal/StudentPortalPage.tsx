import React from 'react';
import { useAuth } from '@/app/providers';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentPortalPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#D4D9DF] rounded p-6 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-sans font-bold text-[#C6A75E] uppercase tracking-wider">Cadet Portal</span>
          <h1 className="text-xl font-bold text-[#0E1B2A] mt-1">{user?.name}</h1>
          <p className="text-xs text-[#64748B] font-sans mt-0.5">
            DOCKET: <span className="font-mono font-bold text-[#0E1B2A]">{user?.rollNumber || 'PMA-2601'}</span> | SQUADRON: 154 PMA LONG COURSE ALPHA
          </p>
        </div>
        <Link
          to="/exam/instructions"
          className="inline-flex items-center space-x-2 bg-[#0E1B2A] text-white px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1A2C42] transition-colors"
        >
          <span>Launch Computerized Test</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-[#D4D9DF] rounded p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-[#64748B]">Assigned Screening Exam</div>
          <div className="text-sm font-bold text-[#0E1B2A] mt-2">154 PMA Initial Test (Mock 04)</div>
          <div className="mt-3 flex items-center justify-between text-xs font-sans tabular-nums text-[#64748B]">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>65 Minutes</span>
            </span>
            <span className="text-emerald-700 font-semibold uppercase">SCHEDULED</span>
          </div>
        </div>

        <div className="bg-white border border-[#D4D9DF] rounded p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-[#64748B]">Intelligence Readiness</div>
          <div className="text-2xl font-bold font-display text-[#0E1B2A] mt-2">92%</div>
          <div className="mt-2 text-xs text-emerald-700 flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Verbal & Non-Verbal Cleared</span>
          </div>
        </div>

        <div className="bg-white border border-[#D4D9DF] rounded p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-[#64748B]">Academy Merit</div>
          <div className="text-2xl font-bold font-display text-[#0E1B2A] mt-2">Merit Standing</div>
          <div className="mt-2 text-xs text-[#64748B]">Official standing on academy leaderboard</div>
        </div>
      </div>
    </div>
  );
};

export default StudentPortalPage;
