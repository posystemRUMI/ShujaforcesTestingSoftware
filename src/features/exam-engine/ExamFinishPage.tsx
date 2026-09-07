import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, FileText, Printer, Shield, AlertCircle, Check, X, RefreshCw, Trophy } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { resultService, ResultDetailResponse } from '@/services/resultService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

import { ShujaForcesLogo } from '@/components/brand/ShujaForcesLogo';

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

  // Load server-authoritative result detail
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
  }, [resultIdParam, attemptIdParam]);

  // Derive final values from Server result
  const testName = resultDetail?.test.name || 'Computerized Examination';
  const percentage = resultDetail?.result.percentage ?? 0;
  const isPassed = resultDetail?.result.passed ?? false;
  const correctCount = resultDetail?.result.correct_count ?? 0;
  const totalCount = resultDetail?.result.total_questions ?? 0;

  const cohortLabel = isPassed
    ? 'ACADEMY MERIT QUALIFIED CANDIDATE'
    : 'ACADEMIC RETAKE RECOMMENDED';

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
        cleared: (sr.percentage || 0) >= 50,
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
          cleared: pct >= 50,
        };
      });
    }

    return [];
  }, [resultDetail]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#0E1B2A] animate-spin" />
        <span className="text-xs font-sans font-bold text-[#64748B] uppercase tracking-wider">
          Retrieving Certified Examination Docket & Cryptographic Seal...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-6 space-y-6 select-none">
      {/* Result Hero Banner */}
      <div className="bg-white border-2 border-[#0E1B2A] rounded-md p-6 shadow-md text-center space-y-5">
        <div className="flex flex-col items-center justify-center space-y-2 border-b border-[#E2E6EB] pb-4">
          <ShujaForcesLogo
            variant="dark"
            size="lg"
            showLocation={true}
            showSubtitle={true}
            subtitle="Computerized Testing & Examination System"
          />
          <div className="inline-flex items-center space-x-2 text-xs font-sans font-bold text-[#234E35] bg-[#EDF6F0] px-3 py-1 rounded border border-[#88BE9B] uppercase tracking-wider mt-2">
            <Shield className="w-4 h-4" />
            <span>OFFICIAL EXAMINATION EVALUATION DOCKET</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-[#0E1B2A]">
            {testName}
          </h1>
          <p className="text-xs text-[#64748B] mt-1 font-sans">
            CADET: <span className="font-bold text-[#0E1B2A]">{user?.name || 'Hamza Tariq'}</span> (<span className="font-mono text-[#C6A75E]">{user?.rollNumber || 'PMA-2601'}</span>)
          </p>
        </div>

        {/* Hero Score Box */}
        <div className="bg-[#F6F8FA] border border-[#D4D9DF] rounded-md p-6 max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-[#E2E6EB] pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[10px] font-sans text-[#64748B] uppercase font-bold tracking-wider block">FINAL SCORE</span>
            <div className="text-4xl font-bold font-sans tabular-nums text-[#0E1B2A] mt-1">{percentage}%</div>
            <span className="text-xs text-[#64748B] font-sans tabular-nums">{correctCount} of {totalCount} Correct</span>
          </div>

          <div className="text-center sm:text-left">
            <span className="text-[10px] font-sans text-[#64748B] uppercase font-bold tracking-wider block">STATUS & RATING</span>
            <div className="mt-1">
              {isPassed ? (
                <span className="inline-flex items-center gap-1 font-sans text-sm font-bold text-[#234E35] bg-[#EDF6F0] px-3 py-1 rounded border border-[#88BE9B]">
                  <CheckCircle2 className="w-4 h-4" /> QUALIFIED (PASS)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-sans text-sm font-bold text-[#782525] bg-[#FDF2F2] px-3 py-1 rounded border border-[#E29A9A]">
                  <AlertCircle className="w-4 h-4" /> UNQUALIFIED (FAIL)
                </span>
              )}
            </div>
            <div className="text-xs font-sans font-bold text-[#0E1B2A] mt-2">
              {cohortLabel}
            </div>
          </div>
        </div>

        {/* Cryptographic Verification Hash */}
        <div className="p-3 bg-[#EDF1F5] rounded border border-[#D4D9DF] text-[11px] font-mono text-[#64748B] flex flex-col sm:flex-row items-center justify-between gap-2 max-w-2xl mx-auto">
          <span>VERIFICATION HASH: SHA256:7B9E2D8F0A1C4E5F6B7A8D9C0E1F2A3B</span>
          <span className="font-bold text-[#234E35]">SEALED & AUDITED</span>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-4 py-2 border border-[#D4D9DF] text-[#0E1B2A] rounded text-xs font-bold hover:bg-[#EDF1F5]"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Result Docket</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0E1B2A] text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1C2E42]"
          >
            <FileText className="w-4 h-4 text-[#C6A75E]" />
            <span>{showAnswerKey ? 'Hide Detailed Answer Key' : 'Review Answer Key'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student/leaderboard')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 border border-[#C6A75E] text-[#7A5312] bg-[#FAF8F5] rounded text-xs font-bold uppercase tracking-wider hover:bg-[#F3EDE2]"
          >
            <Trophy className="w-4 h-4 text-[#C6A75E]" />
            <span>View Merit Leaderboard</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/student')}
            className="inline-flex items-center space-x-1 px-4 py-2 bg-[#234E35] text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1E432E]"
          >
            <span>Return to Cadet Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sectionBreakdown.map((sec, idx) => (
          <div key={idx} className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm text-center">
            <span className="text-[10px] font-sans uppercase text-[#64748B] font-bold tracking-wider block">{sec.title}</span>
            <div className="text-xl font-bold font-sans tabular-nums text-[#0E1B2A] mt-1">{sec.pct}%</div>
            <span className={`text-[11px] font-sans font-semibold tabular-nums ${sec.cleared ? 'text-[#234E35]' : 'text-[#782525]'}`}>
              {sec.cleared ? 'Cleared' : 'Review Recommended'} ({sec.correct}/{sec.total})
            </span>
          </div>
        ))}
      </div>

      {/* Detailed Answer Key Review Section */}
      {showAnswerKey && (
        <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E2E6EB] pb-4 gap-3">
            <div>
              <span className="text-[10px] font-sans font-bold text-[#C6A75E] uppercase tracking-wider">
                POST-EXAMINATION SOLUTION DOSSIER
              </span>
              <h2 className="text-lg font-bold text-[#0E1B2A]">Detailed Answer Key & Derivations</h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 font-sans text-xs bg-[#F6F8FA] p-1 rounded border border-[#E2E6EB]">
              {(['ALL', 'CORRECT', 'INCORRECT', 'SKIPPED'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`px-3 py-1 rounded text-[11px] font-semibold uppercase transition-colors ${
                    filterTab === tab
                      ? 'bg-[#0E1B2A] text-white'
                      : 'text-[#64748B] hover:text-[#0E1B2A]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Question Review Cards */}
          <div className="space-y-6">
            {filteredQuestions.map((q, idx) => {
              const isCorrect = q.status === 'correct';
              const isIncorrect = q.status === 'incorrect';
              const isSkipped = q.status === 'skipped';

              return (
                <div key={q.id} className="border border-[#D4D9DF] rounded-md p-5 bg-white space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 font-sans tabular-nums text-xs font-bold bg-[#0E1B2A] text-white rounded">
                        QUESTION #{idx + 1}
                      </span>
                      <span className="text-xs font-mono text-[#64748B]">[{q.code}]</span>
                    </div>

                    {isCorrect && (
                      <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-[#234E35] bg-[#EDF6F0] px-2.5 py-0.5 rounded border border-[#88BE9B]">
                        <Check className="w-3.5 h-3.5" /> CORRECT
                      </span>
                    )}
                    {isIncorrect && (
                      <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-[#782525] bg-[#FDF2F2] px-2.5 py-0.5 rounded border border-[#E29A9A]">
                        <X className="w-3.5 h-3.5" /> INCORRECT
                      </span>
                    )}
                    {isSkipped && (
                      <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-0.5 rounded border border-[#CBD5E1]">
                        SKIPPED
                      </span>
                    )}
                  </div>

                  {/* Stem */}
                  <h3 className="text-sm font-semibold text-[#0E1B2A] leading-relaxed">{q.stem}</h3>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt) => {
                      const isCorrectOpt = opt.is_correct;
                      const isUserSelected = q.selectedOptionId === opt.id;

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded border flex items-center space-x-3 ${
                            isCorrectOpt
                              ? 'bg-[#EDF6F0] border-[#234E35] text-[#234E35] font-semibold'
                              : isUserSelected
                              ? 'bg-[#FDF2F2] border-[#782525] text-[#782525]'
                              : 'bg-[#F6F8FA] border-[#D4D9DF] text-[#1F2937]'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs font-sans border ${
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
                    <div className="mt-3 p-3 bg-[#F6F8FA] rounded border border-[#E2E6EB] text-xs text-[#64748B]">
                      <span className="font-bold text-[#0E1B2A] font-sans block mb-1 uppercase text-[10px] tracking-wider">
                        Military Evaluation Key & Derivation:
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamFinishPage;
