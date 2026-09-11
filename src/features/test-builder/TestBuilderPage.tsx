import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { configurationService } from '@/services/configurationService';
import { testPatternService, TestPatternTemplate, TestPatternSection } from '@/services/testPatternService';
import { testService } from '@/services/testService';
import { batchService } from '@/services/batchService';
import { questionService } from '@/services/questionService';
import { ForceConfig, CourseConfig } from '@/features/configuration/types';
import { Batch, Question } from '@/types';
import {
  ChevronRight,
  Shield,
  CheckCircle2,
  Sparkles,
  FileCheck,
  Send,
  Loader2,
  BookOpen,
  Check,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  Layers,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface ConfiguredSectionState {
  id: string;
  sourceTemplateSectionId?: string;
  sectionCode: string;
  sectionName: string;
  displayOrder: number;
  enabled: boolean;
  questionCount: number;
  durationMinutes: number;
  minQuestions: number;
  maxQuestions: number;
  minDuration: number;
  maxDuration: number;
  isMandatory: boolean;
  canDisable: boolean;
  canOverrideCount: boolean;
  canOverrideDuration: boolean;
  subjects: Array<{ id: string; code: string; name: string }>;
  defaultQuestions: number;
  defaultDuration: number;
}

const STEP_LABELS = [
  { step: 1, label: '1. Test Details' },
  { step: 2, label: '2. Eligibility' },
  { step: 3, label: '3. Pattern' },
  { step: 4, label: '4. Questions' },
  { step: 5, label: '5. Rules' },
  { step: 6, label: '6. Review' },
  { step: 7, label: '7. Publish' },
];

export const TestBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isStaff = role === 'ADMIN' || role === 'TEACHER';

  // Step state (1 to 7)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Loaded DB entities
  const [forces, setForces] = useState<ForceConfig[]>([]);
  const [courses, setCourses] = useState<CourseConfig[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [templates, setTemplates] = useState<TestPatternTemplate[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);

  // Stage 1: Test Identity & Scope Only
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [testType, setTestType] = useState<'PRACTICE' | 'MOCK' | 'FULL' | 'SECTIONAL'>('FULL');

  // Stage 2: Force & Entry Eligibility + Master Pattern Template
  const [, setLoadingCourses] = useState(false);
  const [selectedEligibilities, setSelectedEligibilities] = useState<Array<{force_id: string, course_id: string}>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Stage 3: Configured Sections (Snapshot from Master Template)
  const [configuredSections, setConfiguredSections] = useState<ConfiguredSectionState[]>([]);

  // Stage 4: Questions & Subject Allocation
  const [assemblyMode, setAssemblyMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [sectionQuestionMap, setSectionQuestionMap] = useState<Record<string, string[]>>({});
  const [activeSectionTab, setActiveSectionTab] = useState<string>('');
  const [questionSearch, setQuestionSearch] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

  // Stage 5: Timing & Rules
  const [passingScorePercent, setPassingScorePercent] = useState<number>(50);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [allowSectionNavigation, setAllowSectionNavigation] = useState(false);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const negativeMarkValue = 0.25;
  const [showResultImmediately, setShowResultImmediately] = useState(true);
  const showAnswerReview = true;

  // Stage 7: Publishing State
  const [publishing, setPublishing] = useState(false);

  // 1. Initial Load: Forces, Batches, Questions
  useEffect(() => {
    async function loadInitial() {
      try {
        const [fList, bList, qList] = await Promise.all([
          configurationService.getForces(),
          batchService.getBatches(),
          questionService.getQuestions(),
        ]);
        setForces(fList);
        setBatches(bList);
        setAllQuestions(qList);
      } catch (e) {
        console.warn('Initial load warning:', e);
      }
    }
    loadInitial();
  }, []);

  // 2. Dynamic Dependency: Fetch All Courses
  useEffect(() => {
    async function loadAllCourses() {
      try {
        setLoadingCourses(true);
        const cList = await configurationService.getCourses();
        setCourses(cList);
      } catch (e) {
        console.warn('Failed to load courses:', e);
      } finally {
        setLoadingCourses(false);
      }
    }
    loadAllCourses();
  }, []);

  // 3. Dynamic Template Dependency: Load templates for first selected course
  useEffect(() => {
    if (selectedEligibilities.length === 0) {
      setTemplates([]);
      setSelectedTemplateId('');
      return;
    }

    async function loadTemplatesForCourse() {
      try {
        const firstElig = selectedEligibilities[0];
        const tList = await testPatternService.getTemplates(firstElig.force_id, firstElig.course_id);
        setTemplates(tList);
        if (tList.length > 0) {
          const defaultTpl = tList.find((t) => t.isDefault) || tList[0];
          setSelectedTemplateId(defaultTpl.id);
        } else {
          setSelectedTemplateId('');
        }
      } catch (e) {
        console.warn('Failed to load templates:', e);
      }
    }
    loadTemplatesForCourse();
  }, [selectedEligibilities]);

  // 4. Load Master Template Sections into Snapshot State
  useEffect(() => {
    if (!selectedTemplateId) {
      setConfiguredSections([]);
      return;
    }

    async function loadSections() {
      const details = await testPatternService.getTemplateDetails(selectedTemplateId);
      if (details && details.sections) {
        const mapped: ConfiguredSectionState[] = details.sections.map((s: TestPatternSection) => ({
          id: s.id,
          sourceTemplateSectionId: s.id,
          sectionCode: s.sectionCode,
          sectionName: s.sectionName,
          displayOrder: s.displayOrder,
          enabled: s.defaultEnabled,
          questionCount: s.defaultQuestionCount,
          durationMinutes: s.defaultDurationMinutes,
          minQuestions: s.minQuestionCount,
          maxQuestions: s.maxQuestionCount,
          minDuration: s.minDurationMinutes,
          maxDuration: s.maxDurationMinutes,
          isMandatory: s.isMandatory,
          canDisable: s.teacherCanDisable,
          canOverrideCount: s.teacherCanOverrideQuestionCount,
          canOverrideDuration: s.teacherCanOverrideDuration,
          subjects: s.subjects || [],
          defaultQuestions: s.defaultQuestionCount,
          defaultDuration: s.defaultDurationMinutes,
        }));
        setConfiguredSections(mapped);

        // Auto-populate Title if empty
        const course = courses.find((c) => selectedEligibilities.map(e => e.course_id).includes(c.id));
        if (!title && course) {
          setTitle(`${course.name} Computerized Screening Examination`);
        }
      }
    }
    loadSections();
  }, [selectedTemplateId]);

  // Section customizers
  const toggleSectionEnabled = (secId: string) => {
    setConfiguredSections((prev) =>
      prev.map((s) => {
        if (s.id === secId) {
          if (s.isMandatory || !s.canDisable) {
            toast.error(`Section "${s.sectionName}" is mandatory.`);
            return s;
          }
          return { ...s, enabled: !s.enabled };
        }
        return s;
      })
    );
  };

  const updateSectionQuestionCount = (secId: string, count: number) => {
    setConfiguredSections((prev) =>
      prev.map((s) => {
        if (s.id === secId) {
          if (!s.canOverrideCount) {
            toast.error(`Question count override is locked for "${s.sectionName}".`);
            return s;
          }
          const valid = Math.max(s.minQuestions, Math.min(s.maxQuestions, count));
          return { ...s, questionCount: valid };
        }
        return s;
      })
    );
  };

  const updateSectionDuration = (secId: string, duration: number) => {
    setConfiguredSections((prev) =>
      prev.map((s) => {
        if (s.id === secId) {
          if (!s.canOverrideDuration) {
            toast.error(`Duration override is locked for "${s.sectionName}".`);
            return s;
          }
          const valid = Math.max(s.minDuration, Math.min(s.maxDuration, duration));
          return { ...s, durationMinutes: valid };
        }
        return s;
      })
    );
  };

  // Calculations
  const activeSections = configuredSections.filter((s) => s.enabled);
  const totalQuestions = activeSections.reduce((acc, s) => acc + Number(s.questionCount), 0);
  const totalDurationMinutes = activeSections.reduce((acc, s) => acc + Number(s.durationMinutes), 0);
  const totalAllocatedQuestions = Object.values(sectionQuestionMap).reduce((acc, arr) => acc + arr.length, 0);

  // Synchronize active section tab
  useEffect(() => {
    if (!activeSectionTab && activeSections.length > 0) {
      setActiveSectionTab(activeSections[0].id);
    }
  }, [activeSections, activeSectionTab]);

  // Auto Question Allocator across all sections
  const handleAutoGenerate = () => {
    const newMap: Record<string, string[]> = {};
    const usedIds = new Set<string>();

    for (const sec of activeSections) {
      const needed = sec.questionCount;
      const secSubjectIds = sec.subjects?.map((s) => s.id) || [];
      const secSubjectCodes = sec.subjects?.map((s) => s.code) || [];

      let matching = allQuestions.filter(
        (q) =>
          q.status === 'APPROVED' &&
          !usedIds.has(q.id) &&
          (secSubjectIds.includes(q.subject_id || '') || secSubjectCodes.includes(q.subject as string))
      );

      if (matching.length < needed) {
        const extra = allQuestions.filter(
          (q) => q.status === 'APPROVED' && !usedIds.has(q.id) && !matching.some((m) => m.id === q.id)
        );
        matching = [...matching, ...extra];
      }

      const allocated = matching.slice(0, needed).map((q) => q.id);
      allocated.forEach((id) => usedIds.add(id));
      newMap[sec.id] = allocated;
    }

    setSectionQuestionMap(newMap);
    const totalAssigned = Object.values(newMap).reduce((acc, arr) => acc + arr.length, 0);
    toast.success(`Allocated ${totalAssigned} items across ${activeSections.length} examination sections.`);
  };

  const handleAutoGenerateForSection = (secId: string) => {
    const sec = activeSections.find((s) => s.id === secId);
    if (!sec) return;

    const usedInOther = new Set<string>();
    Object.entries(sectionQuestionMap).forEach(([id, qIds]) => {
      if (id !== secId) {
        qIds.forEach((qid) => usedInOther.add(qid));
      }
    });

    const needed = sec.questionCount;
    const secSubjectIds = sec.subjects?.map((s) => s.id) || [];
    const secSubjectCodes = sec.subjects?.map((s) => s.code) || [];

    let matching = allQuestions.filter(
      (q) =>
        q.status === 'APPROVED' &&
        !usedInOther.has(q.id) &&
        (secSubjectIds.includes(q.subject_id || '') || secSubjectCodes.includes(q.subject as string))
    );

    if (matching.length < needed) {
      const extra = allQuestions.filter(
        (q) => q.status === 'APPROVED' && !usedInOther.has(q.id) && !matching.some((m) => m.id === q.id)
      );
      matching = [...matching, ...extra];
    }

    const allocated = matching.slice(0, needed).map((q) => q.id);
    setSectionQuestionMap((prev) => ({
      ...prev,
      [secId]: allocated,
    }));
    toast.success(`Allocated ${allocated.length} questions for section "${sec.sectionName}".`);
  };

  const toggleQuestionForSection = (secId: string, qId: string) => {
    const sec = activeSections.find((s) => s.id === secId);
    if (!sec) return;

    const currentList = sectionQuestionMap[secId] || [];
    if (currentList.includes(qId)) {
      setSectionQuestionMap((prev) => ({
        ...prev,
        [secId]: currentList.filter((id) => id !== qId),
      }));
    } else {
      if (currentList.length >= sec.questionCount) {
        toast.error(`Section quota reached (${sec.questionCount} questions). Remove an item first.`);
        return;
      }
      setSectionQuestionMap((prev) => ({
        ...prev,
        [secId]: [...currentList, qId],
      }));
    }
  };

  const clearSectionQuestions = (secId: string) => {
    setSectionQuestionMap((prev) => ({
      ...prev,
      [secId]: [],
    }));
  };

  useEffect(() => {
    if (currentStep === 4 && assemblyMode === 'AUTO' && totalAllocatedQuestions === 0 && allQuestions.length > 0) {
      handleAutoGenerate();
    }
  }, [currentStep, assemblyMode, allQuestions.length]);

  // Step Validation & Navigation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        toast.error('Please enter an examination title.');
        return;
      }
    } else if (currentStep === 2) {
      if (selectedEligibilities.length === 0) {
        toast.error('Please select at least one eligible course.');
        return;
      }
      if (!selectedTemplateId && templates.length > 0) {
        toast.error('Please select a Master Pattern Template.');
        return;
      }
    } else if (currentStep === 3) {
      if (activeSections.length === 0) {
        toast.error('At least one section must be enabled.');
        return;
      }
      for (const s of activeSections) {
        if (s.questionCount <= 0 || s.durationMinutes <= 0) {
          toast.error(`Invalid question count or duration in "${s.sectionName}".`);
          return;
        }
      }
    } else if (currentStep === 4) {
      if (assemblyMode === 'AUTO') {
        if (totalAllocatedQuestions === 0) {
          handleAutoGenerate();
        }
      } else {
        const emptySec = activeSections.find((s) => (sectionQuestionMap[s.id] || []).length === 0);
        if (emptySec) {
          toast.error(`Section "${emptySec.sectionName}" has no questions allocated. Click "Auto-Fill" or choose manually.`);
          return;
        }
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 7));
  };

  // Step 7: Final Compilation & Publish
  const handlePublish = async () => {
    if (role === 'STUDENT') {
      toast.error('Access Denied: Cadets cannot author or publish tests.');
      return;
    }

    if (activeSections.length === 0) {
      toast.error('Test must have at least one enabled section.');
      return;
    }

    if (assemblyMode === 'MANUAL') {
      const emptySec = activeSections.find((s) => (sectionQuestionMap[s.id] || []).length === 0);
      if (emptySec) {
        toast.error(`Cannot publish: Section "${emptySec.sectionName}" has 0 questions allocated.`);
        return;
      }
    }

    setPublishing(true);

    try {
      const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

      const compiledTest = await testService.compileTestFromPattern({
        eligibilities: selectedEligibilities,
        test: {
          name: title,
          description: description || null,
          batch_id: selectedBatchId === 'ALL' || selectedBatchId === 'NONE' ? null : selectedBatchId || null,
          passing_threshold: passingScorePercent,
          duration_minutes: totalDurationMinutes,
          shuffle_questions: shuffleQuestions,
          shuffle_options: shuffleOptions,
          allow_section_navigation: allowSectionNavigation,
          negative_marking: negativeMarking,
          negative_mark_value: negativeMarking ? negativeMarkValue : 0,
          show_result_immediately: showResultImmediately,
          show_answer_review: showAnswerReview,
          template_id: selectedTemplateId || null,
          template_version: selectedTemplate?.version || 1,
          test_type: testType,
        },
        sections: activeSections.map((s, idx) => ({
          name: s.sectionName,
          section_code: s.sectionCode,
          source_template_section_id: s.sourceTemplateSectionId,
          position: idx + 1,
          question_count: s.questionCount,
          duration_minutes: s.durationMinutes,
          subject_id: s.subjects && s.subjects[0] ? s.subjects[0].id : null,
          subject_ids: s.subjects?.map((sub) => sub.id) || [],
          is_mandatory: s.isMandatory,
          passing_percentage: 50,
          question_ids: sectionQuestionMap[s.id] || [],
        })),
        batchId: selectedBatchId === 'ALL' || selectedBatchId === 'NONE' ? undefined : selectedBatchId || undefined,
        autoGenerateQuestions: assemblyMode === 'AUTO',
      });

      try {
        await testService.publishTest(compiledTest.id);

        if (selectedBatchId === 'ALL') {
          for (const b of batches) {
            try {
              await testService.assignTest(compiledTest.id, b.id);
            } catch (assignErr) {
              console.warn(`Notice assigning to batch ${b.name}:`, assignErr);
            }
          }
        } else if (selectedBatchId && selectedBatchId !== 'NONE') {
          await testService.assignTest(compiledTest.id, selectedBatchId);
        }
      } catch (pubErr) {
        console.error('Publish RPC error:', pubErr);
        const pubMsg = pubErr && typeof pubErr === 'object' && 'message' in pubErr ? String((pubErr as { message: unknown }).message) : 'Check section question assignments.';
        throw new Error(`Test created, but publishing failed: ${pubMsg}`);
      }

      setPublishing(false);
      toast.success(
        selectedBatchId === 'ALL'
          ? 'Test published & assigned to all active batches!'
          : 'Test blueprint successfully created & published!'
      );
      navigate('/admin/tests');
    } catch (err) {
      setPublishing(false);
      const errMsg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Failed to compile test.';
      toast.error(errMsg);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  // Grouped Eligibility Summary Helper
  const getEligibilitySummary = () => {
    if (selectedEligibilities.length === 0) return null;
    const map: Record<string, string[]> = {};
    selectedEligibilities.forEach((item) => {
      const fName = forces.find((f) => f.id === item.force_id)?.name || 'Armed Force';
      const cName = courses.find((c) => c.id === item.course_id)?.name || 'Course';
      if (!map[fName]) map[fName] = [];
      if (!map[fName].includes(cName)) map[fName].push(cName);
    });
    return map;
  };

  const eligibilitySummaryMap = getEligibilitySummary();

  const currentActiveSec = activeSections.find((s) => s.id === activeSectionTab) || activeSections[0];
  const currentActiveSecCount = (sectionQuestionMap[currentActiveSec?.id || ''] || []).length;

  const filteredQuestionsForActiveSec = allQuestions.filter((q) => {
    if (q.status !== 'APPROVED') return false;

    if (questionSearch.trim()) {
      const s = questionSearch.toLowerCase();
      const stemMatch = q.stem.toLowerCase().includes(s);
      const codeMatch = q.code.toLowerCase().includes(s);
      const tagMatch = q.tags?.some((t) => t.toLowerCase().includes(s));
      if (!stemMatch && !codeMatch && !tagMatch) return false;
    }

    if (difficultyFilter !== 'ALL' && q.difficulty !== difficultyFilter) {
      return false;
    }

    if (subjectFilter !== 'ALL') {
      if (q.subject_id !== subjectFilter && q.subject !== subjectFilter) {
        return false;
      }
    }

    return true;
  });

  filteredQuestionsForActiveSec.sort((a, b) => {
    const aSelected = (sectionQuestionMap[currentActiveSec?.id || ''] || []).includes(a.id);
    const bSelected = (sectionQuestionMap[currentActiveSec?.id || ''] || []).includes(b.id);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;

    const aMatchesSec = currentActiveSec?.subjects?.some((s) => s.id === a.subject_id || s.code === a.subject);
    const bMatchesSec = currentActiveSec?.subjects?.some((s) => s.id === b.subject_id || s.code === b.subject);
    if (aMatchesSec && !bMatchesSec) return -1;
    if (!aMatchesSec && bMatchesSec) return 1;

    return 0;
  });

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto font-sans pb-12">
      {/* Wizard Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-[#E2E6EB] shadow-xs">
        <div>
          <h1 className="text-[30px] sm:text-[32px] font-extrabold tracking-tight text-[#0E1B2A] font-display">
            Test Builder
          </h1>
          <p className="text-base font-medium text-[#64748B] mt-1">
            Create, configure, and publish computerized examinations across forces and courses.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] px-3.5 py-1.5 rounded-lg text-sm font-bold tabular-nums">
            Step {currentStep} of 7
          </span>
        </div>
      </div>

      {/* 7-Step Stepper Bar */}
      <div className="bg-white border border-[#E2E6EB] rounded-lg p-3 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
          {STEP_LABELS.map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setCurrentStep(item.step)}
              className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all truncate flex items-center justify-center space-x-1.5 ${
                currentStep === item.step
                  ? 'bg-[#0E1B2A] text-white shadow-xs'
                  : currentStep > item.step
                  ? 'bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B]'
                  : 'bg-[#F6F8FA] text-[#64748B] border border-[#E2E6EB] hover:bg-[#EDF1F5]'
              }`}
            >
              {currentStep > item.step ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#234E35] shrink-0 inline" />
              ) : null}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Wizard Workspace (72% Main / 28% Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Stage Workspace (8 Cols on 12-grid = ~67-72%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* STAGE 1: Test Details */}
          {currentStep === 1 && (
            <div className="bg-white border border-[#E2E6EB] rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-[#EDF1F5] pb-4">
                <h2 className="text-xl font-bold text-[#0E1B2A] font-display">
                  Test Details
                </h2>
                <p className="text-sm font-medium text-[#64748B] mt-1">
                  Define the examination identity, deployment scope, and evaluation type.
                </p>
              </div>

              <div className="space-y-5 text-sm">
                <div>
                  <label className="block text-sm font-semibold text-[#0E1B2A] mb-2">
                    Examination Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. PMA Long Course Computerized Screening Exam"
                    className="w-full h-11 bg-white border border-[#D4D9DF] rounded-lg px-4 text-sm font-medium text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0E1B2A] mb-2">
                    Description / Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide exam administration directives, syllabus coverage, or session instructions for candidates..."
                    className="w-full bg-white border border-[#D4D9DF] rounded-lg p-4 text-sm font-medium text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-[#0E1B2A] mb-2">
                      Candidate Batch Deployment
                    </label>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="w-full h-11 bg-white border border-[#D4D9DF] rounded-lg px-4 text-sm font-medium text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
                    >
                      <option value="ALL">All Active Batches (Deliver to all enrolled candidates)</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                      <option value="NONE">Unassigned / Master Repository Only</option>
                    </select>
                    <p className="text-xs font-medium text-[#64748B] mt-2 leading-relaxed">
                      {selectedBatchId === 'ALL' ? (
                        <span className="text-[#166534] flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                          <span>Assigned to all active batches. Candidates can view and attempt this test immediately.</span>
                        </span>
                      ) : selectedBatchId && selectedBatchId !== 'NONE' ? (
                        <span className="text-[#0E1B2A] flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                          <span>Assigned specifically to {batches.find((b) => b.id === selectedBatchId)?.name || 'the selected batch'}.</span>
                        </span>
                      ) : (
                        <span className="text-[#B45309] flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                          <span>Saved in repository only. Candidates cannot view this test until assigned to a batch.</span>
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0E1B2A] mb-2">
                      Test Evaluation Type
                    </label>
                    <select
                      value={testType}
                      onChange={(e) => setTestType(e.target.value as 'PRACTICE' | 'MOCK' | 'FULL' | 'SECTIONAL')}
                      className="w-full h-11 bg-white border border-[#D4D9DF] rounded-lg px-4 text-sm font-medium text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
                    >
                      <option value="FULL">Full Formal Examination</option>
                      <option value="MOCK">Full Mock Screening</option>
                      <option value="PRACTICE">Academy Practice Drill</option>
                      <option value="SECTIONAL">Single Section Practice</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: Test Eligibility & Pattern (Single Source of Truth) */}
          {currentStep === 2 && (
            <div className="bg-white border border-[#E2E6EB] rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-[#EDF1F5] pb-4">
                <h2 className="text-xl font-bold text-[#0E1B2A] font-display">
                  Test Eligibility & Pattern
                </h2>
                <p className="text-sm font-medium text-[#64748B] mt-1">
                  Select the forces and courses eligible for this test, then choose the pattern template.
                </p>
              </div>

              {/* Grouped Selection Cards Per Force */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-[#0E1B2A]">
                  Select Eligible Forces & Courses <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {forces.map((f) => {
                    const forceCourses = courses.filter((c) => c.forceId === f.id);
                    return (
                      <div key={f.id} className="bg-[#F8FAFC] border border-[#E2E6EB] rounded-xl p-5 space-y-4">
                        <div className="border-b border-[#E2E6EB] pb-3 flex items-center justify-between">
                          <h4 className="text-base font-bold text-[#0E1B2A] font-display">
                            {f.name}
                          </h4>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#EDF1F5] text-[#64748B]">
                            {forceCourses.length} Courses
                          </span>
                        </div>

                        <div className="space-y-3">
                          {forceCourses.map((c) => {
                            const isSelected = selectedEligibilities.some((e) => e.course_id === c.id);
                            return (
                              <label
                                key={c.id}
                                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                                  isSelected
                                    ? 'bg-white border-[#0E1B2A] ring-1 ring-[#0E1B2A]/10 shadow-xs'
                                    : 'bg-white border-[#E2E6EB] hover:border-[#CBD5E1]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedEligibilities([...selectedEligibilities, { force_id: f.id, course_id: c.id }]);
                                    } else {
                                      setSelectedEligibilities(selectedEligibilities.filter((x) => x.course_id !== c.id));
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#0E1B2A] focus:ring-[#0E1B2A] cursor-pointer"
                                />
                                <span className="text-sm font-medium text-[#1E293B]">{c.name}</span>
                              </label>
                            );
                          })}
                          {forceCourses.length === 0 && (
                            <span className="text-xs font-medium text-[#64748B] italic">No active courses registered</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Eligibility Summary Box */}
              <div className="bg-[#F8FAFC] border border-[#E2E6EB] rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-[#0E1B2A]">
                  Selected Eligibility
                </h4>
                {eligibilitySummaryMap ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-medium">
                    {Object.entries(eligibilitySummaryMap).map(([forceName, courseNames]) => (
                      <div key={forceName} className="bg-white border border-[#E2E6EB] rounded-lg p-3">
                        <span className="text-xs font-bold text-[#0E1B2A] uppercase tracking-wider block mb-1.5">
                          {forceName}
                        </span>
                        <ul className="space-y-1 text-sm text-[#334155]">
                          {courseNames.map((cn) => (
                            <li key={cn} className="flex items-center space-x-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C6A75E] shrink-0" />
                              <span>{cn}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-[#64748B] italic">
                    No eligible courses selected yet. Select at least one course above to proceed.
                  </p>
                )}
              </div>

              {/* Master Pattern Template Selector Box */}
              <div className="bg-white border border-[#E2E6EB] rounded-xl p-5 space-y-3">
                <label className="block text-sm font-bold text-[#0E1B2A]">
                  Pattern Template <span className="text-red-500">*</span>
                </label>
                {templates.length === 0 ? (
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E6EB] rounded-lg text-sm font-medium text-[#64748B] flex items-center space-x-2">
                    <Info className="w-4 h-4 text-[#64748B] shrink-0" />
                    <span>No active pattern template is available for the selected course combination. The default academy structure will be used.</span>
                  </div>
                ) : (
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full h-11 bg-white border border-[#D4D9DF] rounded-lg px-4 text-sm font-medium text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (v{t.version}) {t.isDefault ? '— [Default Spec]' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {/* STAGE 3: Test Pattern Section Configuration */}
          {currentStep === 3 && (
            <div className="bg-white border border-[#E2E6EB] rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-[#EDF1F5] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#0E1B2A] font-display">
                    Stage 3 — Section Configuration
                  </h2>
                  <p className="text-sm font-medium text-[#64748B] mt-1">
                    Customize sections, item counts, and durations according to academy policies.
                  </p>
                </div>
                <span className="text-xs bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] px-3 py-1 rounded-lg font-bold">
                  {activeSections.length} Sections Active
                </span>
              </div>

              {configuredSections.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium text-[#64748B] bg-[#F8FAFC] rounded-lg border border-dashed border-[#D4D9DF]">
                  No sections loaded. Please select a Master Pattern Template in Step 2.
                </div>
              ) : (
                <div className="space-y-4">
                  {configuredSections.map((sec, idx) => {
                    const isCustomCount = sec.questionCount !== sec.defaultQuestions;
                    const isCustomDuration = sec.durationMinutes !== sec.defaultDuration;

                    return (
                      <div
                        key={sec.id}
                        className={`p-5 rounded-xl border transition-all ${
                          sec.enabled
                            ? 'bg-white border-[#E2E6EB] shadow-xs'
                            : 'bg-[#F8FAFC] border-[#E2E6EB] opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#EDF1F5] pb-4 mb-4">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={sec.enabled}
                              disabled={sec.isMandatory || !sec.canDisable}
                              onChange={() => toggleSectionEnabled(sec.id)}
                              className="w-4 h-4 rounded border-[#CBD5E1] text-[#0E1B2A] focus:ring-[#0E1B2A] cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div>
                              <span className="text-base font-bold text-[#0E1B2A]">
                                {idx + 1}. {sec.sectionName}
                              </span>
                              <div className="flex items-center space-x-2 mt-1 text-xs font-medium text-[#64748B]">
                                <span className="font-mono">Code: {sec.sectionCode}</span>
                                <span>•</span>
                                <span>
                                  {sec.isMandatory ? (
                                    <span className="text-[#991B1B] font-bold">Mandatory</span>
                                  ) : (
                                    'Optional Section'
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {isCustomCount || isCustomDuration ? (
                              <span className="text-xs bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] px-2.5 py-1 rounded-md font-bold">
                                Custom Override
                              </span>
                            ) : (
                              <span className="text-xs bg-[#EDF1F5] text-[#475569] border border-[#CBD5E1] px-2.5 py-1 rounded-md font-semibold">
                                Academy Default
                              </span>
                            )}
                          </div>
                        </div>

                        {sec.enabled && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm pt-1">
                            <div>
                              <label className="block text-xs font-bold text-[#0E1B2A] mb-1.5 uppercase tracking-wide">
                                Question Count (Default: {sec.defaultQuestions})
                              </label>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="number"
                                  disabled={!sec.canOverrideCount}
                                  value={sec.questionCount}
                                  onChange={(e) => updateSectionQuestionCount(sec.id, Number(e.target.value))}
                                  className="w-32 h-10 bg-white border border-[#D4D9DF] rounded-lg px-3 text-sm font-bold text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] disabled:bg-[#EDF1F5] disabled:cursor-not-allowed"
                                />
                                <span className="text-xs font-medium text-[#64748B]">
                                  Range: {sec.minQuestions} – {sec.maxQuestions}
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-[#0E1B2A] mb-1.5 uppercase tracking-wide">
                                Duration Minutes (Default: {sec.defaultDuration} min)
                              </label>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="number"
                                  disabled={!sec.canOverrideDuration}
                                  value={sec.durationMinutes}
                                  onChange={(e) => updateSectionDuration(sec.id, Number(e.target.value))}
                                  className="w-32 h-10 bg-white border border-[#D4D9DF] rounded-lg px-3 text-sm font-bold text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] disabled:bg-[#EDF1F5] disabled:cursor-not-allowed"
                                />
                                <span className="text-xs font-medium text-[#64748B]">
                                  Range: {sec.minDuration} – {sec.maxDuration} min
                                </span>
                              </div>
                            </div>

                            {sec.subjects && sec.subjects.length > 0 && (
                              <div className="sm:col-span-2 pt-2 border-t border-[#EDF1F5]">
                                <span className="text-xs font-bold uppercase text-[#64748B] block mb-1.5">
                                  Integrated Syllabus Subjects:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {sec.subjects.map((sub) => (
                                    <span
                                      key={sub.id}
                                      className="text-xs font-semibold bg-[#EDF1F5] text-[#334155] px-2.5 py-1 rounded-md border border-[#E2E8F0]"
                                    >
                                      {sub.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STAGE 4: Questions Composition */}
          {currentStep === 4 && (
            <div className="bg-white border border-[#E2E6EB] rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-[#EDF1F5] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#0E1B2A] font-display">
                    Stage 4 — Question Composition
                  </h2>
                  <p className="text-sm font-medium text-[#64748B] mt-1">
                    Select or automatically allocate question bank items across your examination sections.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#64748B]">Step 4 of 7</span>
              </div>

              {/* Assembly Mode Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => setAssemblyMode('AUTO')}
                  className={`p-5 rounded-xl border text-left transition-all ${
                    assemblyMode === 'AUTO'
                      ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] ring-1 ring-[#86EFAC] shadow-xs'
                      : 'bg-white border-[#E2E6EB] text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold mb-1 text-base">
                    <Sparkles className="w-5 h-5 text-[#16A34A]" />
                    <span>Automatic Balanced Allocation</span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed">
                    System automatically selects verified questions matching each section's syllabus subjects from the question repository.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssemblyMode('MANUAL');
                    if (!activeSectionTab && activeSections.length > 0) {
                      setActiveSectionTab(activeSections[0].id);
                    }
                  }}
                  className={`p-5 rounded-xl border text-left transition-all ${
                    assemblyMode === 'MANUAL'
                      ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] ring-1 ring-[#86EFAC] shadow-xs'
                      : 'bg-white border-[#E2E6EB] text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold mb-1 text-base">
                    <BookOpen className="w-5 h-5 text-[#0E1B2A]" />
                    <span>Manual Item Selection</span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed">
                    Inspect, search, and manually hand-pick individual items from the active question bank catalog for each section.
                  </p>
                </button>
              </div>

              {/* Allocation Summary Card */}
              <div className="bg-[#F8FAFC] border border-[#E2E6EB] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="font-bold text-[#0E1B2A] flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-[#C6A75E]" />
                    <span>Overall Examination Composition</span>
                  </span>
                  <span>
                    Required: <strong className="text-[#0E1B2A]">{totalQuestions}</strong> items • Allocated:{' '}
                    <strong
                      className={
                        totalAllocatedQuestions >= totalQuestions ? 'text-[#166534]' : 'text-[#B45309]'
                      }
                    >
                      {totalAllocatedQuestions}
                    </strong>{' '}
                    items
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {activeSections.map((sec) => {
                    const count = (sectionQuestionMap[sec.id] || []).length;
                    const isMet = count >= sec.questionCount;
                    return (
                      <div
                        key={sec.id}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                          isMet
                            ? 'bg-white border-[#86EFAC] text-[#166534]'
                            : 'bg-white border-[#E2E6EB] text-[#334155]'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-bold truncate">{sec.sectionName}</p>
                          <p className="text-xs text-[#64748B] font-medium">
                            {sec.subjects?.map((s) => s.name).join(', ') || 'General Syllabus'}
                          </p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              isMet
                                ? 'bg-[#EDF6F0] text-[#166534]'
                                : count > 0
                                ? 'bg-[#FEF3C7] text-[#92400E]'
                                : 'bg-[#EDF1F5] text-[#64748B]'
                            }`}
                          >
                            {count} / {sec.questionCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleAutoGenerate}
                    className="inline-flex items-center space-x-2 bg-[#0E1B2A] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-[#1E293B] transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-[#C6A75E]" />
                    <span>Auto-Allocate All Sections</span>
                  </button>

                  {assemblyMode === 'AUTO' && totalAllocatedQuestions > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssemblyMode('MANUAL');
                        if (activeSections.length > 0) setActiveSectionTab(activeSections[0].id);
                      }}
                      className="text-sm font-semibold text-[#0E1B2A] hover:underline"
                    >
                      Switch to Manual View to Inspect & Customize
                    </button>
                  )}
                </div>
              </div>

              {/* MANUAL SELECTION WORKSPACE */}
              {assemblyMode === 'MANUAL' && (
                <div className="space-y-4 pt-3 border-t border-[#EDF1F5]">
                  <div>
                    <label className="block text-sm font-bold text-[#0E1B2A] mb-3">
                      Select Section to Pick Questions:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {activeSections.map((sec) => {
                        const count = (sectionQuestionMap[sec.id] || []).length;
                        const isMet = count >= sec.questionCount;
                        const isSelected = activeSectionTab === sec.id;
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => {
                              setActiveSectionTab(sec.id);
                              setSubjectFilter('ALL');
                            }}
                            className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center space-x-2 transition-all ${
                              isSelected
                                ? 'bg-[#0E1B2A] text-white shadow-xs'
                                : 'bg-[#F8FAFC] border border-[#D4D9DF] text-[#334155] hover:bg-[#EDF1F5]'
                            }`}
                          >
                            <span>{sec.sectionName}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                isSelected
                                  ? isMet
                                    ? 'bg-[#16A34A] text-white'
                                    : 'bg-[#C6A75E] text-[#0E1B2A]'
                                  : isMet
                                  ? 'bg-[#EDF6F0] text-[#166534] border border-[#86EFAC]'
                                  : 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                              }`}
                            >
                              {count}/{sec.questionCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {currentActiveSec && (
                    <div className="bg-white border border-[#E2E6EB] rounded-xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EDF1F5]">
                        <div>
                          <h3 className="text-base font-bold text-[#0E1B2A] flex items-center space-x-2">
                            <span>Questions for: {currentActiveSec.sectionName}</span>
                            <span className="text-sm font-medium text-[#64748B]">
                              (Code: {currentActiveSec.sectionCode})
                            </span>
                          </h3>
                          <p className="text-xs font-medium text-[#64748B] mt-1">
                            Target Quota: <strong>{currentActiveSec.questionCount}</strong> questions • Currently Selected:{' '}
                            <strong
                              className={
                                currentActiveSecCount >= currentActiveSec.questionCount
                                  ? 'text-[#166534]'
                                  : 'text-[#B45309]'
                              }
                            >
                              {currentActiveSecCount}
                            </strong>{' '}
                            questions
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleAutoGenerateForSection(currentActiveSec.id)}
                            className="inline-flex items-center space-x-1.5 bg-[#F0FDF4] border border-[#86EFAC] text-[#166534] px-3 py-2 rounded-lg text-xs font-bold hover:bg-[#DCFCE7]"
                          >
                            <Sparkles className="w-4 h-4 text-[#16A34A]" />
                            <span>Auto-Fill Section</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => clearSectionQuestions(currentActiveSec.id)}
                            className="inline-flex items-center space-x-1.5 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] px-3 py-2 rounded-lg text-xs font-bold hover:bg-[#FFE4E6]"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Clear</span>
                          </button>
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-sm">
                        <div className="sm:col-span-6 relative">
                          <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#64748B]" />
                          <input
                            type="text"
                            value={questionSearch}
                            onChange={(e) => setQuestionSearch(e.target.value)}
                            placeholder="Search question stem or code..."
                            className="w-full h-11 pl-10 pr-4 bg-white border border-[#D4D9DF] rounded-lg text-sm font-medium text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <select
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                            className="w-full h-11 px-3 bg-white border border-[#D4D9DF] rounded-lg text-sm font-medium text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
                          >
                            <option value="ALL">All Subjects</option>
                            {currentActiveSec.subjects?.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} (Syllabus)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="w-full h-11 px-3 bg-white border border-[#D4D9DF] rounded-lg text-sm font-medium text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
                          >
                            <option value="ALL">All Difficulties</option>
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                          </select>
                        </div>
                      </div>

                      {/* Questions List */}
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {filteredQuestionsForActiveSec.length === 0 ? (
                          <div className="text-center py-10 bg-[#F8FAFC] rounded-lg border border-dashed border-[#D4D9DF]">
                            <BookOpen className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                            <p className="text-sm font-bold text-[#0E1B2A]">No Matching Questions Found</p>
                            <p className="text-xs font-medium text-[#64748B] mt-1">
                              Try adjusting search filters or use "Auto-Fill Section" to draw from approved bank.
                            </p>
                          </div>
                        ) : (
                          filteredQuestionsForActiveSec.map((q) => {
                            const isSelectedInThisSec = (
                              sectionQuestionMap[currentActiveSec.id] || []
                            ).includes(q.id);
                            const isUsedInOtherSec = Object.entries(sectionQuestionMap).some(
                              ([secId, qIds]) => secId !== currentActiveSec.id && qIds.includes(q.id)
                            );

                            return (
                              <div
                                key={q.id}
                                className={`p-4 rounded-lg border text-sm transition-all ${
                                  isSelectedInThisSec
                                    ? 'bg-[#F0FDF4] border-[#86EFAC]'
                                    : isUsedInOtherSec
                                    ? 'bg-[#F8FAFC] border-[#E2E6EB] opacity-60'
                                    : 'bg-white border-[#E2E6EB] hover:border-[#CBD5E1]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-mono text-xs font-bold text-[#0E1B2A] bg-[#EDF1F5] px-2 py-0.5 rounded border border-[#E2E8F0]">
                                        {q.code || q.id.slice(0, 8)}
                                      </span>
                                      <span className="text-xs font-semibold bg-[#EEF2FF] text-[#3730A3] px-2 py-0.5 rounded">
                                        {q.subjectName || q.subject}
                                      </span>
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                                          q.difficulty === 'EASY'
                                            ? 'bg-[#ECFDF5] text-[#065F46]'
                                            : q.difficulty === 'HARD'
                                            ? 'bg-[#FEF2F2] text-[#991B1B]'
                                            : 'bg-[#FFFBEB] text-[#92400E]'
                                        }`}
                                      >
                                        {q.difficulty}
                                      </span>
                                      {isUsedInOtherSec && (
                                        <span className="text-xs font-medium text-[#64748B] italic">
                                          (Assigned to another section)
                                        </span>
                                      )}
                                    </div>

                                    <p className="font-bold text-[#0E1B2A] text-sm leading-relaxed">
                                      {q.stem}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                                      {q.options.map((opt) => (
                                        <div
                                          key={opt.id}
                                          className={`px-3 py-1.5 rounded-md border flex items-center space-x-2 ${
                                            opt.id === q.correctOptionId
                                              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] font-semibold'
                                              : 'bg-white border-[#E2E6EB] text-[#475569]'
                                          }`}
                                        >
                                          <span className="font-bold text-xs">{opt.label}.</span>
                                          <span className="truncate">{opt.text}</span>
                                          {opt.id === q.correctOptionId && (
                                            <Check className="w-3.5 h-3.5 text-[#059669] ml-auto shrink-0" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={isUsedInOtherSec}
                                    onClick={() => toggleQuestionForSection(currentActiveSec.id, q.id)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                                      isSelectedInThisSec
                                        ? 'bg-[#16A34A] hover:bg-[#15803D] text-white'
                                        : isUsedInOtherSec
                                        ? 'bg-[#EDF1F5] text-[#94A3B8] cursor-not-allowed'
                                        : 'bg-[#0E1B2A] hover:bg-[#1E293B] text-white'
                                    }`}
                                  >
                                    {isSelectedInThisSec ? (
                                      <span className="flex items-center space-x-1">
                                        <Check className="w-4 h-4" />
                                        <span>Selected</span>
                                      </span>
                                    ) : (
                                      <span className="flex items-center space-x-1">
                                        <Plus className="w-4 h-4" />
                                        <span>Select</span>
                                      </span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AUTO SELECTION PREVIEW */}
              {assemblyMode === 'AUTO' && (
                <div className="space-y-3 pt-3 border-t border-[#EDF1F5]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wide">
                      Automated Question Allocation Preview
                    </h3>
                    <span className="text-xs font-medium text-[#64748B]">
                      Dynamic balance: Approved questions selected per section syllabus
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeSections.map((sec) => {
                      const secQuestions = (sectionQuestionMap[sec.id] || [])
                        .map((id) => allQuestions.find((q) => q.id === id))
                        .filter(Boolean) as Question[];

                      return (
                        <div key={sec.id} className="border border-[#E2E6EB] rounded-xl p-4 bg-[#F8FAFC] space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-[#0E1B2A] flex items-center space-x-2">
                              <span>{sec.sectionName}</span>
                              <span className="text-xs font-normal text-[#64748B]">({sec.sectionCode})</span>
                            </span>
                            <span className="font-mono text-sm font-bold text-[#166534]">
                              {secQuestions.length} / {sec.questionCount} Questions Allocated
                            </span>
                          </div>

                          {secQuestions.length > 0 ? (
                            <div className="space-y-1.5 pt-1">
                              {secQuestions.slice(0, 3).map((q, idx) => (
                                <div key={q.id} className="text-xs font-medium text-[#334155] flex items-center space-x-2 truncate">
                                  <span className="text-[#64748B] font-mono w-5">{idx + 1}.</span>
                                  <span className="truncate">{q.stem}</span>
                                </div>
                              ))}
                              {secQuestions.length > 3 && (
                                <p className="text-xs font-medium text-[#64748B] italic pl-7">
                                  + {secQuestions.length - 3} more questions allocated for this section
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs font-medium text-[#94A3B8] italic">
                              Will be generated dynamically on compile using subject repository pool.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAGE 5: Rules */}
          {currentStep === 5 && (
            <div className="bg-white border border-[#E2E6EB] rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-[#EDF1F5] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#0E1B2A] font-display">
                    Stage 5 — Administration & Rules
                  </h2>
                  <p className="text-sm font-medium text-[#64748B] mt-1">
                    Configure examination delivery policies, timing controls, and scoring rules.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#64748B]">Step 5 of 7</span>
              </div>

              <div className="space-y-5 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E6EB] rounded-xl space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={shuffleQuestions}
                        onChange={(e) => setShuffleQuestions(e.target.checked)}
                        className="w-4 h-4 rounded border-[#CBD5E1] text-[#0E1B2A] cursor-pointer"
                      />
                      <span className="font-bold text-[#0E1B2A]">Randomize Question Order</span>
                    </label>
                    <p className="text-xs font-medium text-[#64748B] pl-7">
                      Presents questions in randomized sequence for each candidate terminal.
                    </p>
                  </div>

                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E6EB] rounded-xl space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={shuffleOptions}
                        onChange={(e) => setShuffleOptions(e.target.checked)}
                        className="w-4 h-4 rounded border-[#CBD5E1] text-[#0E1B2A] cursor-pointer"
                      />
                      <span className="font-bold text-[#0E1B2A]">Randomize Options Order</span>
                    </label>
                    <p className="text-xs font-medium text-[#64748B] pl-7">
                      Shuffles options (A, B, C, D) per question on the candidate client interface.
                    </p>
                  </div>

                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E6EB] rounded-xl space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allowSectionNavigation}
                        onChange={(e) => setAllowSectionNavigation(e.target.checked)}
                        className="w-4 h-4 rounded border-[#CBD5E1] text-[#0E1B2A] cursor-pointer"
                      />
                      <span className="font-bold text-[#0E1B2A]">Allow Free Section Navigation</span>
                    </label>
                    <p className="text-xs font-medium text-[#64748B] pl-7">
                      If disabled, candidates must complete sections strictly in sequential lockstep.
                    </p>
                  </div>

                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E6EB] rounded-xl space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={negativeMarking}
                        onChange={(e) => setNegativeMarking(e.target.checked)}
                        className="w-4 h-4 rounded border-[#CBD5E1] text-[#0E1B2A] cursor-pointer"
                      />
                      <span className="font-bold text-[#0E1B2A]">Enforce Negative Marking</span>
                    </label>
                    <p className="text-xs font-medium text-[#64748B] pl-7">
                      Deduct {negativeMarkValue} mark for each incorrect response.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-[#0E1B2A] mb-2">
                      Minimum Passing Score (%)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={90}
                      value={passingScorePercent}
                      onChange={(e) => setPassingScorePercent(Number(e.target.value))}
                      className="w-full h-11 bg-white border border-[#D4D9DF] rounded-lg px-4 text-sm font-bold text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#0E1B2A] mb-2">
                      Post-Exam Result Display
                    </label>
                    <select
                      value={showResultImmediately ? 'YES' : 'NO'}
                      onChange={(e) => setShowResultImmediately(e.target.value === 'YES')}
                      className="w-full h-11 bg-white border border-[#D4D9DF] rounded-lg px-4 text-sm font-medium text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
                    >
                      <option value="YES">Display Score & Ranking Immediately</option>
                      <option value="NO">Proctor Reserved Release</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 6: Review */}
          {currentStep === 6 && (
            <div className="bg-white border border-[#E2E6EB] rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-[#EDF1F5] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#0E1B2A] font-display">
                    Stage 6 — Specification Review
                  </h2>
                  <p className="text-sm font-medium text-[#64748B] mt-1">
                    Review examination details and structure before compilation.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#64748B]">Step 6 of 7</span>
              </div>

              <div className="space-y-5 text-sm font-sans">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E6EB]">
                  <div>
                    <span className="text-xs font-bold uppercase text-[#64748B] block mb-1">Forces</span>
                    <span className="font-bold text-[#0E1B2A]">{Object.keys(eligibilitySummaryMap || {}).join(', ') || 'Armed Forces'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-[#64748B] block mb-1">Courses</span>
                    <span className="font-bold text-[#0E1B2A]">{Object.values(eligibilitySummaryMap || {}).flat().join(', ') || 'Screening'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-[#64748B] block mb-1">Total Questions</span>
                    <span className="font-bold text-[#0E1B2A]">{totalQuestions} Items</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-[#64748B] block mb-1">Duration</span>
                    <span className="font-bold text-[#0E1B2A]">{totalDurationMinutes} Minutes</span>
                  </div>
                </div>

                <div className="border border-[#E2E6EB] rounded-xl overflow-hidden">
                  <div className="bg-[#0E1B2A] text-white px-5 py-3 font-bold text-xs uppercase tracking-wider">
                    Enabled Examination Sections
                  </div>
                  <div className="divide-y divide-[#EDF1F5]">
                    {activeSections.map((sec, i) => (
                      <div key={sec.id} className="p-4 flex items-center justify-between bg-white">
                        <div>
                          <span className="font-bold text-[#0E1B2A] text-sm">
                            {i + 1}. {sec.sectionName}
                          </span>
                          <div className="text-xs font-medium text-[#64748B] mt-0.5">
                            Code: {sec.sectionCode} • Pass: 50%
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#0E1B2A] text-sm block">{sec.questionCount} Questions</span>
                          <span className="text-xs font-medium text-[#64748B]">{sec.durationMinutes} Minutes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#EDF6F0] border border-[#88BE9B] rounded-xl text-sm font-medium text-[#234E35] flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-[#234E35] shrink-0" />
                  <span>Specification conforms to academy standards. Ready for compilation.</span>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 7: Publish & Assign */}
          {currentStep === 7 && (
            <div className="bg-white border border-[#E2E6EB] rounded-lg p-6 sm:p-8 shadow-xs space-y-6 text-center">
              <div className="w-14 h-14 bg-[#EDF6F0] border border-[#88BE9B] rounded-full flex items-center justify-center mx-auto text-[#234E35]">
                <FileCheck className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#0E1B2A] font-display">
                  Publish Examination
                </h2>
                <p className="text-sm font-medium text-[#64748B] mt-1 max-w-lg mx-auto">
                  Compile section rules, allocate question pool, and publish this examination for candidate delivery.
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E6EB] p-5 rounded-xl max-w-md mx-auto text-sm text-left space-y-3">
                <div className="flex justify-between border-b border-[#E2E6EB] pb-2">
                  <span className="text-[#64748B]">Title:</span>
                  <span className="font-bold text-[#0E1B2A]">{title}</span>
                </div>
                <div className="flex justify-between border-b border-[#E2E6EB] pb-2">
                  <span className="text-[#64748B]">Deployment Scope:</span>
                  <span className="text-[#166534] font-bold">
                    {selectedBatchId === 'ALL'
                      ? 'All Active Batches'
                      : selectedBatch
                      ? selectedBatch.name
                      : 'Unassigned Repository'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Sections / Items:</span>
                  <span className="text-[#0E1B2A] font-bold">{activeSections.length} Sections / {totalQuestions} Questions</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing || !isStaff}
                  className="inline-flex items-center space-x-2 bg-[#0E1B2A] hover:bg-[#1E293B] text-white px-8 py-3.5 rounded-lg text-sm font-bold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-[#C6A75E]" />
                      <span>Compiling Blueprint...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 text-[#C6A75E]" />
                      <span>Compile & Publish Test</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Control Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E2E6EB]">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="h-11 px-6 bg-white border border-[#D4D9DF] text-[#0E1B2A] rounded-lg text-sm font-bold hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center space-x-2 h-11 px-6 bg-[#0E1B2A] text-white rounded-lg text-sm font-bold hover:bg-[#1E293B] transition-colors"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4 text-[#C6A75E]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/admin/tests')}
                className="h-11 px-6 bg-white border border-[#D4D9DF] text-[#64748B] rounded-lg text-sm font-bold hover:bg-[#F8FAFC] transition-colors"
              >
                Back to Tests
              </button>
            )}
          </div>
        </div>

        {/* Right Test Summary Audit Sidebar (4 Cols on 12-grid = ~28-33%) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#E2E6EB] rounded-lg p-5 shadow-xs space-y-4 text-sm font-sans sticky top-24">
            <h3 className="text-base font-bold text-[#0E1B2A] border-b border-[#EDF1F5] pb-3 flex items-center justify-between font-display">
              <span>Test Summary</span>
              <Shield className="w-4 h-4 text-[#C6A75E]" />
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-[#64748B] block mb-1">
                  Eligible Forces
                </span>
                <span className="font-bold text-[#0E1B2A]">
                  {eligibilitySummaryMap ? Object.keys(eligibilitySummaryMap).join(', ') : 'None Selected'}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-[#64748B] block mb-1">
                  Eligible Courses
                </span>
                <span className="font-bold text-[#0E1B2A]">
                  {eligibilitySummaryMap ? Object.values(eligibilitySummaryMap).flat().join(', ') : 'None Selected'}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-[#64748B] block mb-1">
                  Pattern Template
                </span>
                <span className="font-medium text-[#0E1B2A]">
                  {selectedTemplate?.name || 'Default Academy Spec'}
                </span>
              </div>

              <div className="pt-3 border-t border-[#EDF1F5] space-y-2 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Active Sections:</span>
                  <strong className="text-[#0E1B2A]">{activeSections.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Total Questions:</span>
                  <strong className="text-[#0E1B2A]">{totalQuestions}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Total Duration:</span>
                  <strong className="text-[#0E1B2A]">{totalDurationMinutes} min</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Passing Score:</span>
                  <strong className="text-[#0E1B2A]">{passingScorePercent}%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Negative Marking:</span>
                  <strong className="text-[#0E1B2A]">{negativeMarking ? `Yes (-${negativeMarkValue})` : 'None'}</strong>
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E6EB] p-4 rounded-lg text-xs text-[#64748B] font-medium leading-relaxed">
              <strong>Audit Record:</strong> Template pattern specifications are locked upon publication to preserve historical candidate test integrity.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestBuilderPage;
