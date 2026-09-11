import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Shield,
  AlertTriangle,
  Layers,
  Grid,
  X,
  RefreshCw,
  SkipForward,
  RotateCcw,
  Check,
} from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';
import { attemptService } from '@/services/attemptService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

const STORAGE_KEY = 'FA_ACTIVE_EXAM_STATE_V1';

export interface SafeQuestionOption {
  id: string;
  label: string;
  text: string;
  imageUrl?: string;
}

export interface SafeQuestion {
  id: string;
  code: string;
  subject: string;
  stem: string;
  imageUrl?: string;
  options: SafeQuestionOption[];
}

export interface SectionMeta {
  id: string;
  title: string;
  startIndex: number;
  endIndex: number;
  questionCount: number;
  durationMinutes: number;
}

export const ExamRunnerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');

  // Questions and Sections state (Safe payload - NEVER contains correctOptionId)
  const [questions, setQuestions] = useState<SafeQuestion[]>([]);
  const [sections, setSections] = useState<SectionMeta[]>([]);
  const [testTitle, setTestTitle] = useState('Preliminary Computerized Screening Examination');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active exam interaction state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.answers || {};
      }
    } catch (e) {
      /* ignore */
    }
    return {};
  });

  const [flagged, setFlagged] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.flagged)) {
          return new Set(parsed.flagged);
        }
      }
    } catch (e) {
      /* ignore */
    }
    return new Set();
  });

  const [skipped, setSkipped] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.skipped)) {
          return new Set(parsed.skipped);
        }
      }
    } catch (e) {
      /* ignore */
    }
    return new Set();
  });

  const [secondsRemaining, setSecondsRemaining] = useState(3900); // 65 min default

  // UI state
  const [autosaveStatus, setAutosaveStatus] = useState<'SAVED' | 'SAVING' | 'UNSYNCED'>('SAVED');
  const [showMatrixDrawer, setShowMatrixDrawer] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Safe Exam Payload from Supabase
  useEffect(() => {
    let isMounted = true;

    async function initializeExam() {
      if (attemptId && isSupabaseConfigured()) {
        try {
          const payload = await attemptService.getSafeExamPayload(attemptId);
          if (!isMounted) return;

          let qList: SafeQuestion[] = [];
          let secList: SectionMeta[] = [];
          let offset = 0;

          for (const sec of payload.sections || []) {
            const secQs: SafeQuestion[] = (sec.questions || []).map((q) => ({
              id: q.id,
              code: q.code,
              subject: q.subject_id || 'GENERAL',
              stem: q.stem,
              imageUrl: q.stem_image_url || undefined,
              options: (q.options || []).map((opt) => ({
                id: opt.id,
                label: opt.label,
                text: opt.text,
                imageUrl: opt.image_url || undefined,
              })),
            }));

            secList.push({
              id: sec.id,
              title: sec.name,
              startIndex: offset,
              endIndex: offset + secQs.length - 1,
              questionCount: secQs.length,
              durationMinutes: sec.duration_minutes || 30,
            });

            offset += secQs.length;
            qList = qList.concat(secQs);
          }

          if (qList.length > 0) {
            setQuestions(qList);
            setSections(secList);
            setTestTitle(payload.test?.name || (payload as any).test_name || 'Preliminary Computerized Screening Examination');

            // Synchronize preloaded answers & flags
            if (payload.saved_answers) {
              const restoredAnswers: Record<string, string> = {};
              const restoredFlags = new Set<string>();

              for (const [qid, ans] of Object.entries(payload.saved_answers)) {
                if (ans.selected_option_id) restoredAnswers[qid] = ans.selected_option_id;
                if (ans.marked_for_review) restoredFlags.add(qid);
              }

              setAnswers((prev) => ({ ...restoredAnswers, ...prev }));
              setFlagged(restoredFlags);
            }

            // Sync chronometer with exact section duration or valid server seconds
            const serverSecs = (payload as any).time_remaining_seconds;
            if (typeof serverSecs === 'number' && serverSecs > 0 && serverSecs <= 7200) {
              setSecondsRemaining(serverSecs);
            } else if (secList.length > 0 && secList[0].durationMinutes) {
              setSecondsRemaining(secList[0].durationMinutes * 60);
            } else {
              setSecondsRemaining(1800);
            }
          } else {
            setErrorMsg('No questions available in examination payload.');
          }
        } catch (err: any) {
          console.error('Failed to load safe exam payload:', err);
          setErrorMsg(err.message || 'Error loading examination. Please contact administrator.');
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        setErrorMsg('Invalid or missing attempt session ID.');
        if (isMounted) setLoading(false);
      }
    }

    initializeExam();

    return () => {
      isMounted = false;
    };
  }, [attemptId]);

  // Local storage caching
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          answers,
          flagged: Array.from(flagged),
          skipped: Array.from(skipped),
          secondsRemaining,
          currentIndex,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      /* ignore */
    }
  }, [answers, flagged, skipped, secondsRemaining, currentIndex]);

  // Server Telemetry Heartbeat (every 20s)
  useEffect(() => {
    if (!attemptId || !isSupabaseConfigured() || loading) return;

    const currentSecTitle = sections.find(
      (s) => currentIndex >= s.startIndex && currentIndex <= s.endIndex
    )?.title;

    const heartbeatTimer = setInterval(() => {
      attemptService
        .recordHeartbeat(
          attemptId,
          Object.keys(answers).length,
          currentIndex,
          currentSecTitle
        )
        .catch((e) => console.warn('Heartbeat transmission skipped:', e));
    }, 20000);

    return () => clearInterval(heartbeatTimer);
  }, [attemptId, answers, currentIndex, sections, loading]);

  // Chronometer countdown with per-section timer auto-advancement
  useEffect(() => {
    if (loading) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);

          if (activeSectionIndex < sections.length - 1) {
            const currentTitle = sections[activeSectionIndex]?.title || 'Current Section';
            toast.warning(`Timer expired for section "${currentTitle}". Advancing to next section...`);
            handleProceedNextSection();
          } else {
            toast.warning('Final section timer expired! Submitting examination automatically.');
            handleFinalSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, activeSectionIndex, sections]);

  const currentQ = questions[currentIndex] || questions[0];
  const isFlagged = currentQ ? flagged.has(currentQ.id) : false;
  const selectedOptionId = currentQ ? answers[currentQ.id] : undefined;

  // Handle Option Selection with Instant Server Autosave (SAVE-009)
  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (!currentQ) return;

      setAnswers((prev) => ({
        ...prev,
        [currentQ.id]: optionId,
      }));

      // Unmark from skipped once candidate commits an answer
      setSkipped((prev) => {
        if (prev.has(currentQ.id)) {
          const next = new Set(prev);
          next.delete(currentQ.id);
          return next;
        }
        return prev;
      });

      if (attemptId && isSupabaseConfigured()) {
        setAutosaveStatus('SAVING');
        attemptService
          .saveAnswer(attemptId, currentQ.id, optionId, flagged.has(currentQ.id))
          .then(() => setAutosaveStatus('SAVED'))
          .catch((err) => {
            console.warn('Server autosave error:', err);
            setAutosaveStatus('UNSYNCED');
          });
      }
    },
    [currentQ, attemptId, flagged]
  );

  // Toggle Review Flag with Instant Server Synchronization
  const toggleFlag = useCallback(() => {
    if (!currentQ) return;

    setFlagged((prev) => {
      const next = new Set(prev);
      const willBeFlagged = !next.has(currentQ.id);

      if (willBeFlagged) {
        next.add(currentQ.id);
        toast.info('Question flagged for review');
      } else {
        next.delete(currentQ.id);
        toast.info('Question unflagged');
      }

      if (attemptId && isSupabaseConfigured()) {
        attemptService
          .saveAnswer(attemptId, currentQ.id, answers[currentQ.id], willBeFlagged)
          .then(() => setAutosaveStatus('SAVED'))
          .catch((err) => {
            console.warn('Server flag sync error:', err);
            setAutosaveStatus('UNSYNCED');
          });
      }

      return next;
    });
  }, [currentQ, attemptId, answers]);

  const handleNext = useCallback(() => {
    const currentSec = sections[activeSectionIndex];
    if (currentSec && currentIndex === currentSec.endIndex && activeSectionIndex < sections.length - 1) {
      setShowSectionModal(true);
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, activeSectionIndex, sections, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Explicit Skip Question: marks as skipped and advances
  const handleSkip = useCallback(() => {
    if (!currentQ) return;

    if (!answers[currentQ.id]) {
      setSkipped((prev) => {
        const next = new Set(prev);
        next.add(currentQ.id);
        return next;
      });
      toast.info(`Question ${currentIndex + 1} marked as skipped`);
    }

    handleNext();
  }, [currentQ, answers, currentIndex, handleNext]);

  // Clear Selected Option
  const handleClearAnswer = useCallback(() => {
    if (!currentQ || !answers[currentQ.id]) return;

    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQ.id];
      return next;
    });

    if (attemptId && isSupabaseConfigured()) {
      attemptService
        .saveAnswer(attemptId, currentQ.id, '', flagged.has(currentQ.id))
        .catch((e) => console.warn('Clear answer sync error:', e));
    }
    toast.info(`Selection cleared for Question ${currentIndex + 1}`);
  }, [currentQ, answers, attemptId, flagged, currentIndex]);

  const handleProceedNextSection = async () => {
    setShowSectionModal(false);
    const nextSecIndex = activeSectionIndex + 1;
    if (nextSecIndex < sections.length) {
      const nextSection = sections[nextSecIndex];
      setActiveSectionIndex(nextSecIndex);
      setCurrentIndex(nextSection.startIndex);
      setSecondsRemaining(nextSection.durationMinutes * 60);

      if (attemptId && isSupabaseConfigured()) {
        attemptService.advanceSection(attemptId, nextSection.id).catch((e) => {
          console.warn('Section advance RPC error:', e);
        });
      }
      toast.success(`Started ${nextSection.title} (${nextSection.durationMinutes} mins allocated)`);
    } else {
      handleFinalSubmit();
    }
  };

  // Final Server Submission (Server-authoritative scoring)
  const handleFinalSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (attemptId && isSupabaseConfigured()) {
        const res = await attemptService.submitAttempt(attemptId);
        localStorage.removeItem(STORAGE_KEY);
        navigate(`/exam/finish?attemptId=${attemptId}&resultId=${res.result_id}`);
      } else {
        toast.error('Unable to submit: missing active exam session.');
        setSubmitting(false);
      }
    } catch (err: any) {
      console.error('Final submission error:', err);
      toast.error(err.message || 'Error submitting test attempt. Please notify proctor immediately.');
      setSubmitting(false);
    }
  };

  // Keyboard shortcut listeners (1-4, Arrow Keys, M for Mark, S for Skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitModal || showSectionModal || !currentQ) return;

      if (e.key === '1' || e.key === 'a' || e.key === 'A') {
        if (currentQ.options[0]) handleSelectOption(currentQ.options[0].id);
      } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
        if (currentQ.options[1]) handleSelectOption(currentQ.options[1].id);
      } else if (e.key === '3' || e.key === 'c' || e.key === 'C') {
        if (currentQ.options[2]) handleSelectOption(currentQ.options[2].id);
      } else if (e.key === '4' || e.key === 'd' || e.key === 'D') {
        if (currentQ.options[3]) handleSelectOption(currentQ.options[3].id);
      } else if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') {
        handlePrev();
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'r' || e.key === 'R') {
        toggleFlag();
      } else if (e.key === 's' || e.key === 'S' || e.key === 'k' || e.key === 'K') {
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQ, handleSelectOption, handleNext, handlePrev, toggleFlag, handleSkip, showSubmitModal, showSectionModal]);

  // Active section lookup
  const currentSection =
    sections.find((s) => currentIndex >= s.startIndex && currentIndex <= s.endIndex) ||
    sections[0] || { title: 'General Examination' };

  // Status calculation: Attempted (Green), Skipped (Amber), Unattempted (Red)
  const getQuestionStatus = useCallback(
    (qId: string): 'attempted' | 'skipped' | 'unattempted' => {
      if (answers[qId]) return 'attempted';
      if (skipped.has(qId) || flagged.has(qId)) return 'skipped';
      return 'unattempted';
    },
    [answers, skipped, flagged]
  );

  const attemptedCount = questions.filter((q) => !!answers[q.id]).length;
  const skippedCount = questions.filter(
    (q) => !answers[q.id] && (skipped.has(q.id) || flagged.has(q.id))
  ).length;
  const unattemptedCount = questions.filter(
    (q) => !answers[q.id] && !skipped.has(q.id) && !flagged.has(q.id)
  ).length;

  const isDangerTime = secondsRemaining < 60;
  const isWarningTime = secondsRemaining < 300 && !isDangerTime;

  if (loading) {
    return (
      <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#0E1B2A] animate-spin" />
        <span className="text-xs font-sans font-bold text-[#64748B] uppercase tracking-wider">
          Securing CBT Terminal & Authorizing Examination Docket...
        </span>
      </div>
    );
  }

  if (errorMsg || questions.length === 0) {
    return (
      <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <AlertTriangle className="w-10 h-10 text-[#782525]" />
        <h2 className="text-base font-bold text-[#0E1B2A]">Examination Docket Error</h2>
        <p className="text-xs text-[#64748B] max-w-md">{errorMsg || 'No safe candidate questions available for this attempt.'}</p>
        <button
          type="button"
          onClick={() => navigate('/student')}
          className="px-4 py-2 bg-[#0E1B2A] text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1C2E42]"
        >
          Return to Cadet Portal
        </button>
      </div>
    );
  }

  // Section title formatting without excessive uppercase or prefixes
  const cleanSectionTitle = currentSection.title
    .replace(/^SECTION:\s*/i, '')
    .replace(/^ACADEMIC\s*\((.*?)\)/i, '$1')
    .replace(/_/g, ' ')
    .trim();

  // Calm timer badge style
  const timerBadgeStyle = isDangerTime
    ? 'bg-red-950/40 text-red-300 border-red-500/40'
    : isWarningTime
    ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
    : 'bg-[#1C2E42] text-slate-100 border-[#2E425A]';

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F8FA] text-[#1F2937] select-none">
      {/* Premium Compact Header */}
      <header className="h-14 sm:h-16 bg-[#0E1B2A] text-white px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-[#1C2E42] sticky top-0 z-30 shadow-xs">
        {/* Left: Shuja Forces Academy Mark & Test Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#0E1B2A] border border-[#C6A75E]/40 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-[#C6A75E]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg">
              {testTitle}
            </h1>
            <span className="text-[11px] text-slate-400 hidden sm:inline-block">
              Shuja Forces Academy • Pindsultani
            </span>
          </div>
        </div>

        {/* Center: Clean Section Pill */}
        <div className="hidden md:flex items-center gap-2 bg-[#1C2E42] px-3.5 py-1 rounded-full text-xs font-medium text-slate-200 border border-[#2E425A]">
          <Layers className="w-3.5 h-3.5 text-[#C6A75E]" />
          <span>{cleanSectionTitle}</span>
        </div>

        {/* Right: Autosave Status, Calm Timer, Mobile Toggle */}
        <div className="flex items-center gap-3">
          {/* Subtle Autosave Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 font-sans">
            {autosaveStatus === 'SAVING' ? (
              <>
                <RefreshCw className="w-3 h-3 text-[#C6A75E] animate-spin" />
                <span>Saving…</span>
              </>
            ) : autosaveStatus === 'UNSYNCED' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-300">Not saved — retrying</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved</span>
              </>
            )}
          </div>

          {/* Calm Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono tabular-nums text-sm font-medium border transition-colors ${timerBadgeStyle}`}
            aria-label={`Time remaining: ${formatTime(secondsRemaining)}`}
          >
            <Clock className="w-3.5 h-3.5 opacity-80" />
            <span className="tracking-wide">{formatTime(secondsRemaining)}</span>
          </div>

          {/* Mobile Navigator Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowMatrixDrawer(!showMatrixDrawer)}
            className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1C2E42] hover:bg-[#253950] text-slate-200 text-xs font-medium border border-[#2E425A] transition-colors"
            aria-label="Toggle Question Navigator"
          >
            <Grid className="w-4 h-4 text-[#C6A75E]" />
            <span className="tabular-nums">
              {attemptedCount}/{questions.length}
            </span>
          </button>
        </div>
      </header>

      {/* Main Examination Layout Container (1440px wide max) */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left / Primary Question Workspace */}
        <main className="flex-1 w-full min-w-0 bg-white border border-[#E6E8EC] rounded-2xl p-6 sm:p-8 lg:p-9 shadow-xs flex flex-col justify-between">
          <div>
            {/* Question Top Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-[#F1F5F9] gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold text-[#0E1B2A] tabular-nums">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs text-[#94A3B8] font-mono">
                  [{currentQ.code}]
                </span>
                <span className="text-xs font-medium text-[#475569] bg-[#F1F5F9] px-2.5 py-0.5 rounded-md border border-[#E2E8F0] hidden sm:inline-block">
                  {currentQ.subject.replace('INTELLIGENCE_', '').replace('ACADEMIC_', '')}
                </span>
              </div>

              {isFlagged && (
                <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 font-medium bg-[#FEFCE8] px-2.5 py-1 rounded-md border border-[#FEF08A]">
                  <Flag className="w-3.5 h-3.5 fill-[#854D0E] text-[#854D0E]" />
                  <span>Marked for review</span>
                </div>
              )}
            </div>

            {/* Question Stem (20-22px, font-semibold, leading-relaxed) */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-[22px] font-semibold text-[#111827] leading-[1.55]">
                {currentQ.stem}
              </h2>

              {currentQ.imageUrl && (
                <div className="mt-5 p-3 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] max-w-lg">
                  <img
                    src={currentQ.imageUrl}
                    alt="Question Diagram"
                    className="max-h-72 w-auto object-contain rounded-lg"
                  />
                  <span className="text-[11px] font-sans text-[#64748B] block mt-1.5">
                    Figure 1.0 — Refer to diagram for solution
                  </span>
                </div>
              )}
            </div>

            {/* Multiple Choice Options (min-height 56-64px, clear badges, soft emerald selection) */}
            <div
              className="space-y-3 sm:space-y-3.5 mb-6"
              role="radiogroup"
              aria-label="Multiple Choice Options"
            >
              {currentQ.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full min-h-[58px] sm:min-h-[64px] text-left p-4 rounded-xl border transition-all flex items-center gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0E1B2A]/20 ${
                      isSelected
                        ? 'bg-[#F0FDF4] border-[#10B981] shadow-xs'
                        : 'bg-white border-[#E6E8EC] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm font-sans shrink-0 transition-colors border ${
                        isSelected
                          ? 'bg-[#10B981] text-white border-[#10B981]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569]'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm sm:text-base leading-relaxed block ${
                          isSelected ? 'font-medium text-[#064E3B]' : 'text-[#1F2937]'
                        }`}
                      >
                        {opt.text}
                      </span>
                      {opt.imageUrl && (
                        <img
                          src={opt.imageUrl}
                          alt={`Option ${opt.label}`}
                          className="mt-2 max-h-24 w-auto rounded border"
                        />
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Subtle Keyboard Shortcuts Hint */}
            <div className="text-[11px] text-[#94A3B8] font-sans flex items-center gap-2 mb-2">
              <span>Keyboard: 1–4 to choose • M to flag • ← → to navigate</span>
            </div>
          </div>

          {/* Bottom Action Bar:
              Left: Previous | Clear answer | Flag for review
              Right: Skip for now | Next Question (or Review Answers on final Q)
              No duplicate status counters!
          */}
          <div className="border-t border-[#F1F5F9] pt-5 mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-[#D4D9DF] text-[#1E293B] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {selectedOptionId && (
                <button
                  type="button"
                  onClick={handleClearAnswer}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear selected option"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear answer</span>
                </button>
              )}

              <button
                type="button"
                onClick={toggleFlag}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  isFlagged
                    ? 'bg-[#FEFCE8] text-[#854D0E] border-[#FEF08A] hover:bg-[#FEF9C3]'
                    : 'bg-white text-[#64748B] border-[#E6E8EC] hover:bg-[#F8FAFC]'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-[#854D0E] text-[#854D0E]' : ''}`} />
                <span>{isFlagged ? 'Flagged for review' : 'Flag for review'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#0E1B2A] hover:bg-[#F1F5F9] transition-colors"
                title="Skip this question for now"
              >
                <SkipForward className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>Skip for now</span>
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#0E1B2A] hover:bg-[#1C2E42] text-white shadow-xs transition-colors"
                >
                  <span>Review Answers</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#0E1B2A] hover:bg-[#1C2E42] text-white shadow-xs transition-colors"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Desktop Sticky Question Navigator Sidebar (300px) */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 bg-white border border-[#E6E8EC] rounded-2xl p-5 shadow-xs shrink-0 sticky top-20">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0E1B2A] flex items-center gap-2">
                <Grid className="w-4 h-4 text-[#C6A75E]" />
                <span>Question Navigator</span>
              </h3>
              <span className="text-xs font-medium text-[#64748B] tabular-nums">
                {attemptedCount} of {questions.length} answered
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((attemptedCount / Math.max(questions.length, 1)) * 100)}%`,
                }}
              />
            </div>

            {/* Subtle 4-State Legend (No bright red) */}
            <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-[#F1F5F9] text-xs font-medium text-[#64748B]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span>Answered ({attemptedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
                <span>Unanswered ({unattemptedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span>Flagged ({flagged.size})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0E1B2A]" />
                <span>Current (Q{currentIndex + 1})</span>
              </div>
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1 py-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const status = getQuestionStatus(q.id);
                const isFlag = flagged.has(q.id);

                let tileClass =
                  'bg-white text-[#64748B] border border-[#E6E8EC] hover:border-[#94A3B8] hover:bg-[#F8FAFC]';
                if (status === 'attempted') {
                  tileClass =
                    'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] hover:border-[#86EFAC]';
                } else if (status === 'skipped' || isFlag) {
                  tileClass =
                    'bg-[#FEFCE8] text-[#854D0E] border border-[#FEF08A] hover:border-[#FDE047]';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg font-sans tabular-nums text-xs font-semibold relative flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[#0E1B2A] text-white border border-[#0E1B2A] ring-2 ring-[#0E1B2A] ring-offset-2 scale-105 z-10 shadow-xs'
                        : tileClass
                    }`}
                    aria-label={`Go to question ${idx + 1}, status: ${status}${
                      isFlag ? ', flagged' : ''
                    }`}
                    title={`Question ${idx + 1} (${status.toUpperCase()}${
                      isFlag ? ', FLAGGED' : ''
                    })`}
                  >
                    {(idx + 1).toString().padStart(2, '0')}
                    {isFlag && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#F59E0B] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-3 px-4 rounded-xl bg-[#0E1B2A] hover:bg-[#1C2E42] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-[#C6A75E]" />
              <span>Review & Submit</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile Drawer Question Navigator */}
      {showMatrixDrawer && (
        <div className="fixed inset-0 bg-[#0E1B2A]/50 backdrop-blur-xs z-40 lg:hidden flex justify-end">
          <div className="w-80 max-w-[85vw] bg-white h-full p-5 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1F5F9]">
                <h3 className="text-sm font-bold text-[#0E1B2A] flex items-center gap-2">
                  <Grid className="w-4 h-4 text-[#C6A75E]" />
                  <span>Question Navigator</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMatrixDrawer(false)}
                  className="p-1 text-[#64748B] hover:text-[#0E1B2A] rounded-lg transition-colors"
                  aria-label="Close navigator"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round((attemptedCount / Math.max(questions.length, 1)) * 100)}%`,
                  }}
                />
              </div>

              {/* Status Legend */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-medium text-[#64748B]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span>Answered ({attemptedCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
                  <span>Unanswered ({unattemptedCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span>Flagged ({flagged.size})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0E1B2A]" />
                  <span>Current (Q{currentIndex + 1})</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto pr-1 py-1">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const status = getQuestionStatus(q.id);
                  const isFlag = flagged.has(q.id);

                  let tileClass =
                    'bg-white text-[#64748B] border border-[#E6E8EC] hover:border-[#94A3B8]';
                  if (status === 'attempted') {
                    tileClass =
                      'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]';
                  } else if (status === 'skipped' || isFlag) {
                    tileClass =
                      'bg-[#FEFCE8] text-[#854D0E] border border-[#FEF08A]';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowMatrixDrawer(false);
                      }}
                      className={`h-9 rounded-lg font-sans tabular-nums text-xs font-semibold relative flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-[#0E1B2A] text-white border border-[#0E1B2A] ring-2 ring-[#0E1B2A] ring-offset-1 z-10'
                          : tileClass
                      }`}
                    >
                      {(idx + 1).toString().padStart(2, '0')}
                      {isFlag && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#F59E0B] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowMatrixDrawer(false);
                setShowSubmitModal(true);
              }}
              className="w-full py-3 bg-[#0E1B2A] hover:bg-[#1C2E42] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs mt-4 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#C6A75E]" />
              <span>Review & Submit</span>
            </button>
          </div>
        </div>
      )}

      {/* Section Transition Interstitial Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-[#0E1B2A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-[#F1F5F9]">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  SECTION COMPLETED
                </span>
                <h3 className="text-base font-bold text-[#0E1B2A]">
                  {sections[activeSectionIndex]?.title} Complete
                </h3>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] text-xs space-y-2 font-sans">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Next Section:</span>
                <span className="font-semibold text-[#0E1B2A]">
                  {sections[activeSectionIndex + 1]?.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Questions:</span>
                <span className="font-semibold text-[#0E1B2A] tabular-nums">
                  {sections[activeSectionIndex + 1]?.questionCount} Items
                </span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Click proceed to advance into the next section. Your examination timer remains active.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleProceedNextSection}
                className="bg-[#0E1B2A] hover:bg-[#1C2E42] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
              >
                <span>Proceed to Next Section</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-[#0E1B2A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-4 border-b border-[#F1F5F9]">
              <div className="w-10 h-10 rounded-xl bg-[#0E1B2A] text-[#C6A75E] flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0E1B2A]">Ready to submit your test?</h3>
                <p className="text-xs text-[#64748B]">
                  Please review your attempt summary before final submission.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#F0FDF4] p-3 rounded-xl border border-[#BBF7D0]">
                <span className="text-[11px] text-[#166534] font-semibold block uppercase">
                  Attempted
                </span>
                <span className="text-xl font-bold text-[#166534] tabular-nums mt-0.5 block">
                  {attemptedCount}
                </span>
              </div>
              <div className="bg-[#FEFCE8] p-3 rounded-xl border border-[#FEF08A]">
                <span className="text-[11px] text-[#854D0E] font-semibold block uppercase">
                  Skipped / Flagged
                </span>
                <span className="text-xl font-bold text-[#854D0E] tabular-nums mt-0.5 block">
                  {skippedCount}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-600 font-semibold block uppercase">
                  Unattempted
                </span>
                <span className="text-xl font-bold text-slate-800 tabular-nums mt-0.5 block">
                  {unattemptedCount}
                </span>
              </div>
            </div>

            {unattemptedCount > 0 && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  You still have {unattemptedCount} unattempted question
                  {unattemptedCount > 1 ? 's' : ''}. You can return to answer them or submit now.
                </span>
              </div>
            )}

            <p className="text-xs text-[#64748B] leading-relaxed">
              Submitting will seal your answer sheet and compute your official examination evaluation score. Once submitted, answers cannot be modified.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                className="px-5 py-2.5 border border-[#D4D9DF] text-xs font-semibold rounded-xl text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
              >
                Return to Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="bg-[#0E1B2A] hover:bg-[#1C2E42] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Finalizing Test...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C6A75E]" />
                    <span>Confirm & Finalize Test</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamRunnerPage;
