import React from 'react';
import { useAuth } from '@/app/providers';
import { Shield, User, Award, CheckCircle } from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-md border border-[#D4D9DF] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#C6A75E] uppercase tracking-wider">
            OFFICIAL CADET PERSONNEL DOCKET
          </span>
          <h1 className="text-xl font-bold text-[#0E1B2A] mt-0.5">{user?.name || 'Cadet Hamza Tariq'}</h1>
          <p className="text-xs text-[#64748B] font-mono mt-0.5">
            ROLL NO: {user?.rollNumber || 'PMA-2601'} | CNIC: 35202-8941205-1
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#234E35] bg-[#EDF6F0] px-3 py-1 rounded border border-[#88BE9B]">
          <CheckCircle className="w-4 h-4" /> ACTIVE CANDIDATE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-4">
          <div className="flex flex-col items-center text-center pb-4 border-b border-[#E2E6EB]">
            <div className="w-20 h-20 rounded-md bg-[#0E1B2A] text-[#C6A75E] flex items-center justify-center font-bold text-2xl border-2 border-[#C6A75E] shadow-sm mb-3">
              <User className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-[#0E1B2A]">{user?.name || 'Hamza Tariq'}</h2>
            <p className="text-xs text-[#64748B] font-mono">PMA Long Course Alpha</p>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider mt-2 bg-[#F6F8FA] px-2.5 py-1 rounded border border-[#D4D9DF] text-[#0E1B2A]">
              {user?.branch || 'PAKISTAN ARMY'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-[#F0F2F5] pb-2">
              <span className="text-[#64748B]">CNIC / B-Form</span>
              <span className="font-mono font-semibold text-[#0E1B2A]">35202-8941205-1</span>
            </div>
            <div className="flex justify-between border-b border-[#F0F2F5] pb-2">
              <span className="text-[#64748B]">Father's Name</span>
              <span className="font-semibold text-[#0E1B2A]">Tariq Mahmood</span>
            </div>
            <div className="flex justify-between border-b border-[#F0F2F5] pb-2">
              <span className="text-[#64748B]">Batch Code</span>
              <span className="font-mono font-semibold text-[#0E1B2A]">BATCH-2026-A</span>
            </div>
            <div className="flex justify-between border-b border-[#F0F2F5] pb-2">
              <span className="text-[#64748B]">Enrolled Date</span>
              <span className="font-mono font-semibold text-[#0E1B2A]">15 Jan 2026</span>
            </div>
          </div>
        </div>

        {/* Academic & Intelligence Evaluation Summary */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider border-b border-[#E2E6EB] pb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#C6A75E]" />
              <span>Cumulative Evaluation Scores</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F6F8FA] p-4 rounded border border-[#E2E6EB] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold">Verbal & Non-Verbal Composite</span>
                <div className="text-2xl font-bold font-mono text-[#0E1B2A]">92.4%</div>
                <p className="text-[11px] text-[#234E35] font-semibold">Cleared Intelligence Standard</p>
              </div>

              <div className="bg-[#F6F8FA] p-4 rounded border border-[#E2E6EB] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold">Academic Subjects Average</span>
                <div className="text-2xl font-bold font-mono text-[#0E1B2A]">88.5%</div>
                <p className="text-[11px] text-[#64748B]">Mathematics, Physics, English</p>
              </div>
            </div>

            <div className="bg-[#F6F8FA] p-4 rounded border border-[#E2E6EB] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#0E1B2A]">Overall Stanine Score Rating:</span>
                <span className="font-mono font-bold text-[#0E1B2A] bg-[#C6A75E]/20 px-2 py-0.5 rounded text-[#0E1B2A]">
                  STANINE 8 (TOP 10%)
                </span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                The Stanine rating reflects high cognitive speed, verbal dexterity, and analytical consistency evaluated across all computerized testing sessions.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0E1B2A]" />
              <span>Academy Examination Rules Acknowledgment</span>
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Candidate status is maintained under strict compliance with Forces Academy Examination Regulations. All test sessions are monitored via live proctoring telemetry and biometric authentication records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
