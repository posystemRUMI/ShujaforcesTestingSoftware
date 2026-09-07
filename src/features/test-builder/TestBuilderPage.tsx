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

  // Step 1: Basic Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [testType, setTestType] = useState<'PRACTICE' | 'MOCK' | 'FULL' | 'SECTIONAL'>('FULL');

  // Step 2: Force & Entry Course & Pattern Template
  const [selectedForceId, setSelectedForceId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Step 3: Configured Sections (Snapshot from Master Template)
  const [configuredSections, setConfiguredSections] = useState<ConfiguredSectionState[]>([]);

  // Step 4: Questions & Subject Allocation
  const [assemblyMode, setAssemblyMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [sectionQuestionMap, setSectionQuestionMap] = useState<Record<string, string[]>>({});
  const [activeSectionTab, setActiveSectionTab] = useState<string>('');
  const [questionSearch, setQuestionSearch] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

  // Step 5: Timing & Rules
  const [passingScorePercent, setPassingScorePercent] = useState<number>(50);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [allowSectionNavigation, setAllowSectionNavigation] = useState(false);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const negativeMarkValue = 0.25;
  const [showResultImmediately, setShowResultImmediately] = useState(true);
  const showAnswerReview = true;

  // Step 7: Publishing State
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

        if (fList.length > 0) {
          const firstForceId = fList[0].id;
          setSelectedForceId(firstForceId);
        }
      } catch (e) {
        console.warn('Initial load warning:', e);
      }
    }
    loadInitial();
  }, []);

  // 2. Dynamic Course Dependency: When Force Changes, load its Entry Courses
  useEffect(() => {
    if (!selectedForceId) {
      setCourses([]);
      setSelectedCourseId('');
      return;
    }

    async function loadCoursesForForce() {
      try {
        const cList = await configurationService.getCourses(selectedForceId);
        setCourses(cList);
        if (cList.length > 0) {
          setSelectedCourseId(cList[0].id);
        } else {
          setSelectedCourseId('');
        }
      } catch (e) {
        console.warn('Failed to load courses for force:', e);
      }
    }
    loadCoursesForForce();
  }, [selectedForceId]);

  // 3. Dynamic Template Dependency: When Course Changes, load its Pattern Templates
  useEffect(() => {
    if (!selectedCourseId) {
      setTemplates([]);
      setSelectedTemplateId('');
      return;
    }

    async function loadTemplatesForCourse() {
      try {
        const tList = await testPatternService.getTemplates(selectedForceId, selectedCourseId);
        setTemplates(tList);
        if (tList.length > 0) {
          const defaultTpl = tList.find((t) => t.isDefault) || tList[0];
          setSelectedTemplateId(defaultTpl.id);
        } else {
          setSelectedTemplateId('');
          setConfiguredSections([]);
        }
      } catch (e) {
        console.warn('Failed to load templates for course:', e);
      }
    }
    loadTemplatesForCourse();
  }, [selectedForceId, selectedCourseId]);

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
        const course = courses.find((c) => c.id === selectedCourseId);
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
            toast.error(`Section "${s.sectionName}" is mandatory in academy master template.`);
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

      // 1. First find approved questions matching this section's subjects
      let matching = allQuestions.filter(
        (q) =>
          q.status === 'APPROVED' &&
          !usedIds.has(q.id) &&
          (secSubjectIds.includes(q.subject_id || '') || secSubjectCodes.includes(q.subject as string))
      );

      // 2. If not enough matching subject questions, supplement with any approved questions
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
    toast.success(`Allocated ${totalAssigned} approved items across ${activeSections.length} examination sections.`);
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
        toast.error(`Section quota reached (${sec.questionCount} questions). Remove an item before adding another.`);
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

  // Pre-allocate in AUTO mode when entering Step 4 if empty
  useEffect(() => {
    if (currentStep === 4 && assemblyMode === 'AUTO' && totalAllocatedQuestions === 0 && allQuestions.length > 0) {
      handleAutoGenerate();
    }
  }, [currentStep, assemblyMode, allQuestions.length]);

  // Step Validation & Navigation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        toast.error('Please enter a test title.');
        return;
      }
    } else if (currentStep === 2) {
      if (!selectedForceId || !selectedCourseId || !selectedTemplateId) {
        toast.error('Please select Force, Entry Course, and Master Pattern Template.');
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
          toast.error(`Section "${emptySec.sectionName}" has no questions allocated. Please select questions or click "Auto-Fill".`);
          return;
        }
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 7));
  };

  // Step 7: Final Compilation & Publish
  const handlePublish = async () => {
    if (role === 'STUDENT') {
      toast.error('Access Denied: Candidate cadets cannot author or publish tests.');
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
        test: {
          name: title,
          description: description || null,
          force_id: selectedForceId,
          course_id: selectedCourseId,
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

      // Attempt publishing RPC
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
      } catch (pubErr: any) {
        console.error('Publish RPC error:', pubErr);
        throw new Error(`Test created, but publishing failed: ${pubErr?.message || 'Check section question assignments.'}`);
      }

      setPublishing(false);
      toast.success(
        selectedBatchId === 'ALL'
          ? 'Examination successfully compiled, published & delivered to all cadet batches!'
          : 'Universal Examination Blueprint successfully compiled & published!'
      );
      navigate('/admin/tests');
    } catch (err: any) {
      setPublishing(false);
      toast.error(err?.message || 'Failed to compile test.');
    }
  };

  const selectedForce = forces.find((f) => f.id === selectedForceId);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

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
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-md border border-[#D4D9DF] shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#C6A75E] uppercase tracking-wider">
              ARMED FORCES UNIVERSAL EXAMINATION ENGINE
            </span>
            <span className="text-[10px] bg-[#0E1B2A]/5 text-[#0E1B2A] px-2 py-0.5 rounded font-mono font-semibold">
              TRI-SERVICE SPEC
            </span>
          </div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#0E1B2A] mt-0.5">
            Institutional Test Blueprint Builder
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configurable, data-driven test pattern compiler for Pakistan Army, PAF, and Pakistan Navy.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] px-3 py-1 rounded font-bold tabular-nums">
            STAGE {currentStep} OF 7
          </span>
        </div>
      </div>

      {/* 7-Step Stepper Bar */}
      <div className="bg-white border border-[#D4D9DF] rounded-md p-3 shadow-xs">
        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px]">
          {[
            { step: 1, label: '1. Identity' },
            { step: 2, label: '2. Force & Entry' },
            { step: 3, label: '3. Pattern' },
            { step: 4, label: '4. Questions' },
            { step: 5, label: '5. Rules' },
            { step: 6, label: '6. Review' },
            { step: 7, label: '7. Publish' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setCurrentStep(item.step)}
              className={`py-2 px-1 rounded font-bold transition-colors truncate ${
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
          {/* STEP 1: Basic Details */}
          {currentStep === 1 && (
            <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider border-b border-[#E2E6EB] pb-2 flex items-center justify-between">
                <span>Stage 1 — Test Identity & Target Cadre</span>
                <span className="text-[11px] font-normal text-[#64748B] normal-case">Step 1 of 7</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1.5 uppercase tracking-wide">
                    Examination Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 154 PMA Long Course Computerized Screening Exam"
                    className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1.5 uppercase tracking-wide">
                    Description / Directives
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide exam administration directives, syllabus coverage, or session instructions..."
                    className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block font-semibold text-[#0E1B2A] mb-1.5 uppercase tracking-wide flex items-center justify-between">
                      <span>Candidate Batch Deployment</span>
                      <span className="text-[10px] text-[#166534] font-bold bg-[#EDF6F0] px-2 py-0.5 rounded border border-[#86EFAC]">
                        Live Student Delivery
                      </span>
                    </label>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:bg-white font-medium"
                    >
                      <option value="ALL">All Active Batches (Deliver to all enrolled cadets immediately)</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                      <option value="NONE">-- Unassigned / Master Repository Only (Cadets cannot view until assigned) --</option>
                    </select>
                    <p className="text-[11px] text-[#64748B] mt-1.5 leading-relaxed">
                      {selectedBatchId === 'ALL' ? (
                        <span className="text-[#166534] font-medium flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5 inline text-[#16A34A] mr-1 shrink-0" />
                          <span>Delivered to all active batches. All registered student cadets will see this test immediately in their candidate dashboard.</span>
                        </span>
                      ) : selectedBatchId && selectedBatchId !== 'NONE' ? (
                        <span className="text-[#0E1B2A] font-medium flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5 inline text-[#16A34A] mr-1 shrink-0" />
                          <span>Assigned specifically to {batches.find((b) => b.id === selectedBatchId)?.name || 'the selected batch'}.</span>
                        </span>
                      ) : (
                        <span className="text-[#B45309] font-medium flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 inline text-[#D97706] mr-1 shrink-0" />
                          <span>Unassigned: Saved in master catalog only. Cadets cannot see or attempt this examination until assigned to their batch.</span>
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0E1B2A] mb-1.5 uppercase tracking-wide">
                      Test Evaluation Type
                    </label>
                    <select
                      value={testType}
                      onChange={(e) => setTestType(e.target.value as any)}
                      className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:bg-white font-medium"
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

          {/* STEP 2: Force & Entry Course Selection */}
          {currentStep === 2 && (
            <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider border-b border-[#E2E6EB] pb-2 flex items-center justify-between">
                <span>Stage 2 — Armed Force & Induction Course</span>
                <span className="text-[11px] font-normal text-[#64748B] normal-case">Step 2 of 7</span>
              </h2>

              <p className="text-xs text-[#64748B]">
                Select the Armed Force branch and entry course. All courses and pattern templates load dynamically from verified institutional database dockets.
              </p>

              <div className="space-y-4 text-xs">
                {/* Field 1: Force */}
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1.5 uppercase tracking-wide">
                    1. Armed Force Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedForceId}
                    onChange={(e) => setSelectedForceId(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:bg-white font-semibold"
                  >
                    {forces.length === 0 && <option value="">Loading Armed Forces...</option>}
                    {forces.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.headquarters})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 2: Entry Course (Filtered dynamically) */}
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1.5 uppercase tracking-wide">
                    2. Entry / Induction Course <span className="text-red-500">*</span>
                  </label>
                  {courses.length === 0 ? (
                    <div className="p-3 bg-[#F8FAFC] border border-[#D4D9DF] rounded text-xs text-[#64748B]">
                      Loading courses for selected force...
                    </div>
                  ) : (
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:bg-white font-medium"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — ({c.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Field 3: Master Pattern Template */}
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1.5 uppercase tracking-wide">
                    3. Master Pattern Template <span className="text-red-500">*</span>
                  </label>
                  {templates.length === 0 ? (
                    <div className="p-3 bg-[#FEF3C7] border border-[#F59E0B] rounded text-xs text-[#92400E]">
                      No active master pattern template found for this course. Default academy structure will be loaded.
                    </div>
                  ) : (
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:bg-white font-medium"
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (v{t.version}) {t.isDefault ? '— [Default Academy Spec]' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Test Pattern Configuration */}
          {currentStep === 3 && (
            <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-5">
              <div className="border-b border-[#E2E6EB] pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider">
                    Stage 3 — Section Configuration & Academy Defaults
                  </h2>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Customize sections, item counts, and durations according to academy policies.
                  </p>
                </div>
                <span className="text-xs bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] px-2.5 py-0.5 rounded font-bold">
                  {activeSections.length} Sections Active
                </span>
              </div>

              {configuredSections.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded border border-dashed border-[#D4D9DF]">
                  No sections loaded. Please verify Master Pattern Template in Step 2.
                </div>
              ) : (
                <div className="space-y-4">
                  {configuredSections.map((sec, idx) => {
                    const isCustomCount = sec.questionCount !== sec.defaultQuestions;
                    const isCustomDuration = sec.durationMinutes !== sec.defaultDuration;

                    return (
                      <div
                        key={sec.id}
                        className={`p-4 rounded-md border transition-all ${
                          sec.enabled
                            ? 'bg-white border-[#D4D9DF] shadow-xs'
                            : 'bg-[#F8FAFC] border-[#E2E6EB] opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#F1F3F5] pb-3 mb-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={sec.enabled}
                              disabled={sec.isMandatory || !sec.canDisable}
                              onChange={() => toggleSectionEnabled(sec.id)}
                              className="w-4 h-4 rounded border-[#D4D9DF] text-[#0E1B2A] focus:ring-[#0E1B2A]/20 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div>
                              <span className="text-xs font-bold text-[#0E1B2A]">
                                {idx + 1}. {sec.sectionName}
                              </span>
                              <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-[#64748B]">
                                <span className="font-mono">Code: {sec.sectionCode}</span>
                                <span>•</span>
                                <span>
                                  {sec.isMandatory ? (
                                    <span className="text-[#991B1B] font-semibold">Mandatory</span>
                                  ) : (
                                    'Optional Section'
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {isCustomCount || isCustomDuration ? (
                              <span className="text-[10px] bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] px-2 py-0.5 rounded font-semibold">
                                Teacher Override
                              </span>
                            ) : (
                              <span className="text-[10px] bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] px-2 py-0.5 rounded font-medium">
                                Academy Default
                              </span>
                            )}
                          </div>
                        </div>

                        {sec.enabled && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                            <div>
                              <label className="block font-semibold text-[#0E1B2A] mb-1">
                                Question Count (Default: {sec.defaultQuestions})
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  disabled={!sec.canOverrideCount}
                                  value={sec.questionCount}
                                  onChange={(e) => updateSectionQuestionCount(sec.id, Number(e.target.value))}
                                  className="w-28 bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-1.5 text-xs text-[#0E1B2A] font-bold focus:outline-none focus:border-[#0E1B2A] disabled:bg-[#E2E6EB] disabled:cursor-not-allowed"
                                />
                                <span className="text-[11px] text-[#64748B]">
                                  Allowed: {sec.minQuestions} – {sec.maxQuestions}
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block font-semibold text-[#0E1B2A] mb-1">
                                Duration Minutes (Default: {sec.defaultDuration} min)
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  disabled={!sec.canOverrideDuration}
                                  value={sec.durationMinutes}
                                  onChange={(e) => updateSectionDuration(sec.id, Number(e.target.value))}
                                  className="w-28 bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-1.5 text-xs text-[#0E1B2A] font-bold focus:outline-none focus:border-[#0E1B2A] disabled:bg-[#E2E6EB] disabled:cursor-not-allowed"
                                />
                                <span className="text-[11px] text-[#64748B]">
                                  Allowed: {sec.minDuration} – {sec.maxDuration} min
                                </span>
                              </div>
                            </div>

                            {sec.subjects && sec.subjects.length > 0 && (
                              <div className="sm:col-span-2 pt-1 border-t border-[#F1F3F5]">
                                <span className="text-[10px] font-bold uppercase text-[#64748B]">
                                  Integrated Syllabus Subjects:
                                </span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {sec.subjects.map((sub) => (
                                    <span
                                      key={sub.id}
                                      className="text-[10px] bg-[#F1F5F9] text-[#334155] px-2 py-0.5 rounded border border-[#E2E8F0]"
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

          {/* STEP 4: Questions & Subject Allocation */}
          {currentStep === 4 && (
            <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-6">
              <div className="border-b border-[#E2E6EB] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider">
                    Stage 4 — Question Bank Composition
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Select or automatically allocate verified question bank items across your examination sections.
                  </p>
                </div>
                <span className="text-[11px] font-normal text-[#64748B]">Step 4 of 7</span>
              </div>

              {/* Assembly Mode Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setAssemblyMode('AUTO')}
                  className={`p-4 rounded-md border text-left transition-all ${
                    assemblyMode === 'AUTO'
                      ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] ring-1 ring-[#86EFAC] shadow-xs'
                      : 'bg-white border-[#D4D9DF] text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    <Sparkles className="w-4 h-4 text-[#16A34A]" />
                    <span>Automatic Balanced Allocation</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
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
                  className={`p-4 rounded-md border text-left transition-all ${
                    assemblyMode === 'MANUAL'
                      ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] ring-1 ring-[#86EFAC] shadow-xs'
                      : 'bg-white border-[#D4D9DF] text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    <BookOpen className="w-4 h-4 text-[#0E1B2A]" />
                    <span>Manual Item Selection</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Inspect, search, and manually hand-pick individual items from the active question bank catalog for each section.
                  </p>
                </button>
              </div>

              {/* Allocation Summary Card */}
              <div className="bg-[#F8FAFC] border border-[#D4D9DF] rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0E1B2A] flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-[#C6A75E]" />
                    <span>Overall Examination Composition</span>
                  </span>
                  <span className="text-xs">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {activeSections.map((sec) => {
                    const count = (sectionQuestionMap[sec.id] || []).length;
                    const isMet = count >= sec.questionCount;
                    return (
                      <div
                        key={sec.id}
                        className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                          isMet
                            ? 'bg-white border-[#86EFAC] text-[#166534]'
                            : 'bg-white border-[#E2E6EB] text-[#334155]'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-semibold truncate">{sec.sectionName}</p>
                          <p className="text-[10px] text-[#64748B]">
                            {sec.subjects?.map((s) => s.name).join(', ') || 'General Syllabus'}
                          </p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              isMet
                                ? 'bg-[#EDF6F0] text-[#166534]'
                                : count > 0
                                ? 'bg-[#FEF3C7] text-[#92400E]'
                                : 'bg-[#F1F5F9] text-[#64748B]'
                            }`}
                          >
                            {count} / {sec.questionCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAutoGenerate}
                    className="inline-flex items-center space-x-1.5 bg-[#0E1B2A] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#1A2C42] transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C6A75E]" />
                    <span>Auto-Allocate All Sections</span>
                  </button>

                  {assemblyMode === 'AUTO' && totalAllocatedQuestions > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssemblyMode('MANUAL');
                        if (activeSections.length > 0) setActiveSectionTab(activeSections[0].id);
                      }}
                      className="text-xs text-[#0E1B2A] font-semibold underline hover:text-[#1A2C42]"
                    >
                      Switch to Manual View to Inspect & Customize
                    </button>
                  )}
                </div>
              </div>

              {/* MANUAL SELECTION WORKSPACE */}
              {assemblyMode === 'MANUAL' && (
                <div className="space-y-4 pt-2 border-t border-[#E2E6EB]">
                  {/* Section Tabs */}
                  <div>
                    <label className="block font-semibold text-[#0E1B2A] mb-2 uppercase tracking-wide text-xs">
                      Select Section to Author / Pick Questions:
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
                            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center space-x-2 transition-all ${
                              isSelected
                                ? 'bg-[#0E1B2A] text-white shadow-xs ring-1 ring-[#0E1B2A]'
                                : 'bg-[#F8FAFC] border border-[#D4D9DF] text-[#334155] hover:bg-[#F1F5F9]'
                            }`}
                          >
                            <span>{sec.sectionName}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
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

                  {/* Active Section Workstation */}
                  {currentActiveSec && (
                    <div className="bg-white border border-[#D4D9DF] rounded-md p-4 space-y-4">
                      {/* Header with quota & quick actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E6EB]">
                        <div>
                          <h3 className="text-xs font-bold text-[#0E1B2A] flex items-center space-x-2">
                            <span>Questions for: {currentActiveSec.sectionName}</span>
                            <span className="text-[#64748B] font-normal">
                              (Section Code: {currentActiveSec.sectionCode})
                            </span>
                          </h3>
                          <p className="text-[11px] text-[#64748B] mt-0.5">
                            Target Quota: <strong>{currentActiveSec.questionCount}</strong> questions • Currently
                            Selected:{' '}
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
                            className="inline-flex items-center space-x-1 bg-[#F0FDF4] border border-[#86EFAC] text-[#166534] px-2.5 py-1.5 rounded text-xs font-semibold hover:bg-[#DCFCE7]"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
                            <span>Auto-Fill Section</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => clearSectionQuestions(currentActiveSec.id)}
                            className="inline-flex items-center space-x-1 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] px-2.5 py-1.5 rounded text-xs font-semibold hover:bg-[#FFE4E6]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear</span>
                          </button>
                        </div>
                      </div>

                      {/* Filters Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                        <div className="sm:col-span-6 relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#64748B]" />
                          <input
                            type="text"
                            value={questionSearch}
                            onChange={(e) => setQuestionSearch(e.target.value)}
                            placeholder="Search question stem or code..."
                            className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#D4D9DF] rounded text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <select
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                            className="w-full py-1.5 px-2 bg-[#F8FAFC] border border-[#D4D9DF] rounded text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
                          >
                            <option value="ALL">All Subjects</option>
                            {currentActiveSec.subjects?.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} (Syllabus)
                              </option>
                            ))}
                            {Array.from(new Set(allQuestions.map((q) => q.subject_id).filter(Boolean))).map(
                              (subId) => {
                                const qObj = allQuestions.find((q) => q.subject_id === subId);
                                if (currentActiveSec.subjects?.some((s) => s.id === subId)) return null;
                                return (
                                  <option key={subId} value={subId}>
                                    {qObj?.subjectName || qObj?.subject || subId}
                                  </option>
                                );
                              }
                            )}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value)}
                            className="w-full py-1.5 px-2 bg-[#F8FAFC] border border-[#D4D9DF] rounded text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
                          >
                            <option value="ALL">All Difficulties</option>
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                          </select>
                        </div>
                      </div>

                      {/* Questions Table / List */}
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {filteredQuestionsForActiveSec.length === 0 ? (
                          <div className="text-center py-8 bg-[#F8FAFC] rounded border border-dashed border-[#D4D9DF]">
                            <BookOpen className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                            <p className="text-xs font-semibold text-[#0E1B2A]">No Matching Questions Found</p>
                            <p className="text-[11px] text-[#64748B] mt-1">
                              Try adjusting search filters or use "Auto-Fill Section" to draw from the general approved bank.
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
                                className={`p-3 rounded-md border text-xs transition-all ${
                                  isSelectedInThisSec
                                    ? 'bg-[#F0FDF4] border-[#86EFAC]'
                                    : isUsedInOtherSec
                                    ? 'bg-[#F8FAFC] border-[#E2E6EB] opacity-60'
                                    : 'bg-white border-[#D4D9DF] hover:border-[#94A3B8]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-mono text-[10px] font-bold text-[#0E1B2A] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                                        {q.code || q.id.slice(0, 8)}
                                      </span>
                                      <span className="text-[10px] bg-[#EEF2FF] text-[#3730A3] px-2 py-0.5 rounded font-medium">
                                        {q.subjectName || q.subject}
                                      </span>
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
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
                                        <span className="text-[10px] text-[#64748B] italic">
                                          (Assigned to another section)
                                        </span>
                                      )}
                                    </div>

                                    <p className="font-semibold text-[#0E1B2A] text-xs leading-relaxed">
                                      {q.stem}
                                    </p>

                                    {/* Options preview */}
                                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                                      {q.options.map((opt) => (
                                        <div
                                          key={opt.id}
                                          className={`px-2 py-1 rounded border flex items-center space-x-1.5 ${
                                            opt.id === q.correctOptionId
                                              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] font-medium'
                                              : 'bg-white border-[#E2E6EB] text-[#475569]'
                                          }`}
                                        >
                                          <span className="font-bold text-[10px]">{opt.label}.</span>
                                          <span className="truncate">{opt.text}</span>
                                          {opt.id === q.correctOptionId && (
                                            <Check className="w-3 h-3 text-[#059669] ml-auto shrink-0" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Toggle Checkbox / Button */}
                                  <button
                                    type="button"
                                    disabled={isUsedInOtherSec}
                                    onClick={() => toggleQuestionForSection(currentActiveSec.id, q.id)}
                                    className={`px-3 py-1.5 rounded text-xs font-bold shrink-0 transition-all ${
                                      isSelectedInThisSec
                                        ? 'bg-[#16A34A] hover:bg-[#15803D] text-white'
                                        : isUsedInOtherSec
                                        ? 'bg-[#E2E6EB] text-[#94A3B8] cursor-not-allowed'
                                        : 'bg-[#0E1B2A] hover:bg-[#1A2C42] text-white'
                                    }`}
                                  >
                                    {isSelectedInThisSec ? (
                                      <span className="flex items-center space-x-1">
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Selected</span>
                                      </span>
                                    ) : (
                                      <span className="flex items-center space-x-1">
                                        <Plus className="w-3.5 h-3.5" />
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

              {/* AUTO SELECTION PREVIEW WORKSPACE */}
              {assemblyMode === 'AUTO' && (
                <div className="space-y-3 pt-2 border-t border-[#E2E6EB]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#0E1B2A] uppercase tracking-wide">
                      Automated Question Allocation Preview
                    </h3>
                    <span className="text-[11px] text-[#64748B]">
                      Dynamic balance: Approved questions selected per section syllabus
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activeSections.map((sec) => {
                      const secQuestions = (sectionQuestionMap[sec.id] || [])
                        .map((id) => allQuestions.find((q) => q.id === id))
                        .filter(Boolean) as Question[];

                      return (
                        <div key={sec.id} className="border border-[#D4D9DF] rounded p-3 bg-[#F8FAFC] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#0E1B2A] flex items-center space-x-2">
                              <span>{sec.sectionName}</span>
                              <span className="text-[10px] text-[#64748B] font-normal">({sec.sectionCode})</span>
                            </span>
                            <span className="font-mono text-xs font-bold text-[#166534]">
                              {secQuestions.length} / {sec.questionCount} Questions Allocated
                            </span>
                          </div>

                          {secQuestions.length > 0 ? (
                            <div className="space-y-1 pt-1">
                              {secQuestions.slice(0, 3).map((q, idx) => (
                                <div key={q.id} className="text-[11px] text-[#334155] flex items-center space-x-2 truncate">
                                  <span className="text-[#64748B] font-mono w-4">{idx + 1}.</span>
                                  <span className="truncate">{q.stem}</span>
                                </div>
                              ))}
                              {secQuestions.length > 3 && (
                                <p className="text-[10px] text-[#64748B] italic pl-6">
                                  + {secQuestions.length - 3} more questions allocated for this section
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-[#94A3B8] italic">
                              Will be generated dynamically on compile using institutional subject pool.
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

          {/* STEP 5: Exam Rules */}
          {currentStep === 5 && (
            <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider border-b border-[#E2E6EB] pb-2 flex items-center justify-between">
                <span>Stage 5 — CBT Administration & Proctoring Rules</span>
                <span className="text-[11px] font-normal text-[#64748B] normal-case">Step 5 of 7</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-[#F8FAFC] border border-[#D4D9DF] rounded space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shuffleQuestions}
                        onChange={(e) => setShuffleQuestions(e.target.checked)}
                        className="w-4 h-4 rounded border-[#D4D9DF] text-[#0E1B2A]"
                      />
                      <span className="font-semibold text-[#0E1B2A]">Randomize Question Order</span>
                    </label>
                    <p className="text-[11px] text-[#64748B] pl-6">
                      Presents questions in randomized sequence for each terminal to prevent peer copying.
                    </p>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#D4D9DF] rounded space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shuffleOptions}
                        onChange={(e) => setShuffleOptions(e.target.checked)}
                        className="w-4 h-4 rounded border-[#D4D9DF] text-[#0E1B2A]"
                      />
                      <span className="font-semibold text-[#0E1B2A]">Randomize Options Order</span>
                    </label>
                    <p className="text-[11px] text-[#64748B] pl-6">
                      Shuffles options (A, B, C, D) per question on the candidate client interface.
                    </p>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#D4D9DF] rounded space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowSectionNavigation}
                        onChange={(e) => setAllowSectionNavigation(e.target.checked)}
                        className="w-4 h-4 rounded border-[#D4D9DF] text-[#0E1B2A]"
                      />
                      <span className="font-semibold text-[#0E1B2A]">Allow Section Free Navigation</span>
                    </label>
                    <p className="text-[11px] text-[#64748B] pl-6">
                      If disabled, candidates must complete sections strictly in sequential lockstep.
                    </p>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#D4D9DF] rounded space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={negativeMarking}
                        onChange={(e) => setNegativeMarking(e.target.checked)}
                        className="w-4 h-4 rounded border-[#D4D9DF] text-[#0E1B2A]"
                      />
                      <span className="font-semibold text-[#0E1B2A]">Enforce Negative Marking</span>
                    </label>
                    <p className="text-[11px] text-[#64748B] pl-6">
                      Deduct {negativeMarkValue} mark for each incorrect response.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase">
                      Minimum Passing Score (%)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={90}
                      value={passingScorePercent}
                      onChange={(e) => setPassingScorePercent(Number(e.target.value))}
                      className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase">
                      Post-Exam Result Display
                    </label>
                    <select
                      value={showResultImmediately ? 'YES' : 'NO'}
                      onChange={(e) => setShowResultImmediately(e.target.value === 'YES')}
                      className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] font-medium"
                    >
                      <option value="YES">Display Score & Merit Ranking Immediately</option>
                      <option value="NO">Proctor Reserved Release</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Audit */}
          {currentStep === 6 && (
            <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider border-b border-[#E2E6EB] pb-2 flex items-center justify-between">
                <span>Stage 6 — Blueprint Specification Audit</span>
                <span className="text-[11px] font-normal text-[#64748B] normal-case">Step 6 of 7</span>
              </h2>

              <div className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFC] p-4 rounded-md border border-[#E2E6EB]">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#64748B] block">Force</span>
                    <span className="font-bold text-[#0E1B2A]">{selectedForce?.name || 'Pakistan Armed Forces'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#64748B] block">Course</span>
                    <span className="font-bold text-[#0E1B2A]">{selectedCourse?.name || 'Screening'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#64748B] block">Total Questions</span>
                    <span className="font-bold text-[#0E1B2A]">{totalQuestions} Items</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#64748B] block">Duration</span>
                    <span className="font-bold text-[#0E1B2A]">{totalDurationMinutes} Minutes</span>
                  </div>
                </div>

                <div className="border border-[#D4D9DF] rounded-md overflow-hidden">
                  <div className="bg-[#0E1B2A] text-white px-4 py-2 font-bold text-[11px] uppercase tracking-wide">
                    Enabled Examination Sections
                  </div>
                  <div className="divide-y divide-[#E2E6EB]">
                    {activeSections.map((sec, i) => (
                      <div key={sec.id} className="p-3 flex items-center justify-between bg-white">
                        <div>
                          <span className="font-bold text-[#0E1B2A]">
                            {i + 1}. {sec.sectionName}
                          </span>
                          <div className="text-[10px] text-[#64748B] mt-0.5">
                            Code: {sec.sectionCode} • Pass: 50%
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#0E1B2A] block">{sec.questionCount} Questions</span>
                          <span className="text-[10px] text-[#64748B]">{sec.durationMinutes} Minutes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#EDF6F0] border border-[#88BE9B] rounded-md text-xs text-[#234E35] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#234E35]" />
                    <span>Specification conforms to Academy CBT Standards. Ready for compilation.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Publish & Assign */}
          {currentStep === 7 && (
            <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-5 text-center">
              <div className="w-12 h-12 bg-[#EDF6F0] border border-[#88BE9B] rounded-full flex items-center justify-center mx-auto text-[#234E35]">
                <FileCheck className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#0E1B2A] uppercase tracking-wide">
                  Publish to Examination Network
                </h2>
                <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
                  Compiles snapshot blueprint into database tables, locks section configuration, and prepares test delivery terminals.
                </p>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#D4D9DF] rounded-md max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Blueprint:</span>
                  <strong className="text-[#0E1B2A]">{title}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Target Cadre:</span>
                  <span className="text-[#0E1B2A]">{selectedCourse?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Cadet Deployment:</span>
                  <span className="text-[#166534] font-bold">
                    {selectedBatchId === 'ALL'
                      ? 'All Active Batches (Immediate Access)'
                      : selectedBatch
                      ? selectedBatch.name
                      : 'Unassigned (Archive Only)'}
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
                  className="inline-flex items-center space-x-2 bg-[#0E1B2A] hover:bg-[#1A2C42] text-white px-8 py-3 rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C6A75E]" />
                      <span>Compiling Blueprint...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#C6A75E]" />
                      <span>Compile & Publish Test</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Control Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#D4D9DF]">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 bg-white border border-[#D4D9DF] text-[#0E1B2A] rounded text-xs font-bold uppercase tracking-wider hover:bg-[#F8FAFC] disabled:opacity-40"
            >
              Previous
            </button>

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center space-x-1 px-5 py-2 bg-[#0E1B2A] text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1A2C42]"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4 text-[#C6A75E]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/admin/tests')}
                className="px-4 py-2 bg-white border border-[#D4D9DF] text-[#64748B] rounded text-xs font-bold uppercase tracking-wider hover:bg-[#F8FAFC]"
              >
                Back to Tests
              </button>
            )}
          </div>
        </div>

        {/* Right Audit Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-xs space-y-4 text-xs font-sans">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] border-b border-[#E2E6EB] pb-2 flex items-center justify-between">
              <span>Blueprint Audit Docket</span>
              <Shield className="w-3.5 h-3.5 text-[#C6A75E]" />
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#64748B] block">Force Branch</span>
                <span className="font-bold text-[#0E1B2A]">{selectedForce?.name || '—'}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-[#64748B] block">Entry / Course</span>
                <span className="font-bold text-[#0E1B2A]">{selectedCourse?.name || '—'}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-[#64748B] block">Pattern Template</span>
                <span className="font-medium text-[#0E1B2A]">{selectedTemplate?.name || 'Default Pattern'}</span>
              </div>

              <div className="pt-2 border-t border-[#E2E6EB] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Active Sections:</span>
                  <strong className="text-[#0E1B2A]">{activeSections.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Total Question Items:</span>
                  <strong className="text-[#0E1B2A]">{totalQuestions}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Total Allocated Time:</span>
                  <strong className="text-[#0E1B2A]">{totalDurationMinutes} min</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Passing Threshold:</span>
                  <strong className="text-[#0E1B2A]">{passingScorePercent}%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Negative Marking:</span>
                  <strong className="text-[#0E1B2A]">{negativeMarking ? `Yes (-${negativeMarkValue})` : 'None'}</strong>
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E6EB] p-3 rounded text-[11px] text-[#64748B] leading-relaxed">
              <strong>Immutability Guarantee:</strong> Once published, changes to master pattern templates will not alter this test or candidate results.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestBuilderPage;
