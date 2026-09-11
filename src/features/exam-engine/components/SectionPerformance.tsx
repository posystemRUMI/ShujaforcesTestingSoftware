import React from 'react';
import { Layers, CheckCircle2, AlertCircle } from 'lucide-react';

export interface SectionBreakdownItem {
  title: string;
  pct: number;
  correct: number;
  total: number;
  cleared: boolean;
}

interface SectionPerformanceProps {
  sections: SectionBreakdownItem[];
}

export const SectionPerformance: React.FC<SectionPerformanceProps> = ({ sections }) => {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="bg-white border border-[#D4D9DF] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-[#0E1B2A]" />
          <h2 className="text-base font-bold text-[#0E1B2A] font-sans">Section-wise Performance Analysis</h2>
        </div>
        <span className="text-xs text-[#64748B] font-sans font-medium">
          {sections.length} Evaluation {sections.length === 1 ? 'Section' : 'Sections'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec, idx) => (
          <div
            key={idx}
            className={`border rounded-xl p-4 transition-all ${
              sec.cleared
                ? 'bg-white border-[#D4D9DF] hover:border-[#88BE9B]'
                : 'bg-[#FFFDFD] border-[#E29A9A]/60 hover:border-[#E29A9A]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-sans font-bold text-[#64748B] uppercase tracking-wider block">
                {sec.title}
              </span>
              {sec.cleared ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#234E35] bg-[#EDF6F0] px-2 py-0.5 rounded border border-[#88BE9B]">
                  <CheckCircle2 className="w-3 h-3" /> CLEARED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#782525] bg-[#FDF2F2] px-2 py-0.5 rounded border border-[#E29A9A]">
                  <AlertCircle className="w-3 h-3" /> REVIEW
                </span>
              )}
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-extrabold font-sans text-[#0E1B2A] tabular-nums">
                {sec.pct}%
              </div>
              <div className="text-xs font-sans text-[#64748B] tabular-nums font-semibold">
                {sec.correct} / {sec.total} Correct
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#E2E6EB] rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  sec.cleared ? 'bg-[#234E35]' : 'bg-[#782525]'
                }`}
                style={{ width: `${Math.min(Math.max(sec.pct, 0), 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionPerformance;
