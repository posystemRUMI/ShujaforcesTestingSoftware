import React from 'react';
import { BarChart3 } from 'lucide-react';

interface ScoreComparisonProps {
  userPercentage: number;
  passingThreshold: number;
  academyAverage?: number | null;
}

export const ScoreComparison: React.FC<ScoreComparisonProps> = ({
  userPercentage,
  passingThreshold = 50,
  academyAverage,
}) => {
  return (
    <div className="bg-white border border-[#D4D9DF] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center space-x-2 border-b border-[#E2E6EB] pb-3">
        <BarChart3 className="w-5 h-5 text-[#0E1B2A]" />
        <h2 className="text-base font-bold text-[#0E1B2A] font-sans">Score & Threshold Benchmark</h2>
      </div>

      <div className="space-y-4 pt-1">
        {/* 1. Candidate Score */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-sans font-bold text-[#0E1B2A]">
            <span>Your Score</span>
            <span className="tabular-nums font-mono text-sm">{userPercentage}%</span>
          </div>
          <div className="w-full bg-[#E2E6EB] rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                userPercentage >= passingThreshold ? 'bg-[#234E35]' : 'bg-[#782525]'
              }`}
              style={{ width: `${Math.min(Math.max(userPercentage, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* 2. Passing Threshold */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-sans font-bold text-[#64748B]">
            <span>Required Passing Threshold</span>
            <span className="tabular-nums font-mono text-xs">{passingThreshold}%</span>
          </div>
          <div className="w-full bg-[#E2E6EB] rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#C6A75E] transition-all duration-700"
              style={{ width: `${Math.min(Math.max(passingThreshold, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* 3. Academy Average (Only rendered if actual backend comparison value exists) */}
        {academyAverage !== undefined && academyAverage !== null && (
          <div className="space-y-1.5 pt-1 border-t border-[#F1F5F9]">
            <div className="flex justify-between text-xs font-sans font-bold text-[#64748B]">
              <span>Academy Average Cohort Standing</span>
              <span className="tabular-nums font-mono text-xs">{academyAverage}%</span>
            </div>
            <div className="w-full bg-[#E2E6EB] rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0E1B2A] transition-all duration-700 opacity-80"
                style={{ width: `${Math.min(Math.max(academyAverage, 0), 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreComparison;
