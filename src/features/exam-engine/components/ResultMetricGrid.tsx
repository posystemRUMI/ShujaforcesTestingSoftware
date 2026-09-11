import React from 'react';
import { CheckCircle2, XCircle, HelpCircle, Award, Target, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ResultMetricGridProps {
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  totalCount: number;
  marksObtained: number;
  maxMarks: number;
  passingThreshold: number;
  isPassed: boolean;
}

export const ResultMetricGrid: React.FC<ResultMetricGridProps> = ({
  correctCount,
  incorrectCount,
  skippedCount,
  totalCount,
  marksObtained,
  maxMarks,
  passingThreshold = 50,
  isPassed,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 w-full">
      {/* 1. Correct Answers */}
      <div className="bg-white border border-[#D4D9DF] rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2 hover:border-[#88BE9B] transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider">
            Correct Answers
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#EDF6F0] flex items-center justify-center text-[#234E35]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-extrabold font-sans text-[#234E35] tabular-nums">
            {correctCount} <span className="text-xs text-[#64748B] font-medium">/ {totalCount}</span>
          </div>
          <span className="text-[11px] font-sans text-[#64748B] font-medium block mt-0.5">
            {totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0}% Accuracy
          </span>
        </div>
      </div>

      {/* 2. Wrong Answers */}
      <div className="bg-white border border-[#D4D9DF] rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2 hover:border-[#E29A9A] transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider">
            Wrong Answers
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#FDF2F2] flex items-center justify-center text-[#782525]">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-extrabold font-sans text-[#782525] tabular-nums">
            {incorrectCount} <span className="text-xs text-[#64748B] font-medium">/ {totalCount}</span>
          </div>
          <span className="text-[11px] font-sans text-[#64748B] font-medium block mt-0.5">
            {totalCount > 0 ? Math.round((incorrectCount / totalCount) * 100) : 0}% Incorrect
          </span>
        </div>
      </div>

      {/* 3. Skipped Questions */}
      <div className="bg-white border border-[#D4D9DF] rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2 hover:border-[#CBD5E1] transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider">
            Skipped Questions
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
            <HelpCircle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-extrabold font-sans text-[#0E1B2A] tabular-nums">
            {skippedCount} <span className="text-xs text-[#64748B] font-medium">/ {totalCount}</span>
          </div>
          <span className="text-[11px] font-sans text-[#64748B] font-medium block mt-0.5">
            Unanswered
          </span>
        </div>
      </div>

      {/* 4. Passing Percentage */}
      <div className="bg-white border border-[#D4D9DF] rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2 hover:border-[#C6A75E] transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider">
            Passing Threshold
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#7A5312]">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-extrabold font-sans text-[#7A5312] tabular-nums">
            {passingThreshold}%
          </div>
          <span className="text-[11px] font-sans text-[#64748B] font-medium block mt-0.5">
            Required Criteria
          </span>
        </div>
      </div>

      {/* 5. Total Marks */}
      <div className="bg-white border border-[#D4D9DF] rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2 hover:border-[#0E1B2A] transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider">
            Total Marks
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#EDF1F5] flex items-center justify-center text-[#0E1B2A]">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-extrabold font-sans text-[#0E1B2A] tabular-nums">
            {marksObtained} <span className="text-xs text-[#64748B] font-medium">/ {maxMarks}</span>
          </div>
          <span className="text-[11px] font-sans text-[#64748B] font-medium block mt-0.5">
            Score Earned
          </span>
        </div>
      </div>

      {/* 6. Result Status */}
      <div
        className={`border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2 transition-colors ${
          isPassed
            ? 'bg-[#EDF6F0] border-[#88BE9B] text-[#234E35]'
            : 'bg-[#FDF2F2] border-[#E29A9A] text-[#782525]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider opacity-90">
            Result Status
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isPassed ? 'bg-[#234E35] text-white' : 'bg-[#782525] text-white'
            }`}
          >
            {isPassed ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
        </div>
        <div>
          <div className="text-xl font-extrabold font-sans uppercase tracking-wider">
            {isPassed ? 'PASSED' : 'NOT PASSED'}
          </div>
          <span className="text-[11px] font-sans font-bold block mt-0.5 opacity-90">
            {isPassed ? 'Qualified for Merit' : 'Below Passing Score'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResultMetricGrid;
