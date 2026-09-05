import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockQuestions } from '@/lib/mock-data';
import { Clock, Flag, ChevronLeft, ChevronRight, CheckCircle2, Shield, AlertTriangle, Layers, Grid, X, Save } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers';

const STORAGE_KEY = 'FA_ACTIVE_EXAM_STATE_V1';

export const ExamRunnerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active state
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
      if (saved && parsedHasFlags(saved)) {
        return new Set(JSON.parse(saved).flagged || []);
      }
    } catch (e) {
      /* ignore */
    }
    return new Set();
  });

  function parsedHasFlags(savedStr: string): boolean {
    const parsed = JSON.parse(savedStr);
    return Array.isArray(parsed.flagged);
  }

  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.secondsRemaining === 'number' && parsed.secondsRemaining > 0) {
          return parsed.secondsRemaining;
        }
      }
    } catch (e) {
      /* ignore */
    }
    return 3900; // 65 minutes
  });

  // UI state
  const [autosaveStatus, setAutosaveStatus] = useState<'SAVED' | 'SAVING'>('SAVED');
  const [showMatrixDrawer, setShowMatrixDrawer] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  const sections = [
    { title: 'Verbal Intelligence', startIndex: 0, endIndex: 1, questionCount: 2 },
    { title: 'Non-Verbal Intelligence', startIndex: 2, endIndex: 3, questionCount: 2 },
    { title: 'Academic Mathematics', startIndex: 4, endIndex: mockQuestions.length - 1, questionCount: mockQuestions.length - 4 },
  ];

  // Autosave persistence
  useEffect(() => {
    setAutosaveStatus('SAVING');
    const timeout = setTimeout(() => {
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
      setAutosaveStatus('SAVED');
    }, 300);

    return () => clearTimeout(timeout);
  }, [answers, flagged, secondsRemaining, currentIndex]);

  // Chronometer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.warning('Timer expired! Submitting test automatically.');
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentQ = mockQuestions[currentIndex] || mockQuestions[0];
  const isFlagged = flagged.has(currentQ.id);
  const selectedOptionId = answers[currentQ.id];

  const handleSelectOption = useCallback(
    (optionId: string) => {
      setAnswers((prev) => ({
        ...prev,
        [currentQ.id]: optionId,
      }));
    },
    [currentQ.id]
  );

  const toggleFlag = useCallback(() => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) {
        next.delete(currentQ.id);
        toast.info('Question unflagged');
      } else {
        next.add(currentQ.id);
        toast.info('Question flagged for review');
      }
      return next;
    });
  }, [currentQ.id]);

  const handleNext = useCallback(() => {
    // Check if moving across section boundary
    const currentSec = sections[activeSectionIndex];
    if (currentSec && currentIndex === currentSec.endIndex && activeSectionIndex < sections.length - 1) {
      setShowSectionModal(true);
      return;
    }

    if (currentIndex < mockQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, activeSectionIndex, sections]);

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

  const handleFinalSubmit = () => {
    try {
      const attemptSnapshot = {
        attemptId: `ATT-${Date.now().toString(36).toUpperCase()}`,
        testId: 'tst-01',
        answers,
        flagged: Array.from(flagged),
        timeSpentSeconds: 3900 - secondsRemaining,
        submittedAt: new Date().toISOString(),
      };
      localStorage.setItem('FA_SUBMITTED_EXAM_ATTEMPT_V1', JSON.stringify(attemptSnapshot));
    } catch (e) {
      /* ignore */
    }
    localStorage.removeItem(STORAGE_KEY);
    navigate('/exam/finish');
  };

  // Keyboard shortcut listeners (1-4, Arrow Keys, M for Mark)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing when input or modal active
      if (showSubmitModal || showSectionModal) return;

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

  // Section calculation based on index
  const currentSection = sections.find(
    (s) => currentIndex >= s.startIndex && currentIndex <= s.endIndex
  ) || sections[0];

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = mockQuestions.length - answeredCount;
  const flaggedCount = flagged.size;

  // Chronometer style threshold
  const isDangerTime = secondsRemaining < 60;
  const isWarningTime = secondsRemaining < 300 && !isDangerTime;

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
              <span>154 PMA Long Course Initial Test</span>
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
            <span>{answeredCount}/{mockQuestions.length}</span>
          </button>
        </div>
      </header>

      {/* Main Examination Layout Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex gap-6 overflow-hidden">
        {/* Primary Distraction-Free Reading Pane (Max width 860px) */}
        <main className="flex-1 bg-white border border-[#D4D9DF] rounded-md p-5 sm:p-7 shadow-sm flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Top Question Toolbar */}
            <div className="flex flex-wrap items-center justify-between border-b border-[#E2E6EB] pb-3 mb-5 gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 font-mono text-xs font-bold bg-[#0E1B2A] text-white rounded">
                  Q {currentIndex + 1} / {mockQuestions.length}
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

            {/* Question Stem (Inter 16px, max line width <= 68 chars for reading stamina) */}
            <div className="mb-6 max-w-2xl">
              <h2 className="text-base sm:text-lg font-semibold text-[#0E1B2A] leading-relaxed">
                {currentQ.stem}
              </h2>

              {/* Optional Question Image rendering */}
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

          {/* Bottom Sticky Action Bar */}
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
              Progress: <span className="font-bold text-[#0E1B2A]">{answeredCount}</span>/{mockQuestions.length} Answered
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
                disabled={currentIndex === mockQuestions.length - 1}
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

            {/* 40-Cell Question Grid */}
            <div className="grid grid-cols-5 gap-1.5 max-h-[420px] overflow-y-auto pr-1">
              {mockQuestions.map((q, idx) => {
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
                {mockQuestions.map((q, idx) => {
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

      {/* Section Transition Interstitial Modal (Phase 20) */}
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

      {/* Submission Confirmation Modal (Phase 22) */}
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
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-[#D4D9DF] text-xs font-semibold rounded text-[#64748B] hover:bg-[#EDF1F5]"
              >
                Return to Test
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="bg-[#234E35] text-white px-5 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1E432E]"
              >
                Confirm & Finalize Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamRunnerPage;
