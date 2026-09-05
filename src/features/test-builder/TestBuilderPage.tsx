import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '@/lib/mock-service';
import { TestBlueprint, TestSection, Question, SubjectCategory, MilitaryBranch } from '@/types';
import { ChevronRight, Shield, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export const TestBuilderPage: React.FC = () => {
  const navigate = useNavigate();

  // Step state (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1 State: Details & Cadre
  const [title, setTitle] = useState('154 PMA Long Course Computerized Screening Exam');
  const [code, setCode] = useState(`TEST-PMA-${Math.floor(100 + Math.random() * 900)}`);
  const [branch, setBranch] = useState<MilitaryBranch>('PAKISTAN_ARMY');
  const [courseTarget, setCourseTarget] = useState('154 PMA Long Course');
  const [passingScorePercent, setPassingScorePercent] = useState<number>(60);

  // Step 2 State: Module Sections
  const [sections, setSections] = useState<TestSection[]>([
    { id: 'sec-1', title: 'Verbal Intelligence', subject: 'INTELLIGENCE_VERBAL', questionCount: 20, timeLimitMinutes: 25 },
    { id: 'sec-2', title: 'Non-Verbal Intelligence', subject: 'INTELLIGENCE_NON_VERBAL', questionCount: 15, timeLimitMinutes: 20 },
    { id: 'sec-3', title: 'Academic Mathematics', subject: 'ACADEMIC_MATH', questionCount: 10, timeLimitMinutes: 20 },
  ]);

  // Step 3 State: Question Assembly (Manual vs Automatic)
  const [assemblyMode, setAssemblyMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  // Step 4 State: Timing & Rules
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [sectionLock, setSectionLock] = useState(true);

  // Step 5 State: Publishing
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    async function loadBank() {
      const qList = await mockService.getQuestions();
      setAllQuestions(qList);
    }
    loadBank();
  }, []);

  // Section Handlers
  const handleAddSection = (presetTitle?: string, presetSubject?: SubjectCategory) => {
    const newSec: TestSection = {
      id: `sec-${Date.now()}`,
      title: presetTitle || 'New Evaluation Section',
      subject: presetSubject || 'INTELLIGENCE_VERBAL',
      questionCount: 15,
      timeLimitMinutes: 15,
    };
    setSections([...sections, newSec]);
  };

  const handleRemoveSection = (id: string) => {
    if (sections.length <= 1) {
      toast.error('Test blueprint must contain at least one section.');
      return;
    }
    setSections(sections.filter((s) => s.id !== id));
  };

  const handleUpdateSection = (id: string, field: keyof TestSection, value: any) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  // Calculations
  const totalQuestions = sections.reduce((acc, s) => acc + Number(s.questionCount), 0);
  const totalDurationMinutes = sections.reduce((acc, s) => acc + Number(s.timeLimitMinutes), 0);

  // Auto Selection Generator
  const handleAutoGenerate = () => {
    const autoSet = new Set<string>();
    allQuestions.forEach((q) => {
      if (autoSet.size < totalQuestions) {
        autoSet.add(q.id);
      }
    });
    setSelectedQuestionIds(autoSet);
    toast.success(`Auto-generated question allocation (${autoSet.size} items assigned).`);
  };

  // Step Navigation Validation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!title.trim() || !courseTarget.trim()) {
        toast.error('Please complete test title and target course.');
        return;
      }
    } else if (currentStep === 2) {
      if (sections.some((s) => !s.title.trim() || s.questionCount <= 0 || s.timeLimitMinutes <= 0)) {
        toast.error('Please complete valid parameters for all sections.');
        return;
      }
    } else if (currentStep === 3) {
      if (selectedQuestionIds.size === 0) {
        handleAutoGenerate();
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePublish = async () => {
    setPublishing(true);
    const newBlueprint: TestBlueprint = {
      id: `test-${Date.now()}`,
      code,
      title,
      branch,
      courseTarget,
      totalQuestions,
      durationMinutes: totalDurationMinutes,
      passingScorePercent,
      negativeMarking,
      shuffleQuestions,
      shuffleOptions,
      status: 'ACTIVE',
      sections,
    };

    // Add test to mock service
    const tests = await mockService.getTests();
    tests.unshift(newBlueprint);

    setPublishing(false);
    toast.success('Test blueprint compiled and published to CBT terminals!');
    navigate('/admin/tests');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-md border border-[#D4D9DF] shadow-sm">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#C6A75E] uppercase tracking-wider">
            FIVE-STAGE EXAMINATION ASSEMBLY ENGINE
          </span>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#0E1B2A] mt-0.5">
            Test Blueprint Builder
          </h1>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] px-3 py-1 rounded font-bold">
            STAGE {currentStep} OF 5
          </span>
        </div>
      </div>

      {/* 5-Step Stepper Bar */}
      <div className="bg-white border border-[#D4D9DF] rounded-md p-3 shadow-xs">
        <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
          {[
            { step: 1, label: '1. Details' },
            { step: 2, label: '2. Sections' },
            { step: 3, label: '3. Assembly' },
            { step: 4, label: '4. Rules' },
            { step: 5, label: '5. Publish' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setCurrentStep(item.step)}
              className={`py-2 rounded font-bold transition-colors ${
                currentStep === item.step
                  ? 'bg-[#0E1B2A] text-white shadow-xs'
                  : currentStep > item.step
                  ? 'bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B]'
                  : 'bg-[#F6F8FA] text-[#64748B] border border-[#E2E6EB]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Wizard Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: Details & Cadre */}
          {currentStep === 1 && (
            <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider border-b border-[#E2E6EB] pb-2">
                Stage 1 — Test Blueprint Identity & Cadre
              </h2>

              <div className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase">Test Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase">Blueprint Code</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase">Target Force</label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value as MilitaryBranch)}
                      className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold focus:outline-none"
                    >
                      <option value="PAKISTAN_ARMY">Pakistan Army</option>
                      <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option>
                      <option value="PAKISTAN_NAVY">Pakistan Navy</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase">Course Target</label>
                    <input
                      type="text"
                      value={courseTarget}
                      onChange={(e) => setCourseTarget(e.target.value)}
                      className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase">Passing Cutoff %</label>
                    <input
                      type="number"
                      value={passingScorePercent}
                      onChange={(e) => setPassingScorePercent(Number(e.target.value))}
                      className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Module Sections */}
          {currentStep === 2 && (
            <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-2">
                <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider">
                  Stage 2 — Test Sections & Time Limits
                </h2>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleAddSection('Personality Battery', 'INTELLIGENCE_NON_VERBAL')}
                    className="px-2.5 py-1 text-[11px] font-mono bg-[#EDF1F5] text-[#0E1B2A] rounded border hover:bg-[#E2E6EB]"
                  >
                    + Add Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSection()}
                    className="px-2.5 py-1 text-[11px] font-mono bg-[#0E1B2A] text-white rounded font-bold"
                  >
                    + Custom Section
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {sections.map((sec, idx) => (
                  <div key={sec.id} className="p-4 bg-[#F6F8FA] border border-[#D4D9DF] rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#0E1B2A]">
                        SECTION {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(sec.id)}
                        className="text-xs text-red-600 hover:underline flex items-center gap-1 font-mono"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div>
                        <label className="block text-[10px] text-[#64748B] mb-0.5">Section Title</label>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => handleUpdateSection(sec.id, 'title', e.target.value)}
                          className="w-full bg-white border border-[#D4D9DF] rounded px-3 py-1.5 text-[#0E1B2A] font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#64748B] mb-0.5">Subject Classification</label>
                        <select
                          value={sec.subject}
                          onChange={(e) => handleUpdateSection(sec.id, 'subject', e.target.value as SubjectCategory)}
                          className="w-full bg-white border border-[#D4D9DF] rounded px-2 py-1.5 text-[#0E1B2A] font-bold"
                        >
                          <option value="INTELLIGENCE_VERBAL">Intelligence (Verbal)</option>
                          <option value="INTELLIGENCE_NON_VERBAL">Intelligence (Non-Verbal)</option>
                          <option value="ACADEMIC_PHYSICS">Academic Physics</option>
                          <option value="ACADEMIC_MATH">Academic Mathematics</option>
                          <option value="ACADEMIC_ENGLISH">Academic English</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-[#64748B] mb-0.5">Questions</label>
                          <input
                            type="number"
                            value={sec.questionCount}
                            onChange={(e) => handleUpdateSection(sec.id, 'questionCount', Number(e.target.value))}
                            className="w-full bg-white border border-[#D4D9DF] rounded px-2 py-1.5 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#64748B] mb-0.5">Time (Mins)</label>
                          <input
                            type="number"
                            value={sec.timeLimitMinutes}
                            onChange={(e) => handleUpdateSection(sec.id, 'timeLimitMinutes', Number(e.target.value))}
                            className="w-full bg-white border border-[#D4D9DF] rounded px-2 py-1.5 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Question Assembly */}
          {currentStep === 3 && (
            <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-2">
                <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider">
                  Stage 3 — Question Allocation & Assembly
                </h2>

                <div className="flex space-x-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setAssemblyMode('AUTO');
                      handleAutoGenerate();
                    }}
                    className={`px-3 py-1 rounded font-bold ${
                      assemblyMode === 'AUTO' ? 'bg-[#0E1B2A] text-white' : 'bg-[#EDF1F5] text-[#0E1B2A]'
                    }`}
                  >
                    Automatic Allocation
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssemblyMode('MANUAL')}
                    className={`px-3 py-1 rounded font-bold ${
                      assemblyMode === 'MANUAL' ? 'bg-[#0E1B2A] text-white' : 'bg-[#EDF1F5] text-[#0E1B2A]'
                    }`}
                  >
                    Manual Selection
                  </button>
                </div>
              </div>

              {assemblyMode === 'AUTO' ? (
                <div className="bg-[#EDF6F0] border border-[#88BE9B] p-4 rounded-md text-xs space-y-3">
                  <div className="flex items-center space-x-2 text-[#234E35] font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>AUTOMATIC ALGORITHM ALLOCATION ENGINE</span>
                  </div>
                  <p className="text-[#1F2937] leading-relaxed">
                    Questions have been auto-assigned matching subject classifications and target force rules across all {sections.length} sections.
                  </p>
                  <button
                    type="button"
                    onClick={handleAutoGenerate}
                    className="px-3 py-1.5 bg-[#234E35] text-white rounded text-xs font-bold font-mono"
                  >
                    Regenerate Random Selection
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <span className="font-mono text-[#64748B] block">Select questions from bank to allocate to blueprint:</span>
                  <div className="max-h-64 overflow-y-auto space-y-2 border p-3 rounded">
                    {allQuestions.map((q) => {
                      const isChecked = selectedQuestionIds.has(q.id);
                      return (
                        <div key={q.id} className="flex items-center space-x-3 p-2 bg-[#F6F8FA] rounded border">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const next = new Set(selectedQuestionIds);
                              if (next.has(q.id)) next.delete(q.id);
                              else next.add(q.id);
                              setSelectedQuestionIds(next);
                            }}
                          />
                          <span className="font-mono font-bold text-[#0E1B2A]">{q.code}</span>
                          <span className="flex-1 truncate">{q.stem}</span>
                          <span className="font-mono text-[10px] text-[#64748B]">{q.subject}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Timing & Rules */}
          {currentStep === 4 && (
            <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider border-b border-[#E2E6EB] pb-2">
                Stage 4 — Timing & Exam Execution Rules
              </h2>

              <div className="space-y-4 text-xs">
                <label className="flex items-center justify-between p-3.5 bg-[#F6F8FA] border rounded cursor-pointer">
                  <div>
                    <span className="font-bold text-[#0E1B2A] block">Question Sequence Shuffling</span>
                    <span className="text-[#64748B]">Randomize question order for each candidate terminal</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 text-[#0E1B2A]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-[#F6F8FA] border rounded cursor-pointer">
                  <div>
                    <span className="font-bold text-[#0E1B2A] block">Option Choice Shuffling</span>
                    <span className="text-[#64748B]">Randomize A/B/C/D option order per question</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="w-4 h-4 text-[#0E1B2A]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-[#F6F8FA] border rounded cursor-pointer">
                  <div>
                    <span className="font-bold text-[#0E1B2A] block">Section Lock Behavior</span>
                    <span className="text-[#64748B]">Lock section navigation once section timer expires</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sectionLock}
                    onChange={(e) => setSectionLock(e.target.checked)}
                    className="w-4 h-4 text-[#0E1B2A]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-[#F6F8FA] border rounded cursor-pointer">
                  <div>
                    <span className="font-bold text-[#0E1B2A] block">Negative Marking Penalty</span>
                    <span className="text-[#64748B]">Deduct 0.25 marks for incorrect responses</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={negativeMarking}
                    onChange={(e) => setNegativeMarking(e.target.checked)}
                    className="w-4 h-4 text-[#0E1B2A]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Publish */}
          {currentStep === 5 && (
            <div className="bg-white border-2 border-[#0E1B2A] rounded-md p-6 shadow-md space-y-5">
              <div className="border-b border-[#E2E6EB] pb-3">
                <span className="text-[10px] font-mono font-bold text-[#C6A75E] uppercase tracking-wider">
                  FINAL STAGE REVIEW
                </span>
                <h2 className="text-lg font-bold text-[#0E1B2A]">Review & Publish Test Blueprint</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-[#F6F8FA] p-4 rounded border">
                <div>
                  <span className="text-[#64748B] block text-[10px]">TEST TITLE</span>
                  <span className="font-bold text-[#0E1B2A]">{title}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">BLUEPRINT CODE</span>
                  <span className="font-bold text-[#0E1B2A]">{code}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">TOTAL ITEMS</span>
                  <span className="font-bold text-[#0E1B2A]">{totalQuestions} Questions</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">CUMULATIVE DURATION</span>
                  <span className="font-bold text-[#0E1B2A]">{totalDurationMinutes} Minutes</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="bg-[#234E35] text-white px-6 py-3 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1E432E] shadow-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Test Blueprint</span>
                </button>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#D4D9DF]">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 text-xs font-bold border border-[#D4D9DF] rounded text-[#0E1B2A] hover:bg-[#EDF1F5] disabled:opacity-40"
            >
              Back
            </button>

            {currentStep < 5 && (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 text-xs font-bold bg-[#0E1B2A] text-white rounded hover:bg-[#1C2E42] flex items-center gap-1 uppercase tracking-wider"
              >
                <span>Continue Stage {currentStep + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Blueprint Summary Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-[#0E1B2A] text-white border border-[#0E1B2A] rounded-md p-5 shadow-sm space-y-4 h-fit sticky top-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#C6A75E] border-b border-[#1C2E42] pb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Blueprint Summary</span>
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#A0AEC0]">Total Items:</span>
              <span className="font-bold text-white">{totalQuestions} Questions</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#A0AEC0]">Total Duration:</span>
              <span className="font-bold text-white">{totalDurationMinutes} Mins</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#A0AEC0]">Passing Cutoff:</span>
              <span className="font-bold text-[#88BE9B]">{passingScorePercent}%</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#A0AEC0]">Sections Count:</span>
              <span className="font-bold text-[#C6A75E]">{sections.length} Sections</span>
            </div>
          </div>

          <div className="border-t border-[#1C2E42] pt-3 text-[11px] font-mono text-[#A0AEC0] space-y-1">
            <div className="flex justify-between">
              <span>Question Shuffle:</span>
              <span className={shuffleQuestions ? 'text-[#88BE9B]' : 'text-red-300'}>
                {shuffleQuestions ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Option Shuffle:</span>
              <span className={shuffleOptions ? 'text-[#88BE9B]' : 'text-red-300'}>
                {shuffleOptions ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Negative Mark:</span>
              <span className={negativeMarking ? 'text-red-300' : 'text-[#88BE9B]'}>
                {negativeMarking ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestBuilderPage;
