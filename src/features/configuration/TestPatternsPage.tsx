import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { configurationService } from '@/services/configurationService';
import {
  testPatternService,
  TestPatternTemplate,
  TestPatternSection,
} from '@/services/testPatternService';
import { ForceConfig, CourseConfig, SubjectConfig } from '@/features/configuration/types';
import {
  Layers,
  Save,
  Plus,
  Trash2,
  Loader2,
  X,
  BookOpen,
  Sliders,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

export const TestPatternsPage: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [forces, setForces] = useState<ForceConfig[]>([]);
  const [courses, setCourses] = useState<CourseConfig[]>([]);
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
  const [selectedForceId, setSelectedForceId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [templates, setTemplates] = useState<TestPatternTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TestPatternTemplate | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState<boolean>(false);

  // New Template Form State
  const [newTplName, setNewTplName] = useState<string>('');
  const [newTplDescription, setNewTplDescription] = useState<string>('');
  const [newTplStage, setNewTplStage] = useState<string>('INITIAL');
  const [newTplIsDefault, setNewTplIsDefault] = useState<boolean>(false);
  const [creatingTpl, setCreatingTpl] = useState<boolean>(false);

  // New Section Form State
  const [newSecName, setNewSecName] = useState<string>('');
  const [newSecCode, setNewSecCode] = useState<string>('');
  const [newSecQuestions, setNewSecQuestions] = useState<number>(30);
  const [newSecMinQuestions, setNewSecMinQuestions] = useState<number>(10);
  const [newSecMaxQuestions, setNewSecMaxQuestions] = useState<number>(100);
  const [newSecDuration, setNewSecDuration] = useState<number>(25);
  const [newSecMinDuration, setNewSecMinDuration] = useState<number>(10);
  const [newSecMaxDuration, setNewSecMaxDuration] = useState<number>(60);
  const [newSecPassing, setNewSecPassing] = useState<number>(50);
  const [newSecMandatory, setNewSecMandatory] = useState<boolean>(false);
  const [newSecCanDisable, setNewSecCanDisable] = useState<boolean>(true);
  const [newSecCanOverrideCount, setNewSecCanOverrideCount] = useState<boolean>(true);
  const [newSecCanOverrideDuration, setNewSecCanOverrideDuration] = useState<boolean>(true);
  const [newSecSelectedSubjects, setNewSecSelectedSubjects] = useState<string[]>([]);
  const [addingSec, setAddingSec] = useState<boolean>(false);

  // 1. Load Initial Forces and Subjects
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [fList, sList] = await Promise.all([
          configurationService.getForces(),
          configurationService.getSubjects(),
        ]);
        setForces(fList);
        setSubjects(sList);
        if (fList.length > 0) {
          setSelectedForceId(fList[0].id);
        }
      } catch (e) {
        console.warn('Error loading catalog:', e);
      }
    }
    loadCatalog();
  }, []);

  // 2. Load Courses when selected force changes
  useEffect(() => {
    if (!selectedForceId) {
      setCourses([]);
      setSelectedCourseId('');
      return;
    }
    async function loadCourses() {
      try {
        const cList = await configurationService.getCourses(selectedForceId);
        setCourses(cList);
        if (cList.length > 0) {
          setSelectedCourseId(cList[0].id);
        } else {
          setSelectedCourseId('');
        }
      } catch (e) {
        console.warn('Error loading courses for force:', e);
      }
    }
    loadCourses();
  }, [selectedForceId]);

  // 3. Load Templates when Force or Course changes
  const reloadTemplates = async (preferTemplateId?: string) => {
    if (!selectedCourseId) {
      setTemplates([]);
      setSelectedTemplate(null);
      return;
    }
    setLoading(true);
    try {
      const tList = await testPatternService.getTemplates(selectedForceId, selectedCourseId);
      setTemplates(tList);
      if (tList.length > 0) {
        const targetId = preferTemplateId || tList[0].id;
        const details = await testPatternService.getTemplateDetails(targetId);
        setSelectedTemplate(details || tList[0]);
      } else {
        setSelectedTemplate(null);
      }
    } catch (e) {
      console.warn('Error loading templates:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadTemplates();
  }, [selectedForceId, selectedCourseId]);

  const handleSelectTemplate = async (tplId: string) => {
    try {
      const details = await testPatternService.getTemplateDetails(tplId);
      setSelectedTemplate(details);
    } catch (e) {
      console.warn('Error selecting template:', e);
    }
  };

  // Section fields updates in state
  const handleUpdateSectionField = (secId: string, field: keyof TestPatternSection, value: any) => {
    if (!selectedTemplate || !selectedTemplate.sections) return;
    const updatedSections = selectedTemplate.sections.map((s) =>
      s.id === secId ? { ...s, [field]: value } : s
    );
    setSelectedTemplate({ ...selectedTemplate, sections: updatedSections });
  };

  // Template top-level fields updates
  const handleUpdateTemplateField = (field: keyof TestPatternTemplate, value: any) => {
    if (!selectedTemplate) return;
    setSelectedTemplate({ ...selectedTemplate, [field]: value });
  };

  // SAVE TO DATABASE
  const handleSaveMasterTemplate = async () => {
    if (!isAdmin) {
      toast.error('Only Command Administrators have permission to modify master patterns.');
      return;
    }
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      await testPatternService.saveTemplate(selectedTemplate);
      toast.success(`Pattern "${selectedTemplate.name}" specifications successfully updated in database!`);
      // Update entry in local templates list
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === selectedTemplate.id
            ? {
                ...t,
                name: selectedTemplate.name,
                description: selectedTemplate.description,
                version: selectedTemplate.version,
                isDefault: selectedTemplate.isDefault,
              }
            : t
        )
      );
    } catch (err: any) {
      console.error('Error saving template:', err);
      toast.error(err?.message || 'Failed to save master pattern.');
    } finally {
      setSaving(false);
    }
  };

  // CREATE NEW TEMPLATE
  const handleCreateTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim()) {
      toast.error('Please enter a pattern name.');
      return;
    }
    if (!selectedForceId || !selectedCourseId) {
      toast.error('Please select both Force and Course first.');
      return;
    }

    setCreatingTpl(true);
    try {
      const created = await testPatternService.createTemplate({
        forceId: selectedForceId,
        entryCourseId: selectedCourseId,
        name: newTplName.trim(),
        description: newTplDescription.trim() || undefined,
        stage: newTplStage,
        isDefault: newTplIsDefault,
      });

      toast.success(`Master Pattern "${created.name}" created successfully!`);
      setShowCreateModal(false);
      setNewTplName('');
      setNewTplDescription('');
      setNewTplIsDefault(false);
      await reloadTemplates(created.id);
    } catch (err: any) {
      console.error('Error creating template:', err);
      toast.error(err?.message || 'Failed to create pattern template.');
    } finally {
      setCreatingTpl(false);
    }
  };

  // DELETE TEMPLATE
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete Master Pattern "${selectedTemplate.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await testPatternService.deleteTemplate(selectedTemplate.id);
      toast.success(`Pattern "${selectedTemplate.name}" deleted from registry.`);
      await reloadTemplates();
    } catch (err: any) {
      console.error('Error deleting template:', err);
      toast.error(err?.message || 'Failed to delete template.');
    }
  };

  // ADD SECTION TO TEMPLATE
  const handleAddSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    if (!newSecName.trim() || !newSecCode.trim()) {
      toast.error('Please specify both section name and section code.');
      return;
    }

    setAddingSec(true);
    try {
      const nextDisplayOrder = (selectedTemplate.sections?.length || 0) + 1;
      const createdSection = await testPatternService.addSection(
        selectedTemplate.id,
        {
          sectionName: newSecName.trim(),
          sectionCode: newSecCode.trim().toUpperCase(),
          displayOrder: nextDisplayOrder,
          defaultEnabled: true,
          defaultQuestionCount: newSecQuestions,
          minQuestionCount: newSecMinQuestions,
          maxQuestionCount: newSecMaxQuestions,
          defaultDurationMinutes: newSecDuration,
          minDurationMinutes: newSecMinDuration,
          maxDurationMinutes: newSecMaxDuration,
          passingPercentage: newSecPassing,
          isMandatory: newSecMandatory,
          teacherCanDisable: newSecCanDisable,
          teacherCanOverrideQuestionCount: newSecCanOverrideCount,
          teacherCanOverrideDuration: newSecCanOverrideDuration,
          teacherCanReorder: true,
          questionType: 'MCQ_SINGLE',
          sectionType: 'STANDARD',
        },
        newSecSelectedSubjects
      );

      // Attach subject names for UI display
      const attachedSubjects = subjects
        .filter((s) => newSecSelectedSubjects.includes(s.id))
        .map((s) => ({ id: s.id, code: s.code, name: s.name, isDefault: true }));

      const updated = {
        ...selectedTemplate,
        sections: [...(selectedTemplate.sections || []), { ...createdSection, subjects: attachedSubjects }],
      };

      setSelectedTemplate(updated);
      toast.success(`Section "${createdSection.sectionName}" successfully added to pattern!`);
      setShowAddSectionModal(false);

      // Reset form
      setNewSecName('');
      setNewSecCode('');
      setNewSecSelectedSubjects([]);
    } catch (err: any) {
      console.error('Error adding section:', err);
      toast.error(err?.message || 'Failed to add section.');
    } finally {
      setAddingSec(false);
    }
  };

  // DELETE SECTION
  const handleDeleteSection = async (secId: string, secName: string) => {
    if (!isAdmin || !selectedTemplate) return;
    const confirmDelete = window.confirm(`Remove section "${secName}" from this master template?`);
    if (!confirmDelete) return;

    try {
      await testPatternService.deleteSection(secId);
      const remaining = (selectedTemplate.sections || []).filter((s) => s.id !== secId);
      setSelectedTemplate({ ...selectedTemplate, sections: remaining });
      toast.success(`Section "${secName}" removed from template.`);
    } catch (err: any) {
      console.error('Error removing section:', err);
      toast.error(err?.message || 'Failed to remove section.');
    }
  };

  const selectedForce = forces.find((f) => f.id === selectedForceId);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-md border border-[#D4D9DF] shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-[#C6A75E] uppercase tracking-wider">
              ACADEMY SPECIFICATION REGISTRY
            </span>
            <span className="text-[10px] bg-[#0E1B2A]/5 text-[#0E1B2A] px-2 py-0.5 rounded font-mono font-semibold">
              TRI-SERVICE STANDARDS
            </span>
            {isAdmin ? (
              <span className="text-[10px] bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] px-2 py-0.5 rounded font-semibold">
                HQ Admin Mode (Full Edit)
              </span>
            ) : (
              <span className="text-[10px] bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] px-2 py-0.5 rounded font-semibold">
                Faculty Mode (Read-Only)
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#0E1B2A] mt-0.5">
            Test Pattern Templates Master Registry
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Define, customize, and maintain examination blueprints, academy default counts, item bounds, durations, and faculty override permissions.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-1.5 bg-[#F1F5F9] text-[#0E1B2A] border border-[#CBD5E1] px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors"
            >
              <Plus className="w-4 h-4 text-[#0E1B2A]" />
              <span>New Pattern</span>
            </button>

            {selectedTemplate && (
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveMasterTemplate}
                className="inline-flex items-center space-x-1.5 bg-[#0E1B2A] text-white px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#1A2C42] transition-colors shadow-xs disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C6A75E]" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#C6A75E]" />
                    <span>Save Specifications</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Force & Entry Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-md border border-[#D4D9DF] shadow-xs text-xs">
        <div>
          <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase tracking-wide">
            Armed Force Branch
          </label>
          <select
            value={selectedForceId}
            onChange={(e) => setSelectedForceId(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] font-semibold"
          >
            {forces.length === 0 && <option value="">Loading Armed Forces...</option>}
            {forces.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.headquarters})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase tracking-wide">
            Induction / Entry Course
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] font-medium"
          >
            {courses.length === 0 && <option value="">No courses available for selected branch</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates List & Section Details Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Template Selector (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-2">
              <span className="text-xs font-bold uppercase tracking-wide text-[#0E1B2A]">
                Available Patterns ({templates.length})
              </span>
              <Layers className="w-3.5 h-3.5 text-[#64748B]" />
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-[#64748B] flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#0E1B2A]" />
                <span>Loading blueprints...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#64748B] space-y-2">
                <p>No master templates configured for {selectedCourse?.name || 'this course'}.</p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#0E1B2A] hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Blueprint Now</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`w-full text-left p-3 rounded border text-xs transition-all ${
                      selectedTemplate?.id === tpl.id
                        ? 'bg-[#0E1B2A] text-white border-[#0E1B2A] shadow-xs'
                        : 'bg-[#F8FAFC] text-[#0E1B2A] border-[#D4D9DF] hover:bg-white'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span className="truncate">{tpl.name}</span>
                      {tpl.isDefault && (
                        <span className="text-[9px] bg-[#C6A75E] text-white px-1.5 py-0.2 rounded font-mono uppercase">
                          Default
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] mt-0.5 flex items-center space-x-1.5 ${
                        selectedTemplate?.id === tpl.id ? 'text-[#C6A75E]' : 'text-[#64748B]'
                      }`}
                    >
                      <span>v{tpl.version}</span>
                      <span>•</span>
                      <span>Stage: {tpl.stage || 'INITIAL'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Section Blueprint Details (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedTemplate ? (
            <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-5">
              {/* Template Header & Actions */}
              <div className="border-b border-[#E2E6EB] pb-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {isAdmin ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={selectedTemplate.name}
                            onChange={(e) => handleUpdateTemplateField('name', e.target.value)}
                            className="text-sm font-bold uppercase tracking-wider text-[#0E1B2A] bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2.5 py-1 w-full max-w-md focus:bg-white focus:outline-none"
                            placeholder="Template Name"
                          />
                          <span className="text-[10px] bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] px-2 py-0.5 rounded font-mono font-bold">
                            v{selectedTemplate.version}
                          </span>
                        </div>

                        <textarea
                          rows={2}
                          value={selectedTemplate.description || ''}
                          onChange={(e) => handleUpdateTemplateField('description', e.target.value)}
                          placeholder="Institutional directives and description for this testing specification..."
                          className="w-full text-xs text-[#0E1B2A] bg-[#F8FAFC] border border-[#CBD5E1] rounded p-2 focus:bg-white focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0E1B2A]">
                            {selectedTemplate.name}
                          </h2>
                          <span className="text-[10px] bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] px-2 py-0.5 rounded font-mono font-bold">
                            v{selectedTemplate.version}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-1">{selectedTemplate.description}</p>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      title="Delete this master pattern"
                      onClick={handleDeleteTemplate}
                      className="p-2 text-[#991B1B] hover:bg-[#FEE2E2] rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center space-x-4 pt-1 text-xs">
                    <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-[#334155]">
                      <input
                        type="checkbox"
                        checked={selectedTemplate.isDefault}
                        onChange={(e) => handleUpdateTemplateField('isDefault', e.target.checked)}
                        className="rounded border-[#D4D9DF]"
                      />
                      <span>Set as Default Academy Pattern for Course</span>
                    </label>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-[#64748B] font-medium">Stage:</span>
                      <select
                        value={selectedTemplate.stage || 'INITIAL'}
                        onChange={(e) => handleUpdateTemplateField('stage', e.target.value)}
                        className="bg-[#F8FAFC] border border-[#CBD5E1] rounded px-2 py-0.5 text-xs font-semibold"
                      >
                        <option value="INITIAL">INITIAL (Screening)</option>
                        <option value="MOCK">MOCK (Full Simulation)</option>
                        <option value="FINAL">FINAL (Board Exam)</option>
                        <option value="ADVANCED">ADVANCED (Specialized)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Sections Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A]">
                    Ordered Examination Sections ({selectedTemplate.sections?.length || 0})
                  </h3>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowAddSectionModal(true)}
                      className="inline-flex items-center space-x-1 text-xs bg-[#F1F5F9] text-[#0E1B2A] border border-[#CBD5E1] px-2.5 py-1 rounded font-bold hover:bg-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#0E1B2A]" />
                      <span>Add Section</span>
                    </button>
                  )}
                </div>

                {selectedTemplate.sections?.length === 0 ? (
                  <div className="p-6 bg-[#F8FAFC] border border-dashed border-[#D4D9DF] rounded text-center text-xs text-[#64748B]">
                    No sections configured in this pattern. Click "Add Section" above to define testing modules.
                  </div>
                ) : (
                  selectedTemplate.sections?.map((sec, idx) => (
                    <div key={sec.id} className="p-4 bg-[#F8FAFC] border border-[#D4D9DF] rounded-md space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#0E1B2A]">
                            {idx + 1}. {sec.sectionName}
                          </span>
                          <span className="text-[10px] text-[#64748B] font-mono">[{sec.sectionCode}]</span>
                        </div>

                        <div className="flex items-center space-x-2 text-[10px]">
                          <span
                            className={`px-2 py-0.5 rounded border font-semibold ${
                              sec.isMandatory
                                ? 'bg-[#FEE2E2] text-[#991B1B] border-[#F87171]'
                                : 'bg-[#EDF6F0] text-[#234E35] border-[#88BE9B]'
                            }`}
                          >
                            {sec.isMandatory ? 'Mandatory' : 'Optional'}
                          </span>

                          <span className="bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded border border-[#CBD5E1]">
                            Pass: {sec.passingPercentage}%
                          </span>

                          {isAdmin && (
                            <button
                              type="button"
                              title="Delete this section"
                              onClick={() => handleDeleteSection(sec.id, sec.sectionName)}
                              className="p-1 text-[#991B1B] hover:bg-[#FEE2E2] rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-[10px] text-[#64748B] uppercase font-bold block mb-1">
                            Default Questions
                          </span>
                          <input
                            type="number"
                            disabled={!isAdmin}
                            value={sec.defaultQuestionCount}
                            onChange={(e) =>
                              handleUpdateSectionField(sec.id, 'defaultQuestionCount', Number(e.target.value))
                            }
                            className="w-full bg-white border border-[#D4D9DF] rounded px-2 py-1 font-bold text-xs focus:outline-none focus:border-[#0E1B2A] disabled:bg-[#F1F5F9]"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-[#64748B] uppercase font-bold block mb-1">
                            Default Duration
                          </span>
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              disabled={!isAdmin}
                              value={sec.defaultDurationMinutes}
                              onChange={(e) =>
                                handleUpdateSectionField(sec.id, 'defaultDurationMinutes', Number(e.target.value))
                              }
                              className="w-full bg-white border border-[#D4D9DF] rounded px-2 py-1 font-bold text-xs focus:outline-none focus:border-[#0E1B2A] disabled:bg-[#F1F5F9]"
                            />
                            <span className="text-[10px] text-[#64748B]">min</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#64748B] uppercase font-bold block mb-1">
                            Question Bounds
                          </span>
                          {isAdmin ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                value={sec.minQuestionCount}
                                onChange={(e) =>
                                  handleUpdateSectionField(sec.id, 'minQuestionCount', Number(e.target.value))
                                }
                                className="w-12 bg-white border border-[#D4D9DF] rounded px-1.5 py-1 text-center font-mono text-xs"
                              />
                              <span>–</span>
                              <input
                                type="number"
                                value={sec.maxQuestionCount}
                                onChange={(e) =>
                                  handleUpdateSectionField(sec.id, 'maxQuestionCount', Number(e.target.value))
                                }
                                className="w-12 bg-white border border-[#D4D9DF] rounded px-1.5 py-1 text-center font-mono text-xs"
                              />
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-[#0E1B2A]">
                              {sec.minQuestionCount} – {sec.maxQuestionCount}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] text-[#64748B] uppercase font-bold block mb-1">
                            Duration Bounds
                          </span>
                          {isAdmin ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                value={sec.minDurationMinutes}
                                onChange={(e) =>
                                  handleUpdateSectionField(sec.id, 'minDurationMinutes', Number(e.target.value))
                                }
                                className="w-12 bg-white border border-[#D4D9DF] rounded px-1.5 py-1 text-center font-mono text-xs"
                              />
                              <span>–</span>
                              <input
                                type="number"
                                value={sec.maxDurationMinutes}
                                onChange={(e) =>
                                  handleUpdateSectionField(sec.id, 'maxDurationMinutes', Number(e.target.value))
                                }
                                className="w-12 bg-white border border-[#D4D9DF] rounded px-1.5 py-1 text-center font-mono text-xs"
                              />
                              <span className="text-[10px] text-[#64748B]">m</span>
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-[#0E1B2A]">
                              {sec.minDurationMinutes} – {sec.maxDurationMinutes}m
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Integrated Syllabus Subjects */}
                      {sec.subjects && sec.subjects.length > 0 && (
                        <div className="pt-2 border-t border-[#E2E6EB] flex items-center space-x-2 text-[10px]">
                          <span className="font-bold text-[#64748B] uppercase">Syllabus Subjects:</span>
                          <div className="flex flex-wrap gap-1">
                            {sec.subjects.map((sub) => (
                              <span
                                key={sub.id}
                                className="bg-[#E2E8F0] text-[#334155] px-2 py-0.5 rounded font-medium"
                              >
                                {sub.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Teacher Override Permissions */}
                      <div className="pt-2 border-t border-[#E2E6EB] flex flex-wrap gap-4 text-[11px] text-[#475569]">
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={sec.teacherCanOverrideQuestionCount}
                            onChange={(e) =>
                              handleUpdateSectionField(sec.id, 'teacherCanOverrideQuestionCount', e.target.checked)
                            }
                            className="rounded border-[#D4D9DF]"
                          />
                          <span>Allow Teacher Count Override</span>
                        </label>

                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={sec.teacherCanOverrideDuration}
                            onChange={(e) =>
                              handleUpdateSectionField(sec.id, 'teacherCanOverrideDuration', e.target.checked)
                            }
                            className="rounded border-[#D4D9DF]"
                          />
                          <span>Allow Teacher Duration Override</span>
                        </label>

                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={sec.teacherCanDisable}
                            onChange={(e) =>
                              handleUpdateSectionField(sec.id, 'teacherCanDisable', e.target.checked)
                            }
                            className="rounded border-[#D4D9DF]"
                          />
                          <span>Allow Section Disabling</span>
                        </label>

                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={sec.isMandatory}
                            onChange={(e) => handleUpdateSectionField(sec.id, 'isMandatory', e.target.checked)}
                            className="rounded border-[#D4D9DF]"
                          />
                          <span>Mandatory Section</span>
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#D4D9DF] rounded-md p-10 text-center text-xs text-[#64748B] space-y-3">
              <Sliders className="w-8 h-8 text-[#CBD5E1] mx-auto" />
              <p className="font-semibold text-sm text-[#0E1B2A]">No Master Pattern Selected</p>
              <p className="max-w-md mx-auto">
                Choose an Armed Force branch and induction course to inspect its official testing specifications, or create a brand new master pattern blueprint.
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center space-x-1.5 bg-[#0E1B2A] text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4 text-[#C6A75E]" />
                  <span>Create Pattern Blueprint</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CREATE MASTER PATTERN */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#0E1B2A]/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md border border-[#D4D9DF] shadow-lg max-w-lg w-full overflow-hidden text-xs">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E6EB] bg-[#F8FAFC]">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-[#0E1B2A]" />
                <span className="font-bold text-[#0E1B2A] uppercase tracking-wide">
                  Create Master Pattern Blueprint
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-[#E2E8F0] rounded"
              >
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block font-semibold text-[#0E1B2A] mb-1">
                  Target Service Branch & Course
                </label>
                <div className="p-2.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded text-xs font-semibold text-[#0E1B2A]">
                  {selectedForce?.name} — {selectedCourse?.name} ({selectedCourse?.code})
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0E1B2A] mb-1">
                  Pattern Specification Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  placeholder="e.g. 154 PMA Long Course Standard Initial Screening"
                  className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0E1B2A] mb-1">Description / Directives</label>
                <textarea
                  rows={3}
                  value={newTplDescription}
                  onChange={(e) => setNewTplDescription(e.target.value)}
                  placeholder="Describe the syllabus mandate, passing criteria, or testing stage instructions..."
                  className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1">Exam Stage</label>
                  <select
                    value={newTplStage}
                    onChange={(e) => setNewTplStage(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] font-semibold focus:outline-none"
                  >
                    <option value="INITIAL">INITIAL (Screening)</option>
                    <option value="MOCK">MOCK (Full Simulation)</option>
                    <option value="FINAL">FINAL (Board Exam)</option>
                    <option value="ADVANCED">ADVANCED (Specialized)</option>
                  </select>
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center space-x-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={newTplIsDefault}
                      onChange={(e) => setNewTplIsDefault(e.target.checked)}
                      className="rounded border-[#D4D9DF]"
                    />
                    <span>Set as Course Default Spec</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E6EB] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#D4D9DF] rounded font-bold hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTpl}
                  className="px-5 py-2 bg-[#0E1B2A] text-white rounded font-bold uppercase tracking-wider hover:bg-[#1A2C42] disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  {creatingTpl ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C6A75E]" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Blueprint</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD SECTION */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 bg-[#0E1B2A]/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md border border-[#D4D9DF] shadow-lg max-w-lg w-full overflow-hidden text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E6EB] bg-[#F8FAFC]">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#0E1B2A]" />
                <span className="font-bold text-[#0E1B2A] uppercase tracking-wide">
                  Add Examination Section Blueprint
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSectionModal(false)}
                className="p-1 hover:bg-[#E2E8F0] rounded"
              >
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleAddSectionSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1">
                    Section Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSecName}
                    onChange={(e) => setNewSecName(e.target.value)}
                    placeholder="e.g. Physics & Mechanics"
                    className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs text-[#0E1B2A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1">
                    Section Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSecCode}
                    onChange={(e) => setNewSecCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PHYS"
                    className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-2 text-xs font-mono uppercase text-[#0E1B2A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1">Default Questions</label>
                  <input
                    type="number"
                    min={5}
                    value={newSecQuestions}
                    onChange={(e) => setNewSecQuestions(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1">Min Questions</label>
                  <input
                    type="number"
                    min={5}
                    value={newSecMinQuestions}
                    onChange={(e) => setNewSecMinQuestions(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1">Max Questions</label>
                  <input
                    type="number"
                    min={10}
                    value={newSecMaxQuestions}
                    onChange={(e) => setNewSecMaxQuestions(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-1.5 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1">Default Duration (m)</label>
                  <input
                    type="number"
                    min={5}
                    value={newSecDuration}
                    onChange={(e) => setNewSecDuration(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1">Min Duration (m)</label>
                  <input
                    type="number"
                    min={5}
                    value={newSecMinDuration}
                    onChange={(e) => setNewSecMinDuration(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1">Max Duration (m)</label>
                  <input
                    type="number"
                    min={10}
                    value={newSecMaxDuration}
                    onChange={(e) => setNewSecMaxDuration(Number(e.target.value))}
                    className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-1.5 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0E1B2A] mb-1">
                  Passing Threshold Percentage (%)
                </label>
                <input
                  type="number"
                  min={20}
                  max={100}
                  value={newSecPassing}
                  onChange={(e) => setNewSecPassing(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#D4D9DF] rounded px-3 py-1.5 font-bold"
                />
              </div>

              {/* Integrated Subjects */}
              <div>
                <label className="block font-semibold text-[#0E1B2A] mb-1">
                  Link Syllabus Subjects (Question Bank Mapping)
                </label>
                <div className="grid grid-cols-2 gap-2 p-2 bg-[#F8FAFC] border border-[#D4D9DF] rounded max-h-32 overflow-y-auto">
                  {subjects.map((sub) => {
                    const isSelected = newSecSelectedSubjects.includes(sub.id);
                    return (
                      <label
                        key={sub.id}
                        className={`flex items-center space-x-1.5 p-1.5 rounded cursor-pointer border ${
                          isSelected
                            ? 'bg-[#EDF6F0] border-[#88BE9B] text-[#234E35]'
                            : 'bg-white border-[#E2E8F0] text-[#334155]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewSecSelectedSubjects([...newSecSelectedSubjects, sub.id]);
                            } else {
                              setNewSecSelectedSubjects(newSecSelectedSubjects.filter((id) => id !== sub.id));
                            }
                          }}
                          className="rounded border-[#D4D9DF]"
                        />
                        <span className="truncate">{sub.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-2 pt-2 border-t border-[#E2E6EB] text-[11px] text-[#475569]">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSecMandatory}
                    onChange={(e) => setNewSecMandatory(e.target.checked)}
                    className="rounded border-[#D4D9DF]"
                  />
                  <span className="font-semibold text-[#0E1B2A]">Mandatory Section (Cadet cannot skip)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSecCanDisable}
                    onChange={(e) => setNewSecCanDisable(e.target.checked)}
                    className="rounded border-[#D4D9DF]"
                  />
                  <span>Permit Teachers to disable this section during test creation</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSecCanOverrideCount}
                    onChange={(e) => setNewSecCanOverrideCount(e.target.checked)}
                    className="rounded border-[#D4D9DF]"
                  />
                  <span>Permit Teachers to customize question count</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSecCanOverrideDuration}
                    onChange={(e) => setNewSecCanOverrideDuration(e.target.checked)}
                    className="rounded border-[#D4D9DF]"
                  />
                  <span>Permit Teachers to customize duration</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#E2E6EB] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(false)}
                  className="px-4 py-2 border border-[#D4D9DF] rounded font-bold hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSec}
                  className="px-5 py-2 bg-[#0E1B2A] text-white rounded font-bold uppercase tracking-wider hover:bg-[#1A2C42] disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  {addingSec ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C6A75E]" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Section</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPatternsPage;
