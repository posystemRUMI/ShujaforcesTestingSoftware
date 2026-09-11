import React from 'react';
import { Target, AlertCircle, ArrowUpRight } from 'lucide-react';
import { SectionBreakdownItem } from './SectionPerformance';

interface FocusAreasProps {
  sections: SectionBreakdownItem[];
}

export const FocusAreas: React.FC<FocusAreasProps> = ({ sections }) => {
  if (!sections || sections.length === 0) return null;

  // Sort sections by percentage ascending to highlight weakest areas first
  const sortedSections = [...sections].sort((a, b) => a.pct - b.pct);
  const weakSections = sortedSections.filter((sec) => sec.pct < 60);

  return (
    <div className="bg-white border border-[#D4D9DF] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-3">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-[#7A5312]" />
          <h2 className="text-base font-bold text-[#0E1B2A] font-sans">
            Priority Preparation & Focus Areas
          </h2>
        </div>
        <span className="text-xs text-[#7A5312] bg-[#FAF8F5] px-2.5 py-1 rounded-full font-sans font-bold border border-[#DEC088]">
          {weakSections.length} {weakSections.length === 1 ? 'Section' : 'Sections'} Need Attention
        </span>
      </div>

      <div className="space-y-3">
        {sortedSections.map((sec, idx) => {
          const isNeedsWork = sec.pct < 60;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isNeedsWork
                  ? 'bg-[#FDF7EC] border-[#DEC088] text-[#0E1B2A]'
                  : 'bg-[#F8FAFC] border-[#E2E6EB] text-[#64748B]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs font-sans ${
                    isNeedsWork
                      ? 'bg-[#7A5312] text-white'
                      : 'bg-[#0E1B2A] text-white'
                  }`}
                >
                  #{idx + 1}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0E1B2A] font-sans flex items-center gap-2">
                    <span>{sec.title}</span>
                    {isNeedsWork && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-[#7A5312] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#DEC088]">
                        <AlertCircle className="w-3 h-3" /> Recommended Focus
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#64748B] font-sans tabular-nums mt-0.5">
                    {sec.correct} of {sec.total} questions answered correctly ({sec.pct}%)
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 sm:w-48">
                <div className="flex-1 bg-[#E2E6EB] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isNeedsWork ? 'bg-[#7A5312]' : 'bg-[#234E35]'
                    }`}
                    style={{ width: `${Math.min(Math.max(sec.pct, 0), 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-[#0E1B2A] w-10 text-right">
                  {sec.pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FocusAreas;
