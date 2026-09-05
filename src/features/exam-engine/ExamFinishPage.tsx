import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, FileText, Printer, Shield, AlertCircle, Check, X } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { mockQuestions } from '@/lib/mock-data';

export const ExamFinishPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterTab, setFilterTab] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'SKIPPED'>('ALL');
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  // Load real submitted attempt from localStorage or fallback if direct navigate
  const submittedAttempt = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('FA_SUBMITTED_EXAM_ATTEMPT_V1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      /* ignore */
    }
    return null;
  }, []);

  const actualAnswers: Record<string, { selectedOptionId: string; isCorrect: boolean }> = React.useMemo(() => {
    const result: Record<string, { selectedOptionId: string; isCorrect: boolean }> = {};
    const rawAnswers: Record<string, string> = submittedAttempt?.answers || {};

    mockQuestions.forEach((q) => {
      const selectedOptionId = rawAnswers[q.id];
      if (selectedOptionId) {
        result[q.id] = {
          selectedOptionId,
          isCorrect: selectedOptionId === q.correctOptionId,
        };
      }
    });

    return result;
  }, [submittedAttempt]);

  const correctCount = mockQuestions.filter((q) => actualAnswers[q.id]?.isCorrect).length;
  const totalCount = mockQuestions.length;
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const isPassed = percentage >= 60;

  // Derive Stanine cohort (1-9 scale)
  const stanine = percentage >= 96 ? 9 : percentage >= 90 ? 8 : percentage >= 78 ? 7 : percentage >= 60 ? 6 : percentage >= 41 ? 5 : percentage >= 23 ? 4 : percentage >= 11 ? 3 : percentage >= 4 ? 2 : 1;
  const cohortLabel = isPassed ? `STANINE ${stanine} (QUALIFIED CANDIDATE)` : `STANINE ${stanine} (ACADEMIC RETAKE RECOMMENDED)`;

  // Dynamic Subject Breakdown
  const verbalQs = mockQuestions.filter((q) => q.subject === 'INTELLIGENCE_VERBAL');
  const verbalCorrect = verbalQs.filter((q) => actualAnswers[q.id]?.isCorrect).length;
  const verbalPct = verbalQs.length > 0 ? Math.round((verbalCorrect / verbalQs.length) * 100) : 0;

  const nonVerbalQs = mockQuestions.filter((q) => q.subject === 'INTELLIGENCE_NON_VERBAL');
  const nonVerbalCorrect = nonVerbalQs.filter((q) => actualAnswers[q.id]?.isCorrect).length;
  const nonVerbalPct = nonVerbalQs.length > 0 ? Math.round((nonVerbalCorrect / nonVerbalQs.length) * 100) : 0;

  const mathQs = mockQuestions.filter((q) => q.subject.includes('MATH') || q.subject.includes('ACADEMIC'));
  const mathCorrect = mathQs.filter((q) => actualAnswers[q.id]?.isCorrect).length;
  const mathPct = mathQs.length > 0 ? Math.round((mathCorrect / mathQs.length) * 100) : 0;

  const filteredQuestions = mockQuestions.filter((q) => {
    const ans = actualAnswers[q.id];
    if (filterTab === 'CORRECT') return ans?.isCorrect === true;
    if (filterTab === 'INCORRECT') return ans && ans.isCorrect === false;
    if (filterTab === 'SKIPPED') return !ans;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6 space-y-6 select-none">
      {/* Result Hero Banner */}
      <div className="bg-white border-2 border-[#0E1B2A] rounded-md p-6 shadow-md text-center space-y-5">
        <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-[#234E35] bg-[#EDF6F0] px-3 py-1 rounded border border-[#88BE9B] uppercase">
          <Shield className="w-4 h-4" />
          <span>OFFICIAL EXAMINATION EVALUATION DOCKET</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-[#0E1B2A]">
            154 PMA Long Course Initial Test
          </h1>
          <p className="text-xs text-[#64748B] mt-1 font-mono">
            CADET: <span className="font-bold text-[#0E1B2A]">{user?.name || 'Hamza Tariq'}</span> ({user?.rollNumber || 'PMA-2601'})
          </p>
        </div>

        {/* Hero Score Box */}
        <div className="bg-[#F6F8FA] border border-[#D4D9DF] rounded-md p-6 max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-[#E2E6EB] pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold block">FINAL SCORE</span>
            <div className="text-4xl font-bold font-mono text-[#0E1B2A] mt-1">{percentage}%</div>
            <span className="text-xs text-[#64748B] font-mono">{correctCount} of {totalCount} Correct</span>
          </div>

          <div className="text-center sm:text-left">
            <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold block">STATUS & RATING</span>
            <div className="mt-1">
              {isPassed ? (
                <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-[#234E35] bg-[#EDF6F0] px-3 py-1 rounded border border-[#88BE9B]">
                  <CheckCircle2 className="w-4 h-4" /> QUALIFIED (PASS)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-[#782525] bg-[#FDF2F2] px-3 py-1 rounded border border-[#E29A9A]">
                  <AlertCircle className="w-4 h-4" /> UNQUALIFIED (FAIL)
                </span>
              )}
            </div>
            <div className="text-xs font-mono font-bold text-[#0E1B2A] mt-2">
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
        <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm text-center">
          <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold block">Verbal Intelligence</span>
          <div className="text-xl font-bold font-mono text-[#0E1B2A] mt-1">{verbalPct}%</div>
          <span className="text-[11px] text-[#234E35] font-semibold">Cleared ({verbalCorrect}/{verbalQs.length})</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm text-center">
          <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold block">Non-Verbal Intelligence</span>
          <div className="text-xl font-bold font-mono text-[#0E1B2A] mt-1">{nonVerbalPct}%</div>
          <span className="text-[11px] text-[#234E35] font-semibold">Cleared ({nonVerbalCorrect}/{nonVerbalQs.length})</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm text-center">
          <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold block">Academic Mathematics</span>
          <div className="text-xl font-bold font-mono text-[#0E1B2A] mt-1">{mathPct}%</div>
          <span className={`text-[11px] font-semibold ${mathPct >= 50 ? 'text-[#234E35]' : 'text-[#782525]'}`}>
            {mathPct >= 50 ? 'Cleared' : 'Review Recommended'} ({mathCorrect}/{mathQs.length})
          </span>
        </div>
      </div>

      {/* Detailed Answer Key Review Section (Phase 24) */}
      {showAnswerKey && (
        <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E2E6EB] pb-4 gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#C6A75E] uppercase tracking-wider">
                POST-EXAMINATION SOLUTION DOSSIER
              </span>
              <h2 className="text-lg font-bold text-[#0E1B2A]">Detailed Answer Key & Derivations</h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 font-mono text-xs bg-[#F6F8FA] p-1 rounded border border-[#E2E6EB]">
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
              const userAns = actualAnswers[q.id];

              return (
                <div key={q.id} className="border border-[#D4D9DF] rounded-md p-5 bg-white space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 font-mono text-xs font-bold bg-[#0E1B2A] text-white rounded">
                        QUESTION #{idx + 1}
                      </span>
                      <span className="text-xs font-mono text-[#64748B]">[{q.code}]</span>
                    </div>

                    {userAns ? (
                      userAns.isCorrect ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#234E35] bg-[#EDF6F0] px-2.5 py-0.5 rounded border border-[#88BE9B]">
                          <Check className="w-3.5 h-3.5" /> CORRECT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#782525] bg-[#FDF2F2] px-2.5 py-0.5 rounded border border-[#E29A9A]">
                          <X className="w-3.5 h-3.5" /> INCORRECT
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-0.5 rounded border border-[#CBD5E1]">
                        SKIPPED
                      </span>
                    )}
                  </div>

                  {/* Stem */}
                  <h3 className="text-sm font-semibold text-[#0E1B2A] leading-relaxed">{q.stem}</h3>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt) => {
                      const isCorrectOpt = opt.id === q.correctOptionId;
                      const isUserSelected = userAns?.selectedOptionId === opt.id;

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded border flex items-center justify-between ${
                            isCorrectOpt
                              ? 'bg-[#EDF6F0] border-[#88BE9B] text-[#234E35] font-semibold'
                              : isUserSelected
                              ? 'bg-[#FDF2F2] border-[#E29A9A] text-[#782525] font-semibold'
                              : 'bg-[#F8FAFC] border-[#E2E6EB] text-[#64748B]'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold">{opt.label}.</span>
                            <span>{opt.text}</span>
                          </div>
                          {isCorrectOpt && (
                            <span className="text-[10px] font-mono font-bold bg-[#234E35] text-white px-1.5 py-0.5 rounded">
                              CORRECT KEY
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Derivation / Explanation Box */}
                  <div className="bg-[#FDF7EC] border border-[#DEC088] p-3.5 rounded text-xs space-y-1">
                    <span className="text-[10px] font-mono font-bold text-[#7A5312] uppercase tracking-wider block">
                      OFFICIAL DERIVATION & REASONING:
                    </span>
                    <p className="text-[#1F2937] leading-relaxed">{q.explanation}</p>
                  </div>
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
