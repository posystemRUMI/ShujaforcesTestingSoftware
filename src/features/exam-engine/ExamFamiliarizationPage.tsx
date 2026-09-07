import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  BookOpen,
  AlertTriangle,
  Grid,
  SkipForward,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { familiarizationService, PracticeQuestion } from '@/services/familiarizationService';
import { testService, TestRecord } from '@/services/testService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRACTICE_DURATION_SECONDS = 60; // Fixed 1-minute practice per specification

export const ExamFamiliarizationPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const rawTestId = id || searchParams.get('testId');

  const [targetTest, setTargetTest] = useState<TestRecord | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState(PRACTICE_DURATION_SECONDS);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load real test metadata to extract sections for dynamic subject matching
  useEffect(() => {
    let isMounted = true;
    async function loadTestData() {
      try {
        let t: TestRecord | null = null;
        if (rawTestId && UUID_REGEX.test(rawTestId) && isSupabaseConfigured()) {
          t = await testService.getTestById(rawTestId);
        }
        if (!t && isSupabaseConfigured()) {
          const allTests = await testService.getTests();
          if (allTests && allTests.length > 0) {
            t = allTests[0];
          }
        }
        if (isMounted && t) {
          setTargetTest(t);
        }

        // Fetch test sections if available for discipline matching
        let sections: Array<{ subject_id?: string | null; name: string }> = [];
        if (t && isSupabaseConfigured()) {
          try {
            sections = await testService.getSections(t.id);
          } catch {
            // Fallback gracefully
          }
        }

        // Load exactly 5 practice MCQs dynamically matching test pattern
        const famData = await familiarizationService.getFamiliarizationData(t?.id || rawTestId, sections);
        if (isMounted) {
          setQuestions(famData.questions);
          setSecondsRemaining(famData.durationSeconds || PRACTICE_DURATION_SECONDS);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setLoadError(err?.message || 'Familiarization content is incomplete for this test.');
          setLoading(false);
        }
      }
    }

    loadTestData();
    return () => {
      isMounted = false;
    };
  }, [rawTestId]);

  // Handle Practice Conclusion
  const handleFinishPractice = useCallback(() => {
    setIsFinished(true);
    const resolvedId = targetTest?.id || rawTestId;
    if (resolvedId) {
      familiarizationService.markFamiliarizationCompleted(resolvedId);
    }
  }, [targetTest?.id, rawTestId]);

  // Fixed 1-minute countdown timer
  useEffect(() => {
    if (loading || isFinished) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishPractice();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isFinished, handleFinishPractice]);

  // Current active question
  const currentQ = useMemo(() => questions[currentIndex], [questions, currentIndex]);
  const selectedOptionId = currentQ ? selectedAnswers[currentQ.id] : undefined;

  // Option selection (NO mid-test reveals)
  const handleSelectOption = (optionId: string) => {
    if (isFinished || !currentQ) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
    setSkipped((prev) => {
      if (prev.has(currentQ.id)) {
        const next = new Set(prev);
        next.delete(currentQ.id);
        return next;
      }
      return prev;
    });
  };

  // Clear Selected Option
  const handleClearAnswer = useCallback(() => {
    if (!currentQ || !selectedAnswers[currentQ.id] || isFinished) return;
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQ.id];
      return next;
    });
  }, [currentQ, selectedAnswers, isFinished]);

  // Explicit Skip Question: marks as skipped and advances
  const handleSkip = useCallback(() => {
    if (!currentQ || isFinished) return;

    if (!selectedAnswers[currentQ.id]) {
      setSkipped((prev) => {
        const next = new Set(prev);
        next.add(currentQ.id);
        return next;
      });
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentQ, selectedAnswers, currentIndex, isFinished, questions.length]);

  // Question Status calculation: Attempted (Green), Skipped (Amber), Unattempted (Red)
  const getQuestionStatus = useCallback(
    (qId: string): 'attempted' | 'skipped' | 'unattempted' => {
      if (selectedAnswers[qId]) return 'attempted';
      if (skipped.has(qId) || flagged.has(qId)) return 'skipped';
      return 'unattempted';
    },
    [selectedAnswers, skipped, flagged]
  );

  const attemptedCount = questions.filter((q) => !!selectedAnswers[q.id]).length;
  const skippedCount = questions.filter(
    (q) => !selectedAnswers[q.id] && (skipped.has(q.id) || flagged.has(q.id))
  ).length;
  const unattemptedCount = questions.filter(
    (q) => !selectedAnswers[q.id] && !skipped.has(q.id) && !flagged.has(q.id)
  ).length;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || loading || !currentQ) return;

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (currentQ.options[idx]) {
          handleSelectOption(currentQ.options[idx].id);
        }
      } else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
        const charMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
        const idx = charMap[e.key.toLowerCase()];
        if (currentQ.options[idx]) {
          handleSelectOption(currentQ.options[idx].id);
        }
      } else if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'k') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQ, isFinished, loading, questions.length, handleSkip]);

  // Reset for Repeat Practice
  const handleRepeatPractice = () => {
    const resolvedId = targetTest?.id || rawTestId;
    if (resolvedId) {
      familiarizationService.clearFamiliarization(resolvedId);
    }
    setSelectedAnswers({});
    setSkipped(new Set());
    setFlagged(new Set());
    setCurrentIndex(0);
    setSecondsRemaining(PRACTICE_DURATION_SECONDS);
    setIsFinished(false);
  };

  // Continue to real exam instructions
  const handleProceedToInstructions = () => {
    const resolvedId = targetTest?.id || (rawTestId && UUID_REGEX.test(rawTestId) ? rawTestId : undefined);
    if (resolvedId) {
      navigate(`/exam/instructions?testId=${resolvedId}`);
    } else {
      navigate('/exam/instructions');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <div className="w-8 h-8 border-3 border-[#0E1B2A] border-t-[#C6A75E] rounded-full animate-spin" />
        <span className="text-xs font-sans font-semibold text-[#64748B] uppercase tracking-wider">
          Initializing 1-Minute Practice Environment...
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full py-12 px-4 select-none">
        <div className="bg-white border-2 border-[#991B1B] rounded-lg p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center mx-auto text-[#991B1B]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#991B1B] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FCA5A5]">
              Configuration / Eligibility Notice
            </span>
            <h2 className="text-lg font-bold text-[#0E1B2A] uppercase tracking-wide mt-2">
              Orientation Unavailable
            </h2>
            <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
              {loadError}
            </p>
          </div>
          <div className="pt-3">
            <button
              onClick={() => navigate('/student/tests')}
              className="px-6 py-2.5 bg-[#0E1B2A] hover:bg-[#1A2C42] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Return to Assigned Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- PRACTICE COMPLETE SUMMARY SCREEN (ANSWERS SHOWN ONLY HERE) ---
  if (isFinished) {
    return (
      <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-6 select-none animate-in fade-in zoom-in-95 duration-200 space-y-6">
        <div className="bg-white border-2 border-[#0E1B2A] rounded-lg p-6 sm:p-8 shadow-[0_4px_0_0_rgba(14,27,42,0.12)] space-y-6">
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-[#D4D9DF] pb-5">
            <div className="space-y-1">
              <span className="text-[11px] font-sans font-bold uppercase tracking-widest text-[#234E35] bg-[#EDF6F0] px-2.5 py-1 rounded border border-[#88BE9B] inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ORIENTATION COMPLETE
              </span>
              <h1 className="text-2xl font-bold uppercase tracking-wide text-[#0E1B2A] mt-1">
                Practice Round Concluded
              </h1>
              <p className="text-xs text-[#64748B]">
                Shuja Forces Academy Pindsultani — Pre-Test Familiarization
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-[#0E1B2A] text-[#C6A75E] flex items-center justify-center font-bold text-lg border border-[#C6A75E]">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          {/* Guarantee Affirmations Card */}
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-md p-4 space-y-2.5 text-xs text-[#334155] font-sans">
            <div className="font-bold text-[#0E1B2A] flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#C6A75E]" />
              <span>Familiarization Summary & Integrity Guarantee</span>
            </div>
            <ul className="space-y-2 pl-5 list-disc text-[12px] leading-relaxed">
              <li>
                <strong>Un-Scored Interaction:</strong> Your answers were not scored and will <strong>NOT</strong> affect your entrance evaluation.
              </li>
              <li>
                <strong>Zero Attempt Consumption:</strong> This practice round did not count toward your attempt limit or retake eligibility.
              </li>
              <li>
                <strong>Official Test Unstarted:</strong> The timer and scoring for your assigned examination have <strong>NOT</strong> started yet.
              </li>
              <li>
                <strong>Answer Key Review:</strong> Solutions and explanations are disclosed below exclusively for candidate orientation.
              </li>
            </ul>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#DCFCE7] rounded border border-[#22C55E] text-center">
              <span className="text-[#166534] block text-[10px] font-semibold uppercase">Attempted</span>
              <span className="text-lg font-bold text-[#166534] font-sans tabular-nums">
                {attemptedCount} of {questions.length}
              </span>
            </div>
            <div className="p-3 bg-[#FEF3C7] rounded border border-[#F59E0B] text-center">
              <span className="text-[#92400E] block text-[10px] font-semibold uppercase">Skipped</span>
              <span className="text-lg font-bold text-[#92400E] font-sans tabular-nums">
                {skippedCount}
              </span>
            </div>
            <div className="p-3 bg-[#FEE2E2] rounded border border-[#EF4444] text-center">
              <span className="text-[#991B1B] block text-[10px] font-semibold uppercase">Unattempted</span>
              <span className="text-lg font-bold text-[#991B1B] font-sans tabular-nums">
                {unattemptedCount}
              </span>
            </div>
          </div>

          {/* Comprehensive Questions & Official Solutions Review Section */}
          <div className="border-t border-[#D4D9DF] pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#0E1B2A]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0E1B2A]">
                  Orientation Questions & Official Solution Review
                </h3>
              </div>
              <span className="text-[11px] font-sans text-[#64748B]">
                Answers shown only at the end of the test
              </span>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userChoiceId = selectedAnswers[q.id];
                const isAnsweredQ = !!userChoiceId;
                const isCorrect = userChoiceId === q.correctOptionId;
                const isSkippedQ = !isAnsweredQ && (skipped.has(q.id) || flagged.has(q.id));

                return (
                  <div key={q.id} className="border border-[#CBD5E1] rounded-md p-4 bg-[#FAFAFA] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 font-sans tabular-nums text-xs font-bold bg-[#0E1B2A] text-white rounded">
                          QUESTION #{idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-[#64748B] uppercase">{q.subjectName}</span>
                      </div>

                      {isAnsweredQ && isCorrect && (
                        <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-[#166534] bg-[#DCFCE7] px-2.5 py-0.5 rounded border border-[#22C55E]">
                          <Check className="w-3.5 h-3.5" /> CORRECT
                        </span>
                      )}
                      {isAnsweredQ && !isCorrect && (
                        <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-[#991B1B] bg-[#FEE2E2] px-2.5 py-0.5 rounded border border-[#EF4444]">
                          <X className="w-3.5 h-3.5" /> INCORRECT
                        </span>
                      )}
                      {isSkippedQ && (
                        <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-[#92400E] bg-[#FEF3C7] px-2.5 py-0.5 rounded border border-[#F59E0B]">
                          SKIPPED
                        </span>
                      )}
                      {!isAnsweredQ && !isSkippedQ && (
                        <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-[#991B1B] bg-[#FEE2E2] px-2.5 py-0.5 rounded border border-[#EF4444]">
                          UNATTEMPTED
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-[#0E1B2A] leading-relaxed">
                      {q.stem}
                    </p>

                    {q.imageUrl && (
                      <div className="p-2 border rounded bg-white max-w-xs">
                        <img src={q.imageUrl} alt="Diagram" className="max-h-36 w-auto object-contain rounded" />
                      </div>
                    )}

                    {/* Options Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt) => {
                        const isOfficialKey = opt.id === q.correctOptionId;
                        const isSelectedByStudent = opt.id === userChoiceId;

                        let optionStyle = 'bg-white border-[#D4D9DF] text-[#1F2937]';
                        let badgeStyle = 'bg-[#F6F8FA] border-[#D4D9DF] text-[#0E1B2A]';

                        if (isOfficialKey) {
                          optionStyle = 'bg-[#DCFCE7] border-[#22C55E] text-[#166534] font-semibold';
                          badgeStyle = 'bg-[#16A34A] text-white border-[#16A34A]';
                        } else if (isSelectedByStudent && !isOfficialKey) {
                          optionStyle = 'bg-[#FEE2E2] border-[#EF4444] text-[#991B1B]';
                          badgeStyle = 'bg-[#DC2626] text-white border-[#DC2626]';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded border flex items-center space-x-2.5 ${optionStyle}`}
                          >
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs font-sans border ${badgeStyle}`}
                            >
                              {opt.label}
                            </span>
                            <span className="flex-1 text-xs">{opt.text}</span>
                            {isOfficialKey && (
                              <span className="text-[10px] font-sans uppercase font-bold bg-[#16A34A] text-white px-1.5 py-0.5 rounded">
                                Official Key
                              </span>
                            )}
                            {isSelectedByStudent && !isOfficialKey && (
                              <span className="text-[10px] font-sans uppercase font-bold bg-[#DC2626] text-white px-1.5 py-0.5 rounded">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 bg-[#F1F5F9] rounded border border-[#CBD5E1] text-xs text-[#334155] space-y-1">
                        <span className="font-bold text-[#0E1B2A] uppercase text-[10px] tracking-wider block">
                          Official Derivation / Explanation:
                        </span>
                        <p className="text-[11px] leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Action Strip */}
          <div className="flex items-center justify-between pt-4 border-t border-[#D4D9DF]">
            <button
              type="button"
              onClick={handleRepeatPractice}
              className="inline-flex items-center space-x-1.5 px-4 py-2 border border-[#CBD5E1] rounded text-xs font-bold text-[#0E1B2A] hover:bg-[#EDF1F5] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Repeat Practice (1 Min)</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToInstructions}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#0E1B2A] text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1A2C42] transition-colors shadow-sm"
            >
              <span>Continue to Test Instructions</span>
              <ArrowRight className="w-4 h-4 text-[#C6A75E]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE 1-MINUTE FAMILIARIZATION RUNNER WITH SIDE PALETTE ---
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isTimeCritical = secondsRemaining <= 15;

  return (
    <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full py-4 select-none space-y-4">
      {/* Banner / Instructions Strip */}
      <div className="bg-[#0E1B2A] text-white rounded-lg px-6 py-3 flex items-center justify-between border-b-2 border-[#C6A75E] shadow-xs">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C6A75E] animate-pulse" />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                1-Minute Practice Round
              </h2>
              <span className="text-[10px] font-mono bg-[#1C2E42] text-[#C6A75E] px-2 py-0.5 rounded">
                UN-SCORED
              </span>
            </div>
            <p className="text-[11px] text-[#A0AEC0] mt-0.5 font-sans">
              Orientation mode: Questions reflect real exam pattern. Answers will be revealed at the end of practice.
            </p>
          </div>
        </div>

        {/* 60s Countdown Timer */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-mono tabular-nums text-xs font-bold border transition-colors ${
            isTimeCritical
              ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
              : 'bg-[#1C2E42] border-[#2E425A] text-[#C6A75E]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{timeFormatted}</span>
        </div>
      </div>

      {/* Main Split Layout: Left Reading Pane, Right Question Palette */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5">
        {/* Primary Reading Pane */}
        <main className="flex-1 bg-white border border-[#CBD5E1] rounded-lg p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-5">
            {/* Top Question Toolbar */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 text-xs font-sans">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#0E1B2A] bg-[#EDF1F5] px-2.5 py-1 rounded border border-[#CBD5E1] tabular-nums">
                  Practice Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider bg-[#F1F5F9] px-2 py-0.5 rounded">
                  {currentQ?.subjectName}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs font-sans tabular-nums">
                <span className="font-semibold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#22C55E]">
                  {attemptedCount} Done
                </span>
                <span className="font-semibold text-[#991B1B] bg-[#FEE2E2] px-2 py-0.5 rounded border border-[#EF4444]">
                  {unattemptedCount} Left
                </span>
              </div>
            </div>

            {/* Question Stem */}
            {currentQ && (
              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-semibold text-[#0E1B2A] leading-relaxed font-sans">
                  {currentQ.stem}
                </h3>

                {currentQ.imageUrl && (
                  <div className="p-3 border rounded bg-[#F8FAFC] flex justify-center max-w-md">
                    <img
                      src={currentQ.imageUrl}
                      alt="Practice Reference"
                      className="max-h-48 w-auto object-contain rounded"
                    />
                  </div>
                )}

                {/* Multiple Choice Options (Neutral selection - NO MID-TEST FEEDBACK) */}
                <div className="space-y-2.5" role="radiogroup">
                  {currentQ.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(opt.id)}
                        className={`w-full text-left p-3.5 rounded-md border transition-all flex items-center space-x-3.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0E1B2A] ${
                          isSelected
                            ? 'bg-[#EDF6F0] border-[#234E35] text-[#234E35] shadow-xs font-semibold'
                            : 'bg-white border-[#D4D9DF] text-[#1F2937] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs font-sans transition-colors border ${
                            isSelected
                              ? 'bg-[#234E35] text-white border-[#234E35]'
                              : 'bg-[#F6F8FA] border-[#D4D9DF] text-[#0E1B2A]'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span className="text-xs sm:text-sm font-sans flex-1">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Control Bar */}
          <div className="border-t border-[#E2E8F0] pt-4 mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors border ${
                  currentIndex === 0
                    ? 'text-[#CBD5E1] border-transparent cursor-not-allowed'
                    : 'text-[#0E1B2A] border-[#D4D9DF] hover:bg-[#EDF1F5]'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {selectedOptionId && (
                <button
                  type="button"
                  onClick={handleClearAnswer}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-semibold border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  title="Clear selection"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#F59E0B] text-[#92400E] bg-[#FEF3C7] hover:bg-[#FDE68A] rounded text-xs font-semibold transition-colors"
                title="Skip this question"
              >
                <SkipForward className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Skip</span>
              </button>

              <button
                type="button"
                onClick={handleFinishPractice}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[#CBD5E1] hover:bg-[#EDF1F5] rounded text-xs font-semibold text-[#0E1B2A] transition-colors"
              >
                <span>Finish Early</span>
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-[#0E1B2A] text-white rounded text-xs font-semibold hover:bg-[#1A2C42] transition-colors"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishPractice}
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-[#234E35] text-white rounded text-xs font-bold hover:bg-[#1B3B28] transition-colors shadow-xs"
                >
                  <span>Complete Orientation</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Side Question Palette Matrix (Desktop Aside + Mobile Header) */}
        <aside className="w-full lg:w-72 bg-white border border-[#CBD5E1] rounded-lg p-4 shadow-sm flex flex-col justify-between flex-shrink-0">
          <div className="space-y-4">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5" />
                <span>Question Matrix</span>
              </h3>

              {/* Status Legend: Red for unattempted, Amber for skipped, Green for attempted */}
              <div className="grid grid-cols-2 gap-1.5 mt-3 text-[10px] font-sans tabular-nums font-semibold">
                <div className="flex items-center space-x-1.5 bg-[#DCFCE7] p-1.5 rounded border border-[#22C55E] text-[#166534]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] flex-shrink-0" />
                  <span className="truncate">Attempted ({attemptedCount})</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-[#FEF3C7] p-1.5 rounded border border-[#F59E0B] text-[#92400E]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] flex-shrink-0" />
                  <span className="truncate">Skipped ({skippedCount})</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-[#FEE2E2] p-1.5 rounded border border-[#EF4444] text-[#991B1B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] flex-shrink-0" />
                  <span className="truncate">Unattempted ({unattemptedCount})</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-[#0E1B2A] p-1.5 rounded text-white border border-[#0E1B2A]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C6A75E] flex-shrink-0" />
                  <span className="truncate">Current (Q{currentIndex + 1})</span>
                </div>
              </div>
            </div>

            {/* Question Matrix Grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const status = getQuestionStatus(q.id);

                let colorClasses = 'bg-[#FEE2E2] text-[#991B1B] border border-[#EF4444] hover:bg-[#FECACA]'; // unattempted = RED
                if (status === 'attempted') {
                  colorClasses = 'bg-[#DCFCE7] text-[#166534] border border-[#22C55E] hover:bg-[#BBF7D0]'; // attempted = GREEN
                } else if (status === 'skipped') {
                  colorClasses = 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] hover:bg-[#FDE68A]'; // skipped = AMBER
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded font-sans tabular-nums text-xs font-bold transition-all relative flex items-center justify-center ${
                      isCurrent ? 'ring-2 ring-[#0E1B2A] ring-offset-2 scale-105 z-10 shadow-sm' : ''
                    } ${colorClasses}`}
                    title={`Question ${idx + 1} (${status.toUpperCase()})`}
                  >
                    {(idx + 1).toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] mt-4">
            <button
              type="button"
              onClick={handleFinishPractice}
              className="w-full py-2.5 bg-[#234E35] text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1E432E] transition-colors shadow-xs"
            >
              Finish Practice Early
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ExamFamiliarizationPage;
