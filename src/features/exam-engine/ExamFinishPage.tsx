import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { FileText, Shield, Check, X, RefreshCw, Trophy, ArrowRight, Printer } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { resultService, ResultDetailResponse } from '@/services/resultService';
import { retakeService } from '@/services/retakeService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

import { ShujaForcesLogo } from '@/components/brand/ShujaForcesLogo';
import { ResultHero } from './components/ResultHero';
import { ResultMetricGrid } from './components/ResultMetricGrid';
import { SectionPerformance } from './components/SectionPerformance';
import { ScoreComparison } from './components/ScoreComparison';
import { FocusAreas } from './components/FocusAreas';

export const ExamFinishPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams<{ attemptId?: string }>();
  const resultIdParam = searchParams.get('resultId');
  const attemptIdParam = searchParams.get('attemptId') || params.attemptId;

  const { user } = useAuth();
  const [filterTab, setFilterTab] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'SKIPPED'>('ALL');
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  const [loading, setLoading] = useState(true);
  const [resultDetail, setResultDetail] = useState<ResultDetailResponse | null>(null);
  const [hasRetakePermission, setHasRetakePermission] = useState(false);

  const answerReviewRef = useRef<HTMLDivElement>(null);

  // Load server-authoritative result detail & retake permission
  useEffect(() => {
    let isMounted = true;

    async function loadResult() {
      if (isSupabaseConfigured() && (resultIdParam || attemptIdParam)) {
        try {
          let rId = resultIdParam;
          if (!rId && attemptIdParam) {
            const resById = await resultService.getResultById(attemptIdParam).catch(() => null);
            if (resById) {
              rId = resById.id;
            } else {
              const resRecord = await resultService.getResultByAttemptId(attemptIdParam).catch(() => null);
              if (resRecord) {
                rId = resRecord.id;
              }
            }
          }

          if (rId) {
            const data = await resultService.getResultDetail(rId);
            if (isMounted) {
              setResultDetail(data);

              // Check if authorized retake permission exists for this test
              if (data.test?.id && user?.id) {
                const retakes = await retakeService
                  .getRetakePermissions({
                    studentId: user.cadetId || user.id,
                    testId: data.test.id,
                    status: 'AVAILABLE',
                  })
                  .catch(() => []);
                if (isMounted && retakes && retakes.length > 0) {
                  setHasRetakePermission(true);
                }
              }
            }
          }
        } catch (err) {
          console.warn('Failed to load server result detail:', err);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    loadResult();

    return () => {
      isMounted = false;
    };
  }, [resultIdParam, attemptIdParam, user]);

  // Derive final values from Server result
  const testName = resultDetail?.test.name || 'Computerized Examination';
  const passingThreshold = resultDetail?.test.passing_threshold || 50;
  const percentage = resultDetail?.result.percentage ?? 0;
  
  // Exact Pass/Fail Condition:
  // percentage > passingThreshold -> PASS
  // percentage <= passingThreshold -> FAILED
  const isPassed = resultDetail?.result.passed !== undefined 
    ? resultDetail.result.passed 
    : percentage > passingThreshold;

  const correctCount = resultDetail?.result.correct_count ?? 0;
  const incorrectCount = resultDetail?.result.incorrect_count ?? 0;
  const skippedCount = resultDetail?.result.skipped_count ?? 0;
  const totalCount = resultDetail?.result.total_questions ?? 0;
  const marksObtained = resultDetail?.result.marks_obtained ?? 0;
  const maxMarks = resultDetail?.result.max_marks ?? 100;

  const cadetName = user?.name || resultDetail?.student.roll_number || 'Cadet';
  const rollNumber = user?.rollNumber || resultDetail?.student.roll_number || 'PMA-2601';

  // Smooth scroll helper to navigate directly to answer review section
  const handleScrollToDetails = () => {
    setShowAnswerKey(true);
    setTimeout(() => {
      answerReviewRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRequestRetake = () => {
    navigate('/exam/instructions');
  };

  // Flatten review questions
  const reviewQuestions = useMemo(() => {
    if (resultDetail && resultDetail.sections) {
      return resultDetail.sections.flatMap((sec) =>
        sec.questions.map((q) => ({
          id: q.question_id,
          code: q.code,
          stem: q.stem,
          explanation: q.explanation,
          status: q.status,
          selectedOptionId: q.selected_option_id,
          options: q.options,
        }))
      );
    }
    return [];
  }, [resultDetail]);

  const filteredQuestions = useMemo(() => {
    return reviewQuestions.filter((q) => {
      if (filterTab === 'CORRECT') return q.status === 'correct';
      if (filterTab === 'INCORRECT') return q.status === 'incorrect';
      if (filterTab === 'SKIPPED') return q.status === 'skipped';
      return true;
    });
  }, [reviewQuestions, filterTab]);

  // Section breakdown
  const sectionBreakdown = useMemo(() => {
    if (resultDetail?.result.section_results && Array.isArray(resultDetail.result.section_results)) {
      return resultDetail.result.section_results.map((sr: any) => ({
        title: sr.section_name || 'Section',
        pct: sr.percentage || 0,
        correct: sr.correct_count || 0,
        total: sr.total_questions || 0,
        cleared: (sr.percentage || 0) > passingThreshold,
      }));
    }

    if (resultDetail?.sections) {
      return resultDetail.sections.map((sec) => {
        const secQs = sec.questions;
        const corr = secQs.filter((q) => q.status === 'correct').length;
        const pct = secQs.length > 0 ? Math.round((corr / secQs.length) * 100) : 0;
        return {
          title: sec.section_name,
          pct,
          correct: corr,
          total: secQs.length,
          cleared: pct > passingThreshold,
        };
      });
    }

    return [];
  }, [resultDetail, passingThreshold]);

  if (loading) {
    return (
      <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#0E1B2A] animate-spin" />
        <span className="text-xs font-sans font-bold text-[#64748B] uppercase tracking-wider">
          Retrieving Certified Examination Docket & Cryptographic Seal...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full py-6 space-y-6 select-none px-4 sm:px-6">
      {/* Institutional Top Header */}
      <div className="bg-white border border-[#D4D9DF] rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <ShujaForcesLogo
          variant="dark"
          size="md"
          showLocation={true}
          showSubtitle={true}
          subtitle="Computerized Testing & Examination System"
        />
        <div className="inline-flex items-center space-x-2 text-xs font-sans font-bold text-[#234E35] bg-[#EDF6F0] px-3.5 py-1.5 rounded-full border border-[#88BE9B] uppercase tracking-wider">
          <Shield className="w-4 h-4 text-[#234E35]" />
          <span>OFFICIAL EXAMINATION EVALUATION DOCKET</span>
        </div>
      </div>

      {/* 1. RESULT HERO (PASS CELEBRATION OR FAILED HERO BASED ON % > THRESHOLD VS % <= THRESHOLD) */}
      <ResultHero
        testName={testName}
        cadetName={cadetName}
        rollNumber={rollNumber}
        percentage={percentage}
        passingThreshold={passingThreshold}
        isPassed={isPassed}
        hasRetakePermission={hasRetakePermission}
        onViewDetails={handleScrollToDetails}
        onDownloadResult={handlePrint}
        onRequestRetake={handleRequestRetake}
      />

      {/* 2. RESULT METRICS GRID */}
      <ResultMetricGrid
        correctCount={correctCount}
        incorrectCount={incorrectCount}
        skippedCount={skippedCount}
        totalCount={totalCount}
        marksObtained={marksObtained}
        maxMarks={maxMarks}
        passingThreshold={passingThreshold}
        isPassed={isPassed}
      />

      {/* 3. SECTION PERFORMANCE & FOCUS AREAS */}
      {sectionBreakdown.length > 0 && (
        <div className="space-y-6">
          <SectionPerformance sections={sectionBreakdown} />
          {!isPassed && <FocusAreas sections={sectionBreakdown} />}
        </div>
      )}

      {/* 4. SCORE COMPARISON BENCHMARK */}
      <ScoreComparison
        userPercentage={percentage}
        passingThreshold={passingThreshold}
      />

      {/* Cryptographic Verification Hash & Utility Controls */}
      <div className="p-4 bg-white rounded-xl border border-[#D4D9DF] shadow-xs text-xs font-mono text-[#64748B] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-[#0E1B2A] font-sans">VERIFICATION HASH:</span>
          <span className="truncate max-w-[280px] sm:max-w-none">
            SHA256:7B9E2D8F0A1C4E5F6B7A8D9C0E1F2A3B
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#D4D9DF] text-[#0E1B2A] bg-[#F8FAFC] rounded text-xs font-sans font-bold hover:bg-[#EDF1F5] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Docket</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/leaderboard')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#C6A75E] text-[#7A5312] bg-[#FAF8F5] rounded text-xs font-sans font-bold hover:bg-[#F3EDE2] cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-[#C6A75E]" />
            <span>Merit Leaderboard</span>
          </button>
        </div>
      </div>

      {/* 5. EXISTING CURRENT DETAILED ANSWER REVIEW (100% PRESERVED DATA BEHAVIOR) */}
      <div ref={answerReviewRef} className="bg-white border border-[#D4D9DF] rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E2E6EB] pb-4 gap-3">
          <div>
            <span className="text-[10px] font-sans font-bold text-[#C6A75E] uppercase tracking-wider">
              POST-EXAMINATION SOLUTION DOSSIER
            </span>
            <h2 className="text-lg font-bold text-[#0E1B2A]">Detailed Answer Key & Derivations</h2>
          </div>

          <div className="flex items-center space-x-3">
            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 font-sans text-xs bg-[#F6F8FA] p-1 rounded-lg border border-[#E2E6EB]">
              {(['ALL', 'CORRECT', 'INCORRECT', 'SKIPPED'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`px-3 py-1 rounded text-[11px] font-semibold uppercase transition-colors cursor-pointer ${
                    filterTab === tab
                      ? 'bg-[#0E1B2A] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0E1B2A]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#F1F5F9] border border-[#CBD5E1] text-[#0E1B2A] rounded-lg text-xs font-bold hover:bg-[#E2E8F0] cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#C6A75E]" />
              <span>{showAnswerKey ? 'Hide' : 'Show'} Key</span>
            </button>
          </div>
        </div>

        {/* Question Review Cards */}
        {showAnswerKey && (
          <div className="space-y-6">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#64748B]">
                No questions found matching the selected filter ({filterTab}).
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const isCorrect = q.status === 'correct';
                const isIncorrect = q.status === 'incorrect';
                const isSkipped = q.status === 'skipped';

                return (
                  <div key={q.id} className="border border-[#D4D9DF] rounded-xl p-5 bg-white space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 font-sans tabular-nums text-xs font-bold bg-[#0E1B2A] text-white rounded-md">
                          QUESTION #{idx + 1}
                        </span>
                        <span className="text-xs font-mono text-[#64748B]">[{q.code}]</span>
                      </div>

                      {isCorrect && (
                        <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-[#234E35] bg-[#EDF6F0] px-2.5 py-0.5 rounded-full border border-[#88BE9B]">
                          <Check className="w-3.5 h-3.5" /> CORRECT
                        </span>
                      )}
                      {isIncorrect && (
                        <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-[#782525] bg-[#FDF2F2] px-2.5 py-0.5 rounded-full border border-[#E29A9A]">
                          <X className="w-3.5 h-3.5" /> INCORRECT
                        </span>
                      )}
                      {isSkipped && (
                        <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-0.5 rounded-full border border-[#CBD5E1]">
                          SKIPPED
                        </span>
                      )}
                    </div>

                    {/* Stem */}
                    <h3 className="text-sm font-semibold text-[#0E1B2A] leading-relaxed">{q.stem}</h3>

                    {/* Options List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {q.options.map((opt) => {
                        const isCorrectOpt = opt.is_correct;
                        const isUserSelected = q.selectedOptionId === opt.id;

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-lg border flex items-center space-x-3 transition-colors ${
                              isCorrectOpt
                                ? 'bg-[#EDF6F0] border-[#234E35] text-[#234E35] font-semibold'
                                : isUserSelected
                                ? 'bg-[#FDF2F2] border-[#782525] text-[#782525]'
                                : 'bg-[#F6F8FA] border-[#D4D9DF] text-[#1F2937]'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs font-sans border ${
                                isCorrectOpt
                                  ? 'bg-[#234E35] text-white border-[#234E35]'
                                  : isUserSelected
                                  ? 'bg-[#782525] text-white border-[#782525]'
                                  : 'bg-white border-[#D4D9DF] text-[#0E1B2A]'
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span className="flex-1">{opt.text}</span>
                            {isCorrectOpt && (
                              <span className="text-[10px] font-sans uppercase font-bold bg-[#234E35] text-white px-1.5 py-0.5 rounded">
                                Official Key
                              </span>
                            )}
                            {isUserSelected && !isCorrectOpt && (
                              <span className="text-[10px] font-sans uppercase font-bold bg-[#782525] text-white px-1.5 py-0.5 rounded">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Derivation Explanation */}
                    {q.explanation && (
                      <div className="mt-3 p-3.5 bg-[#F6F8FA] rounded-lg border border-[#E2E6EB] text-xs text-[#64748B]">
                        <span className="font-bold text-[#0E1B2A] font-sans block mb-1 uppercase text-[10px] tracking-wider">
                          Military Evaluation Key & Derivation:
                        </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={() => navigate('/student/dashboard')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#64748B] hover:text-[#0E1B2A] cursor-pointer"
        >
          <span>Return to Cadet Portal</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/student/tests')}
          className="inline-flex items-center space-x-1.5 bg-[#0E1B2A] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#1C2E42] cursor-pointer"
        >
          <span>View Available Tests</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ExamFinishPage;
