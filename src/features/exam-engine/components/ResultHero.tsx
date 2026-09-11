import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, LayoutDashboard, ShieldCheck, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

// Lazy-load 3D WebGL components to keep page loading lightweight
const PassCelebration3D = lazy(() => import('./PassCelebration3D'));
const ProgressCompass3D = lazy(() => import('./ProgressCompass3D'));

interface ResultHeroProps {
  testName: string;
  cadetName: string;
  rollNumber: string;
  percentage: number;
  passingThreshold: number;
  isPassed: boolean;
  hasRetakePermission?: boolean;
  onViewDetails: () => void;
  onDownloadResult: () => void;
  onRequestRetake?: () => void;
}

export const ResultHero: React.FC<ResultHeroProps> = ({
  testName,
  cadetName,
  rollNumber,
  percentage,
  passingThreshold = 50,
  isPassed,
  hasRetakePermission = false,
  onViewDetails,
  onDownloadResult,
  onRequestRetake,
}) => {
  const navigate = useNavigate();

  const scoreGap = passingThreshold - percentage;

  return (
    <div className="w-full bg-[#0E1B2A] text-white rounded-xl border border-[#1C2E42] shadow-xl overflow-hidden relative">
      {/* Subtle Military Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#C6A75E_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {isPassed ? (
        // ====================================================================
        // 1. PASS CELEBRATION HERO (percentage > passingThreshold)
        // ====================================================================
        <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left / Center Content Column */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            {/* Institution Badge */}
            <div className="inline-flex items-center space-x-2 bg-[#234E35]/40 border border-[#2E6A47] text-[#88BE9B] px-3.5 py-1.5 rounded-full text-xs font-sans font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#88BE9B]" />
              <span>OFFICIAL ACADEMY MERIT EVALUATION</span>
            </div>

            {/* Main Headlines */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight leading-none font-sans">
                Congratulations!
              </h1>
              <div className="text-2xl sm:text-3xl lg:text-[36px] font-bold text-[#C6A75E] mt-1 font-sans">
                You Passed
              </div>
              <p className="text-sm sm:text-base text-[#94A3B8] font-sans mt-3 max-w-xl leading-relaxed">
                Your hard work, discipline and determination have paid off.
              </p>
            </div>

            {/* Cadet Metadata Banner */}
            <div className="inline-block bg-[#162536] border border-[#24374E] rounded-lg px-4 py-2 text-xs text-[#CBD5E1] font-sans">
              TEST: <span className="font-bold text-white uppercase">{testName}</span> &bull; CADET:{' '}
              <span className="font-bold text-white">{cadetName}</span> (
              <span className="font-mono text-[#C6A75E]">{rollNumber}</span>)
            </div>

            {/* Score Block */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <div className="bg-[#162536] border border-[#234E35] rounded-xl px-6 py-4 text-center lg:text-left shadow-inner">
                <span className="text-[11px] font-sans uppercase text-[#94A3B8] font-bold tracking-wider block">
                  YOUR FINAL SCORE
                </span>
                <div className="text-5xl sm:text-6xl font-extrabold font-sans text-white tabular-nums tracking-tight mt-1">
                  {percentage}%
                </div>
                <div className="text-xs font-sans font-bold text-[#88BE9B] mt-1 flex items-center justify-center lg:justify-start gap-1">
                  <span>&uarr;</span> Above passing percentage ({passingThreshold}%)
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={onViewDetails}
                className="inline-flex items-center space-x-2 bg-[#234E35] hover:bg-[#1E432E] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#88BE9B]" />
                <span>View Detailed Results</span>
              </button>

              <button
                type="button"
                onClick={onDownloadResult}
                className="inline-flex items-center space-x-2 bg-[#162536] hover:bg-[#1F334A] text-white border border-[#2E4560] px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#C6A75E]" />
                <span>Download Result</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/student/dashboard')}
                className="inline-flex items-center space-x-2 bg-[#162536] hover:bg-[#1F334A] text-[#94A3B8] hover:text-white border border-[#24374E] px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </motion.div>

          {/* Right 3D Trophy Column */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <Suspense
              fallback={
                <div className="h-[260px] w-full flex items-center justify-center text-xs text-[#94A3B8] font-sans">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#C6A75E]" />
                  Loading 3D Visual...
                </div>
              }
            >
              <PassCelebration3D />
            </Suspense>
          </div>
        </div>
      ) : (
        // ====================================================================
        // 2. FAILED / NON-PASS HERO (percentage <= passingThreshold)
        // ====================================================================
        <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left / Center Content Column (65% width on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-8 space-y-6 text-center sm:text-left"
          >
            {/* Evaluation Status Badge */}
            <div className="inline-flex items-center space-x-2 bg-[#2D1B1B] border border-[#602E2E] text-[#E29A9A] px-3.5 py-1.5 rounded-full text-xs font-sans font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-[#E29A9A]" />
              <span>OFFICIAL EVALUATION DOCKET COMPLETED</span>
            </div>

            {/* Main Headlines */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none font-sans">
                Result Complete
              </h1>
              <div className="text-2xl sm:text-3xl font-bold text-[#E29A9A] mt-2 font-sans">
                You Did Not Meet the Passing Score
              </div>
              <p className="text-sm sm:text-base text-[#94A3B8] font-sans mt-3 max-w-xl leading-relaxed">
                Review your performance, identify the sections that need attention, and prepare for your next attempt.
              </p>
            </div>

            {/* Cadet Metadata Banner */}
            <div className="inline-block bg-[#162536] border border-[#24374E] rounded-lg px-4 py-2 text-xs text-[#CBD5E1] font-sans">
              TEST: <span className="font-bold text-white uppercase">{testName}</span> &bull; CADET:{' '}
              <span className="font-bold text-white">{cadetName}</span> (
              <span className="font-mono text-[#C6A75E]">{rollNumber}</span>)
            </div>

            {/* Prominent Score Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg pt-1">
              <div className="bg-[#162536] border border-[#4A2424] rounded-xl p-4 text-center sm:text-left shadow-inner">
                <span className="text-[10px] font-sans uppercase text-[#94A3B8] font-bold tracking-wider block">
                  YOUR SCORE
                </span>
                <div className="text-5xl font-extrabold font-sans text-white tabular-nums tracking-tight mt-1">
                  {percentage}%
                </div>
              </div>

              <div className="bg-[#162536] border border-[#24374E] rounded-xl p-4 text-center sm:text-left shadow-inner flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-sans uppercase text-[#94A3B8] font-bold tracking-wider block">
                    PASSING SCORE
                  </span>
                  <div className="text-3xl font-bold font-sans text-[#C6A75E] tabular-nums mt-1">
                    {passingThreshold}%
                  </div>
                </div>
                <div className="text-xs font-sans font-semibold text-[#E29A9A] mt-2 border-t border-[#24374E] pt-1.5">
                  {scoreGap > 0 ? `${scoreGap}% below passing score` : 'At required threshold'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={onViewDetails}
                className="inline-flex items-center space-x-2 bg-[#162536] hover:bg-[#1F334A] text-white border border-[#2E4560] px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#C6A75E]" />
                <span>Review Detailed Answers</span>
              </button>

              <button
                type="button"
                onClick={onDownloadResult}
                className="inline-flex items-center space-x-2 bg-[#162536] hover:bg-[#1F334A] text-white border border-[#2E4560] px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#C6A75E]" />
                <span>Download Docket</span>
              </button>

              {hasRetakePermission && onRequestRetake && (
                <button
                  type="button"
                  onClick={onRequestRetake}
                  className="inline-flex items-center space-x-2 bg-[#7A5312] hover:bg-[#60410E] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Start Authorized Retake</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/student/dashboard')}
                className="inline-flex items-center space-x-2 bg-[#162536] hover:bg-[#1F334A] text-[#94A3B8] hover:text-white border border-[#24374E] px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </motion.div>

          {/* Right 3D Visual Column (35% width on desktop) */}
          <div className="lg:col-span-4 flex items-center justify-center relative">
            <Suspense
              fallback={
                <div className="h-[260px] w-full flex items-center justify-center text-xs text-[#94A3B8] font-sans">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#C6A75E]" />
                  Loading 3D Visual...
                </div>
              }
            >
              <ProgressCompass3D />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultHero;
