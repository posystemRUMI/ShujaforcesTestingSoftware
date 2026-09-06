import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Flag, ChevronLeft, ChevronRight, CheckCircle2, Shield, AlertTriangle, Layers, Grid, X, Save, RefreshCw } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers';
import { attemptService } from '@/services/attemptService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { mockQuestions } from '@/lib/mock-data';

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
}

export const ExamRunnerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const { user } = useAuth();

  // Questions and Sections state (Safe payload - NEVER contains correctOptionId)
  const [questions, setQuestions] = useState<SafeQuestion[]>([]);
  const [sections, setSections] = useState<SectionMeta[]>([]);
  const [testTitle, setTestTitle] = useState('Preliminary Computerized Screening Examination');
  const [loading, setLoading] = useState(true);

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

  const [secondsRemaining, setSecondsRemaining] = useState(3900); // 65 min default

  // UI state
  const [autosaveStatus, setAutosaveStatus] = useState<'SAVED' | 'SAVING'>('SAVED');
  const [showMatrixDrawer, setShowMatrixDrawer] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Fallback to offline mock dataset (stripped of all answer keys)
  const loadOfflineFallback = useCallback(() => {
    const stripped: SafeQuestion[] = mockQuestions.map((q) => ({
      id: q.id,
      code: q.code,
      subject: q.subject,
      stem: q.stem,
      imageUrl: q.imageUrl,
      options: q.options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        text: opt.text,
        imageUrl: opt.imageUrl,
      })),
    }));

    setQuestions(stripped);
    setSections([
      { id: 'sec-1', title: 'Verbal Intelligence', startIndex: 0, endIndex: 1, questionCount: 2 },
      { id: 'sec-2', title: 'Non-Verbal Intelligence', startIndex: 2, endIndex: 3, questionCount: 2 },
      { id: 'sec-3', title: 'Academic Mathematics', startIndex: 4, endIndex: stripped.length - 1, questionCount: Math.max(0, stripped.length - 4) },
    ]);
    setTestTitle('154 PMA Long Course Initial Test (Offline)');
  }, []);

  // Fetch Safe Exam Payload from Supabase or load fallback
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
            });

            offset += secQs.length;
            qList = qList.concat(secQs);
          }

          if (qList.length > 0) {
            setQuestions(qList);
            setSections(secList);
            setTestTitle(payload.test.name);

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

            // Sync chronometer with server expiry
            if (payload.attempt.expires_at) {
              const expiresMs = new Date(payload.attempt.expires_at).getTime();
              const serverMs = payload.server_time ? new Date(payload.server_time).getTime() : Date.now();
              const remainingSecs = Math.max(0, Math.floor((expiresMs - serverMs) / 1000));
              setSecondsRemaining(remainingSecs);
            }
          } else {
            loadOfflineFallback();
          }
        } catch (err: any) {
          console.warn('Failed to load safe exam payload from Supabase, loading fallback:', err);
          loadOfflineFallback();
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        loadOfflineFallback();
        if (isMounted) setLoading(false);
      }
    }

    initializeExam();

    return () => {
      isMounted = false;
    };
  }, [attemptId, loadOfflineFallback]);

  // Local storage caching
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          answers,
          flagged: Array.from(flagged),
          secondsRemaining,
          currentIndex,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      /* ignore */
    }
  }, [answers, flagged, secondsRemaining, currentIndex]);

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

  // Chronometer countdown
  useEffect(() => {
    if (loading) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.warning('Timer expired! Submitting examination automatically.');
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading]);

  const currentQ = questions[currentIndex] || questions[0];
  const isFlagged = currentQ ? flagged.has(currentQ.id) : false;
  const selectedOptionId = currentQ ? answers[currentQ.id] : undefined;

  // Handle Option Selection with Instant Server Autosave
  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (!currentQ) return;

      setAnswers((prev) => ({
        ...prev,
        [currentQ.id]: optionId,
      }));

      if (attemptId && isSupabaseConfigured()) {
        setAutosaveStatus('SAVING');
        attemptService
          .saveAnswer(attemptId, currentQ.id, optionId, flagged.has(currentQ.id))
          .then(() => setAutosaveStatus('SAVED'))
          .catch((err) => {
            console.warn('Server autosave error:', err);
            setAutosaveStatus('SAVED');
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
          .catch((err) => console.warn('Server flag sync error:', err));
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

  const handleProceedNextSection = () => {
    setShowSectionModal(false);
    setActiveSectionIndex((prev) => prev + 1);
    setCurrentIndex((prev) => prev + 1);
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
        // Fallback for offline mock testing
        const attemptSnapshot = {
          attemptId: attemptId || `ATT-${Date.now().toString(36).toUpperCase()}`,
          testId: 'tst-01',
          answers,
          flagged: Array.from(flagged),
          timeSpentSeconds: 3900 - secondsRemaining,
          submittedAt: new Date().toISOString(),
        };
        localStorage.setItem('FA_SUBMITTED_EXAM_ATTEMPT_V1', JSON.stringify(attemptSnapshot));
        localStorage.removeItem(STORAGE_KEY);
        navigate('/exam/finish');
      }
    } catch (err: any) {
      console.error('Final submission error:', err);
      toast.error(err.message || 'Error submitting test attempt. Please notify proctor immediately.');
      setSubmitting(false);
    }
  };

  // Keyboard shortcut listeners (1-4, Arrow Keys, M for Mark)
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQ, handleSelectOption, handleNext, handlePrev, toggleFlag, showSubmitModal, showSectionModal]);

  // Active section lookup
  const currentSection =
    sections.find((s) => currentIndex >= s.startIndex && currentIndex <= s.endIndex) ||
    sections[0] || { title: 'General Examination' };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);
  const flaggedCount = flagged.size;

  const isDangerTime = secondsRemaining < 60;
  const isWarningTime = secondsRemaining < 300 && !isDangerTime;

  if (loading || questions.length === 0) {
    return (
      <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#0E1B2A] animate-spin" />
        <span className="text-xs font-mono font-bold text-[#64748B] uppercase tracking-wider">
          Securing CBT Terminal & Authorizing Examination Docket...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F8FA] text-[#1F2937] select-none">
      {/* Locked Telemetry Header Bar (Fixed 56px) */}
      <header className="h-14 bg-[#0E1B2A] text-white px-4 lg:px-6 flex items-center justify-between border-b border-[#1C2E42] sticky top-0 z-30 shadow-md">
        {/* Left Identity Docket */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-[#C6A75E] text-[#0E1B2A] flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>{testTitle}</span>
            </h1>
            <p className="text-[10px] text-[#A0AEC0] font-mono hidden sm:block">
              CADET: {user?.name || 'Hamza Tariq'} ({user?.rollNumber || 'PMA-2601'}) | TERMINAL: WS-CBT-01
            </p>
          </div>
        </div>

        {/* Center Section Telemetry */}
        <div className="hidden md:flex items-center space-x-2 bg-[#1C2E42] px-3 py-1 rounded text-xs font-mono border border-[#2E425A]">
          <Layers className="w-3.5 h-3.5 text-[#C6A75E]" />
          <span className="text-[#A0AEC0]">SECTION:</span>
          <span className="font-bold text-white uppercase">{currentSection.title}</span>
        </div>

        {/* Right Chronometer & Mobile Palette Toggle */}
        <div className="flex items-center space-x-3">
          {/* Autosave Pill */}
          <div className="hidden sm:flex items-center space-x-1 text-[11px] font-mono text-[#A0AEC0]">
            <Save className="w-3 h-3 text-[#88BE9B]" />
            <span>{autosaveStatus === 'SAVING' ? 'Saving...' : 'Saved'}</span>
          </div>

          {/* Chronometer */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded font-mono text-xs font-bold border transition-colors ${
              isDangerTime
                ? 'bg-[#782525] text-white border-red-500 animate-pulse'
                : isWarningTime
                ? 'bg-[#FDF7EC] text-[#7A5312] border-[#DEC088]'
                : 'bg-[#1C2E42] text-[#C6A75E] border-[#2E425A]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="tracking-wider">{formatTime(secondsRemaining)}</span>
          </div>

          {/* Mobile Question Palette Toggle */}
          <button
            type="button"
            onClick={() => setShowMatrixDrawer(!showMatrixDrawer)}
            className="lg:hidden p-1.5 bg-[#1C2E42] hover:bg-[#253950] text-[#C6A75E] rounded border border-[#2E425A] flex items-center gap-1 text-xs font-mono font-bold"
          >
            <Grid className="w-4 h-4" />
            <span>
              {answeredCount}/{questions.length}
            </span>
          </button>
        </div>
      </header>

      {/* Main Examination Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex gap-6 overflow-hidden">
        {/* Primary Distraction-Free Reading Pane */}
        <main className="flex-1 bg-white border border-[#D4D9DF] rounded-md p-5 sm:p-7 shadow-sm flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Top Question Toolbar */}
            <div className="flex flex-wrap items-center justify-between border-b border-[#E2E6EB] pb-3 mb-5 gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 font-mono text-xs font-bold bg-[#0E1B2A] text-white rounded">
                  Q {currentIndex + 1} / {questions.length}
                </span>
                <span className="text-xs text-[#64748B] font-mono">[{currentQ.code}]</span>
                <span className="text-xs font-mono text-[#234E35] bg-[#EDF6F0] px-2 py-0.5 rounded border border-[#88BE9B] hidden sm:inline-block">
                  {currentQ.subject.replace('INTELLIGENCE_', '').replace('ACADEMIC_', '')}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={toggleFlag}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
                    isFlagged
                      ? 'bg-[#FDF7EC] text-[#7A5312] border-[#DEC088] shadow-xs'
                      : 'bg-[#F6F8FA] text-[#64748B] border-[#D4D9DF] hover:bg-[#EDF1F5]'
                  }`}
                >
                  <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-[#7A5312]' : ''}`} />
                  <span>{isFlagged ? 'Flagged for Review' : 'Mark for Review'}</span>
                </button>
              </div>
            </div>

            {/* Question Stem */}
            <div className="mb-6 max-w-2xl">
              <h2 className="text-base sm:text-lg font-semibold text-[#0E1B2A] leading-relaxed">
                {currentQ.stem}
              </h2>

              {currentQ.imageUrl && (
                <div className="mt-4 p-2 border border-[#D4D9DF] rounded bg-[#F6F8FA] max-w-md">
                  <img
                    src={currentQ.imageUrl}
                    alt="Question Diagram"
                    className="max-h-56 w-auto object-contain rounded"
                  />
                  <span className="text-[10px] font-mono text-[#64748B] block mt-1">Figure 1.0 — Refer to diagram for solution</span>
                </div>
              )}
            </div>

            {/* 4-Option Selection Matrix */}
            <div className="space-y-3 max-w-2xl role-radiogroup" aria-label="Multiple Choice Options">
              {currentQ.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-4 rounded-md border transition-all flex items-center space-x-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0E1B2A] ${
                      isSelected
                        ? 'bg-[#EDF6F0] border-[#234E35] text-[#234E35] shadow-xs font-semibold'
                        : 'bg-[#FFFFFF] border-[#D4D9DF] text-[#1F2937] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs font-mono transition-colors border ${
                        isSelected
                          ? 'bg-[#234E35] text-white border-[#234E35]'
                          : 'bg-[#F6F8FA] border-[#D4D9DF] text-[#0E1B2A]'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <div className="flex-1">
                      <span className="text-xs sm:text-sm leading-relaxed block">{opt.text}</span>
                      {opt.imageUrl && (
                        <img src={opt.imageUrl} alt={`Option ${opt.label}`} className="mt-2 max-h-24 w-auto rounded border" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="border-t border-[#E2E6EB] pt-4 mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded border border-[#D4D9DF] text-[#0E1B2A] hover:bg-[#EDF1F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="text-xs font-mono text-[#64748B] hidden sm:block">
              Progress: <span className="font-bold text-[#0E1B2A]">{answeredCount}</span>/{questions.length} Answered
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold uppercase rounded bg-[#234E35] text-white hover:bg-[#1E432E] shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Review & Submit</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="inline-flex items-center space-x-1.5 px-5 py-2 text-xs font-bold rounded bg-[#0E1B2A] text-white hover:bg-[#1C2E42] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        {/* Desktop Persistent Question Palette Matrix Drawer (300px) */}
        <aside className="hidden lg:flex w-72 bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm flex-col justify-between flex-shrink-0">
          <div>
            <div className="border-b border-[#E2E6EB] pb-3 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5" />
                <span>Question Matrix</span>
              </h3>

              {/* Status Tile Legend */}
              <div className="grid grid-cols-2 gap-1.5 mt-3 text-[10px] font-mono">
                <div className="flex items-center space-x-1.5 bg-[#EDF6F0] p-1 rounded border border-[#88BE9B] text-[#234E35]">
                  <span className="w-2 h-2 rounded-xs bg-[#234E35]" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-[#FDF7EC] p-1 rounded border border-[#DEC088] text-[#7A5312]">
                  <span className="w-2 h-2 rounded-xs bg-[#C6A75E]" />
                  <span>Flagged ({flaggedCount})</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-[#F6F8FA] p-1 rounded border border-[#E2E6EB] text-[#64748B]">
                  <span className="w-2 h-2 rounded-xs bg-[#E2E6EB]" />
                  <span>Pending ({unansweredCount})</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-[#0E1B2A] p-1 rounded text-white">
                  <span className="w-2 h-2 rounded-xs bg-[#C6A75E]" />
                  <span>Current</span>
                </div>
              </div>
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-5 gap-1.5 max-h-[420px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const hasAnswer = !!answers[q.id];
                const isFlag = flagged.has(q.id);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-8 rounded-xs font-mono text-xs font-bold transition-all relative ${
                      isCurrent ? 'ring-2 ring-[#0E1B2A] ring-offset-1 z-10' : ''
                    } ${
                      isFlag
                        ? 'bg-[#FDF7EC] text-[#7A5312] border border-[#DEC088]'
                        : hasAnswer
                        ? 'bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B]'
                        : 'bg-[#F6F8FA] text-[#64748B] border border-[#E2E6EB] hover:bg-[#EDF1F5]'
                    }`}
                  >
                    {(idx + 1).toString().padStart(2, '0')}
                    {isFlag && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#C6A75E] rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E6EB]">
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 bg-[#234E35] text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1E432E] transition-colors shadow-xs"
            >
              Final Test Submission
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile Drawer Question Palette */}
      {showMatrixDrawer && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden flex justify-end">
          <div className="w-80 bg-white h-full p-5 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase text-[#0E1B2A]">Question Palette</h3>
                <button type="button" onClick={() => setShowMatrixDrawer(false)} className="p-1 text-[#64748B]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const hasAnswer = !!answers[q.id];
                  const isFlag = flagged.has(q.id);

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowMatrixDrawer(false);
                      }}
                      className={`h-9 rounded font-mono text-xs font-bold ${
                        isCurrent ? 'ring-2 ring-[#0E1B2A]' : ''
                      } ${
                        isFlag
                          ? 'bg-[#FDF7EC] text-[#7A5312] border border-[#DEC088]'
                          : hasAnswer
                          ? 'bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B]'
                          : 'bg-[#F6F8FA] text-[#64748B] border border-[#E2E6EB]'
                      }`}
                    >
                      {idx + 1}
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
              className="w-full py-3 bg-[#234E35] text-white rounded text-xs font-bold uppercase"
            >
              Submit Examination
            </button>
          </div>
        </div>
      )}

      {/* Section Transition Interstitial Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-[#0E1B2A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0E1B2A] rounded-md p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-[#234E35] border-b border-[#E2E6EB] pb-3">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#64748B]">SECTION COMPLETED</span>
                <h3 className="text-base font-bold text-[#0E1B2A]">
                  {sections[activeSectionIndex]?.title} Complete
                </h3>
              </div>
            </div>

            <div className="bg-[#F6F8FA] p-3 rounded border border-[#E2E6EB] text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Next Section:</span>
                <span className="font-bold text-[#0E1B2A]">{sections[activeSectionIndex + 1]?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Questions:</span>
                <span className="font-bold text-[#0E1B2A]">{sections[activeSectionIndex + 1]?.questionCount} Items</span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Click continue to proceed directly into the next section. Timer remains active.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleProceedNextSection}
                className="bg-[#0E1B2A] text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1C2E42]"
              >
                Proceed to Next Section &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-[#0E1B2A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0E1B2A] rounded-md p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 border-b border-[#E2E6EB] pb-3">
              <AlertTriangle className="w-6 h-6 text-[#C6A75E]" />
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#C6A75E]">FINAL CONFIRMATION</span>
                <h3 className="text-lg font-bold text-[#0E1B2A]">Submit Computerized Test?</h3>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-[#F6F8FA] p-3 rounded border border-[#E2E6EB] text-center text-xs font-mono">
              <div className="bg-white p-2 rounded border">
                <span className="text-[10px] text-[#64748B] block">ANSWERED</span>
                <span className="text-lg font-bold text-[#234E35]">{answeredCount}</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="text-[10px] text-[#64748B] block">UNANSWERED</span>
                <span className="text-lg font-bold text-[#782525]">{unansweredCount}</span>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="text-[10px] text-[#64748B] block">FLAGGED</span>
                <span className="text-lg font-bold text-[#7A5312]">{flaggedCount}</span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Submitting will seal your answer sheet and calculate your official evaluation score. You will not be able to modify answers after submission.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-[#E2E6EB]">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-[#D4D9DF] text-xs font-semibold rounded text-[#64748B] hover:bg-[#EDF1F5]"
              >
                Return to Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="bg-[#234E35] text-white px-5 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1E432E] disabled:opacity-50"
              >
                {submitting ? 'Finalizing...' : 'Confirm & Finalize Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamRunnerPage;
