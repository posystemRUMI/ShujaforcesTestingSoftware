/**
 * Test Pattern Service — Master Template System for Armed Forces Induction
 * Provides data-driven pattern loading for Army, PAF, Navy entries
 */
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export interface TestPatternTemplate {
  id: string;
  forceId: string;
  entryCourseId: string;
  name: string;
  stage: string;
  description: string | null;
  version: number;
  isDefault: boolean;
  isActive: boolean;
  familiarizationEnabled?: boolean;
  familiarizationDurationSeconds?: number;
  familiarizationQuestionCount?: number;
  sections?: TestPatternSection[];
}

export interface TestPatternSection {
  id: string;
  templateId: string;
  sectionCode: string;
  sectionName: string;
  displayOrder: number;
  defaultEnabled: boolean;
  defaultQuestionCount: number;
  minQuestionCount: number;
  maxQuestionCount: number;
  defaultDurationMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  isMandatory: boolean;
  teacherCanDisable: boolean;
  teacherCanOverrideQuestionCount: boolean;
  teacherCanOverrideDuration: boolean;
  teacherCanReorder: boolean;
  questionType: string;
  sectionType: string;
  passingPercentage: number;
  negativeMarking: boolean;
  instructions?: string;
  subjects?: {
    id: string;
    code: string;
    name: string;
    isDefault: boolean;
  }[];
}

// Fallback seed patterns in case of offline preview
const FALLBACK_TEMPLATES: TestPatternTemplate[] = [
  {
    id: '50000000-0000-0000-0000-000000000001',
    forceId: '10000000-0000-0000-0000-000000000001',
    entryCourseId: '20000000-0000-0000-0000-000000000001',
    name: 'PMA Long Course Screening Pattern',
    stage: 'INITIAL',
    description: 'Academy Default Pattern for PMA Regular Commission Initial CBT.',
    version: 1,
    isDefault: true,
    isActive: true,
    sections: [
      {
        id: '60000000-0000-0000-0000-000000000001',
        templateId: '50000000-0000-0000-0000-000000000001',
        sectionCode: 'VERBAL',
        sectionName: 'Verbal Intelligence',
        displayOrder: 1,
        defaultEnabled: true,
        defaultQuestionCount: 84,
        minQuestionCount: 20,
        maxQuestionCount: 100,
        defaultDurationMinutes: 30,
        minDurationMinutes: 15,
        maxDurationMinutes: 45,
        isMandatory: false,
        teacherCanDisable: true,
        teacherCanOverrideQuestionCount: true,
        teacherCanOverrideDuration: true,
        teacherCanReorder: true,
        questionType: 'MCQ_SINGLE',
        sectionType: 'STANDARD',
        passingPercentage: 50,
        negativeMarking: false,
        subjects: [{ id: '30000000-0000-0000-0000-000000000001', code: 'INTELLIGENCE_VERBAL', name: 'Verbal Intelligence', isDefault: true }],
      },
      {
        id: '60000000-0000-0000-0000-000000000002',
        templateId: '50000000-0000-0000-0000-000000000001',
        sectionCode: 'NON_VERBAL',
        sectionName: 'Non-Verbal Intelligence',
        displayOrder: 2,
        defaultEnabled: true,
        defaultQuestionCount: 64,
        minQuestionCount: 20,
        maxQuestionCount: 90,
        defaultDurationMinutes: 30,
        minDurationMinutes: 15,
        maxDurationMinutes: 45,
        isMandatory: false,
        teacherCanDisable: true,
        teacherCanOverrideQuestionCount: true,
        teacherCanOverrideDuration: true,
        teacherCanReorder: true,
        questionType: 'MCQ_SINGLE',
        sectionType: 'STANDARD',
        passingPercentage: 50,
        negativeMarking: false,
        subjects: [{ id: '30000000-0000-0000-0000-000000000002', code: 'INTELLIGENCE_NON_VERBAL', name: 'Non-Verbal Intelligence', isDefault: true }],
      },
      {
        id: '60000000-0000-0000-0000-000000000003',
        templateId: '50000000-0000-0000-0000-000000000001',
        sectionCode: 'ACADEMIC',
        sectionName: 'Academic Evaluation',
        displayOrder: 3,
        defaultEnabled: true,
        defaultQuestionCount: 50,
        minQuestionCount: 15,
        maxQuestionCount: 60,
        defaultDurationMinutes: 30,
        minDurationMinutes: 15,
        maxDurationMinutes: 45,
        isMandatory: false,
        teacherCanDisable: true,
        teacherCanOverrideQuestionCount: true,
        teacherCanOverrideDuration: true,
        teacherCanReorder: true,
        questionType: 'MCQ_SINGLE',
        sectionType: 'STANDARD',
        passingPercentage: 50,
        negativeMarking: false,
        subjects: [
          { id: '30000000-0000-0000-0000-000000000005', code: 'ACADEMIC_ENGLISH', name: 'English', isDefault: true },
          { id: '30000000-0000-0000-0000-000000000004', code: 'ACADEMIC_MATH', name: 'Mathematics', isDefault: true },
          { id: '30000000-0000-0000-0000-000000000008', code: 'GENERAL_KNOWLEDGE', name: 'General Knowledge', isDefault: true },
          { id: '30000000-0000-0000-0000-000000000009', code: 'PAKISTAN_STUDIES', name: 'Pakistan Studies', isDefault: true },
          { id: '30000000-0000-0000-0000-000000000010', code: 'ISLAMIAT', name: 'Islamiat & Ethics', isDefault: true },
        ],
      },
    ],
  },
  {
    id: '50000000-0000-0000-0000-000000000005',
    forceId: '10000000-0000-0000-0000-000000000002',
    entryCourseId: '20000000-0000-0000-0000-000000000002',
    name: 'GD Pilot Screening Pattern',
    stage: 'INITIAL',
    description: 'Academy Default Pattern for PAF General Duty Pilot Screening.',
    version: 1,
    isDefault: true,
    isActive: true,
    sections: [
      {
        id: '60000000-0000-0000-0000-000000000013',
        templateId: '50000000-0000-0000-0000-000000000005',
        sectionCode: 'VERBAL',
        sectionName: 'Verbal Intelligence',
        displayOrder: 1,
        defaultEnabled: true,
        defaultQuestionCount: 84,
        minQuestionCount: 20,
        maxQuestionCount: 100,
        defaultDurationMinutes: 30,
        minDurationMinutes: 15,
        maxDurationMinutes: 45,
        isMandatory: false,
        teacherCanDisable: true,
        teacherCanOverrideQuestionCount: true,
        teacherCanOverrideDuration: true,
        teacherCanReorder: true,
        questionType: 'MCQ_SINGLE',
        sectionType: 'STANDARD',
        passingPercentage: 50,
        negativeMarking: false,
      },
      {
        id: '60000000-0000-0000-0000-000000000014',
        templateId: '50000000-0000-0000-0000-000000000005',
        sectionCode: 'NON_VERBAL',
        sectionName: 'Non-Verbal Intelligence',
        displayOrder: 2,
        defaultEnabled: true,
        defaultQuestionCount: 64,
        minQuestionCount: 20,
        maxQuestionCount: 90,
        defaultDurationMinutes: 30,
        minDurationMinutes: 15,
        maxDurationMinutes: 45,
        isMandatory: false,
        teacherCanDisable: true,
        teacherCanOverrideQuestionCount: true,
        teacherCanOverrideDuration: true,
        teacherCanReorder: true,
        questionType: 'MCQ_SINGLE',
        sectionType: 'STANDARD',
        passingPercentage: 50,
        negativeMarking: false,
      },
      {
        id: '60000000-0000-0000-0000-000000000015',
        templateId: '50000000-0000-0000-0000-000000000005',
        sectionCode: 'PHYSICS',
        sectionName: 'Physics',
        displayOrder: 3,
        defaultEnabled: true,
        defaultQuestionCount: 40,
        minQuestionCount: 10,
        maxQuestionCount: 50,
        defaultDurationMinutes: 25,
        minDurationMinutes: 10,
        maxDurationMinutes: 40,
        isMandatory: false,
        teacherCanDisable: true,
        teacherCanOverrideQuestionCount: true,
        teacherCanOverrideDuration: true,
        teacherCanReorder: true,
        questionType: 'MCQ_SINGLE',
        sectionType: 'STANDARD',
        passingPercentage: 50,
        negativeMarking: false,
      },
      {
        id: '60000000-0000-0000-0000-000000000016',
        templateId: '50000000-0000-0000-0000-000000000005',
        sectionCode: 'ENGLISH',
        sectionName: 'English',
        displayOrder: 4,
        defaultEnabled: true,
        defaultQuestionCount: 40,
        minQuestionCount: 10,
        maxQuestionCount: 50,
        defaultDurationMinutes: 25,
        minDurationMinutes: 10,
        maxDurationMinutes: 40,
        isMandatory: false,
        teacherCanDisable: true,
        teacherCanOverrideQuestionCount: true,
        teacherCanOverrideDuration: true,
        teacherCanReorder: true,
        questionType: 'MCQ_SINGLE',
        sectionType: 'STANDARD',
        passingPercentage: 50,
        negativeMarking: false,
      },
    ],
  },
  {
    id: '50000000-0000-0000-0000-000000000007',
    forceId: '10000000-0000-0000-0000-000000000003',
    entryCourseId: '20000000-0000-0000-0000-000000000003',
    name: 'PN Cadet Entrance Pattern',
    stage: 'INITIAL',
    description: 'Academy Default Pattern for PN Cadet Officer Induction.',
    version: 1,
    isDefault: true,
    isActive: true,
    sections: [
      {
        id: '60000000-0000-0000-0000-000000000022',
        templateId: '50000000-0000-0000-0000-000000000007',
        sectionCode: 'VERBAL',
        sectionName: 'Verbal Intelligence',
        displayOrder: 1,
        defaultEnabled: true,
        defaultQuestionCount: 84,
        minQuestionCount: 20,
        maxQuestionCount: 100,
        defaultDurationMinutes: 30,
        minDurationMinutes: 15,
        maxDurationMinutes: 45,
        isMandatory: false,
        teacherCanDisable: true,
        teacherCanOverrideQuestionCount: true,
        teacherCanOverrideDuration: true,
        teacherCanReorder: true,
        questionType: 'MCQ_SINGLE',
        sectionType: 'STANDARD',
        passingPercentage: 50,
        negativeMarking: false,
      },
      {
        id: '60000000-0000-0000-0000-000000000023',
        templateId: '50000000-0000-0000-0000-000000000007',
        sectionCode: 'NON_VERBAL',
        sectionName: 'Non-Verbal Intelligence',
        displayOrder: 2,
        defaultEnabled: true,
        defaultQuestionCount: 64,
        minQuestionCount: 20,
        maxQuestionCount: 90,
        defaultDurationMinutes: 30,
        minDurationMinutes: 15,
        maxDurationMinutes: 45,
        isMandatory: false,
        teacherCanDisable: true,
        teacherCanOverrideQuestionCount: true,
        teacherCanOverrideDuration: true,
        teacherCanReorder: true,
        questionType: 'MCQ_SINGLE',
        sectionType: 'STANDARD',
        passingPercentage: 50,
        negativeMarking: false,
      },
      {
        id: '60000000-0000-0000-0000-000000000024',
        templateId: '50000000-0000-0000-0000-000000000007',
        sectionCode: 'ACADEMIC',
        sectionName: 'Academic Evaluation',
        displayOrder: 3,
        defaultEnabled: true,
        defaultQuestionCount: 50,
        minQuestionCount: 15,
        maxQuestionCount: 60,
        defaultDurationMinutes: 35,
        minDurationMinutes: 15,
        maxDurationMinutes: 50,
        isMandatory: false,
        teacherCanDisable: true,
        teacherCanOverrideQuestionCount: true,
        teacherCanOverrideDuration: true,
        teacherCanReorder: true,
        questionType: 'MCQ_SINGLE',
        sectionType: 'STANDARD',
        passingPercentage: 50,
        negativeMarking: false,
        subjects: [
          { id: '30000000-0000-0000-0000-000000000003', code: 'ACADEMIC_PHYSICS', name: 'Physics', isDefault: true },
          { id: '30000000-0000-0000-0000-000000000004', code: 'ACADEMIC_MATH', name: 'Mathematics', isDefault: true },
          { id: '30000000-0000-0000-0000-000000000005', code: 'ACADEMIC_ENGLISH', name: 'English', isDefault: true },
          { id: '30000000-0000-0000-0000-000000000008', code: 'GENERAL_KNOWLEDGE', name: 'General Knowledge', isDefault: true },
        ],
      },
    ],
  },
];

const FORCE_ID_MAP: Record<string, string> = {
  'force-army': '10000000-0000-0000-0000-000000000001',
  'PAKISTAN_ARMY': '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001': '10000000-0000-0000-0000-000000000001',

  'force-air-force': '10000000-0000-0000-0000-000000000002',
  'PAKISTAN_AIR_FORCE': '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002': '10000000-0000-0000-0000-000000000002',

  'force-navy': '10000000-0000-0000-0000-000000000003',
  'PAKISTAN_NAVY': '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000003': '10000000-0000-0000-0000-000000000003',
};

const COURSE_ID_MAP: Record<string, string> = {
  'crs-01': '20000000-0000-0000-0000-000000000001',
  '154-PMA-LC': '20000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001': '20000000-0000-0000-0000-000000000001',

  'crs-02': '20000000-0000-0000-0000-000000000002',
  '158-PAF-GDP': '20000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000002': '20000000-0000-0000-0000-000000000002',

  'crs-03': '20000000-0000-0000-0000-000000000003',
  'PN-CADET-26A': '20000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000003': '20000000-0000-0000-0000-000000000003',
};

function filterFallbackTemplates(forceId?: string, courseId?: string): TestPatternTemplate[] {
  const normForceId = forceId ? (FORCE_ID_MAP[forceId] || forceId) : undefined;
  const normCourseId = courseId ? (COURSE_ID_MAP[courseId] || courseId) : undefined;

  const filtered = FALLBACK_TEMPLATES.filter((t) => {
    if (normForceId && t.forceId !== normForceId) return false;
    if (normCourseId && t.entryCourseId !== normCourseId) return false;
    return true;
  });

  if (filtered.length === 0 && (!normCourseId || FALLBACK_TEMPLATES.length > 0)) {
    // If no exact match for course, fallback to force match or all
    const forceMatch = FALLBACK_TEMPLATES.filter((t) => !normForceId || t.forceId === normForceId);
    return forceMatch.length > 0 ? forceMatch : FALLBACK_TEMPLATES;
  }

  return filtered;
}

export const testPatternService = {
  async getTemplates(forceId?: string, courseId?: string): Promise<TestPatternTemplate[]> {
    if (!isSupabaseConfigured()) {
      return filterFallbackTemplates(forceId, courseId);
    }

    try {
      let query = (supabase as any)
        .from('test_pattern_templates')
        .select('*')
        .eq('is_active', true)
        .order('version', { ascending: false });

      if (forceId) query = query.eq('force_id', forceId);
      if (courseId) query = query.eq('entry_course_id', courseId);

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return filterFallbackTemplates(forceId, courseId);
      }

      return data.map((t: any) => ({
        id: t.id,
        forceId: t.force_id,
        entryCourseId: t.entry_course_id,
        name: t.name,
        stage: t.stage,
        description: t.description,
        version: t.version,
        isDefault: t.is_default,
        isActive: t.is_active,
      }));
    } catch (e) {
      console.warn('Error fetching test patterns:', e);
      return FALLBACK_TEMPLATES;
    }
  },

  async getTemplateDetails(templateId: string): Promise<TestPatternTemplate | null> {
    const fallback = FALLBACK_TEMPLATES.find((t) => t.id === templateId);

    if (!isSupabaseConfigured()) {
      return fallback || null;
    }

    try {
      const { data: tpl, error: tplError } = await (supabase as any)
        .from('test_pattern_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();

      if (tplError || !tpl) return fallback || null;

      const { data: sections, error: secError } = await (supabase as any)
        .from('test_pattern_sections')
        .select(`
          *,
          test_pattern_section_subjects (
            is_default,
            subjects (
              id,
              code,
              name
            )
          )
        `)
        .eq('template_id', templateId)
        .order('display_order', { ascending: true });

      if (secError || !sections) {
        return {
          id: tpl.id,
          forceId: tpl.force_id,
          entryCourseId: tpl.entry_course_id,
          name: tpl.name,
          stage: tpl.stage,
          description: tpl.description,
          version: tpl.version,
          isDefault: tpl.is_default,
          isActive: tpl.is_active,
          sections: fallback?.sections || [],
        };
      }

      const mappedSections: TestPatternSection[] = sections.map((s: any) => {
        const subjs = (s.test_pattern_section_subjects || [])
          .filter((pss: any) => pss.subjects)
          .map((pss: any) => ({
            id: pss.subjects.id,
            code: pss.subjects.code,
            name: pss.subjects.name,
            isDefault: pss.is_default,
          }));

        return {
          id: s.id,
          templateId: s.template_id,
          sectionCode: s.section_code,
          sectionName: s.section_name,
          displayOrder: s.display_order,
          defaultEnabled: s.default_enabled,
          defaultQuestionCount: s.default_question_count,
          minQuestionCount: s.min_question_count,
          maxQuestionCount: s.max_question_count,
          defaultDurationMinutes: s.default_duration_minutes,
          minDurationMinutes: s.min_duration_minutes,
          maxDurationMinutes: s.max_duration_minutes,
          isMandatory: s.is_mandatory,
          teacherCanDisable: s.teacher_can_disable,
          teacherCanOverrideQuestionCount: s.teacher_can_override_question_count,
          teacherCanOverrideDuration: s.teacher_can_override_duration,
          teacherCanReorder: s.teacher_can_reorder,
          questionType: s.question_type,
          sectionType: s.section_type,
          passingPercentage: s.passing_percentage,
          negativeMarking: s.negative_marking,
          instructions: s.instructions,
          subjects: subjs,
        };
      });

      return {
        id: tpl.id,
        forceId: tpl.force_id,
        entryCourseId: tpl.entry_course_id,
        name: tpl.name,
        stage: tpl.stage,
        description: tpl.description,
        version: tpl.version,
        isDefault: tpl.is_default,
        isActive: tpl.is_active,
        sections: mappedSections,
      };
    } catch (err) {
      console.warn('Error loading template details:', err);
      return fallback || null;
    }
  },

  async saveTemplate(template: TestPatternTemplate): Promise<void> {
    if (!isSupabaseConfigured()) {
      const idx = FALLBACK_TEMPLATES.findIndex((t) => t.id === template.id);
      if (idx !== -1) {
        FALLBACK_TEMPLATES[idx] = { ...template };
      } else {
        FALLBACK_TEMPLATES.push({ ...template });
      }
      return;
    }

    // 1. Update Template metadata
    const { error: tplErr } = await (supabase as any)
      .from('test_pattern_templates')
      .update({
        name: template.name,
        description: template.description,
        stage: template.stage || 'INITIAL',
        version: template.version || 1,
        is_default: template.isDefault,
        is_active: template.isActive !== undefined ? template.isActive : true,
      })
      .eq('id', template.id);

    if (tplErr) {
      console.error('Error updating template:', tplErr);
      throw new Error(tplErr.message || 'Failed to update template');
    }

    // 2. Update sections if provided
    if (template.sections && template.sections.length > 0) {
      for (const sec of template.sections) {
        const { error: secErr } = await (supabase as any)
          .from('test_pattern_sections')
          .update({
            section_name: sec.sectionName,
            section_code: sec.sectionCode,
            display_order: sec.displayOrder,
            default_enabled: sec.defaultEnabled,
            default_question_count: sec.defaultQuestionCount,
            min_question_count: sec.minQuestionCount,
            max_question_count: sec.maxQuestionCount,
            default_duration_minutes: sec.defaultDurationMinutes,
            min_duration_minutes: sec.minDurationMinutes,
            max_duration_minutes: sec.maxDurationMinutes,
            is_mandatory: sec.isMandatory,
            teacher_can_disable: sec.teacherCanDisable,
            teacher_can_override_question_count: sec.teacherCanOverrideQuestionCount,
            teacher_can_override_duration: sec.teacherCanOverrideDuration,
            teacher_can_reorder: sec.teacherCanReorder,
            passing_percentage: sec.passingPercentage,
            negative_marking: sec.negativeMarking,
          })
          .eq('id', sec.id);

        if (secErr) {
          console.error(`Error updating section ${sec.id}:`, secErr);
        }
      }
    }
  },

  async createTemplate(payload: {
    forceId: string;
    entryCourseId: string;
    name: string;
    stage?: string;
    description?: string;
    isDefault?: boolean;
  }): Promise<TestPatternTemplate> {
    const defaultStage = payload.stage || 'INITIAL';
    const isDef = payload.isDefault !== undefined ? payload.isDefault : false;

    if (!isSupabaseConfigured()) {
      const newId = `50000000-0000-0000-0000-${String(Date.now()).slice(-12)}`;
      const newTpl: TestPatternTemplate = {
        id: newId,
        forceId: payload.forceId,
        entryCourseId: payload.entryCourseId,
        name: payload.name,
        stage: defaultStage,
        description: payload.description || null,
        version: 1,
        isDefault: isDef,
        isActive: true,
        sections: [
          {
            id: `60000000-0000-0000-0000-${String(Date.now()).slice(-12)}1`,
            templateId: newId,
            sectionCode: 'VERBAL',
            sectionName: 'Verbal Intelligence',
            displayOrder: 1,
            defaultEnabled: true,
            defaultQuestionCount: 84,
            minQuestionCount: 20,
            maxQuestionCount: 100,
            defaultDurationMinutes: 30,
            minDurationMinutes: 15,
            maxDurationMinutes: 45,
            isMandatory: false,
            teacherCanDisable: true,
            teacherCanOverrideQuestionCount: true,
            teacherCanOverrideDuration: true,
            teacherCanReorder: true,
            questionType: 'MCQ_SINGLE',
            sectionType: 'STANDARD',
            passingPercentage: 50,
            negativeMarking: false,
          },
          {
            id: `60000000-0000-0000-0000-${String(Date.now()).slice(-12)}2`,
            templateId: newId,
            sectionCode: 'NON_VERBAL',
            sectionName: 'Non-Verbal Intelligence',
            displayOrder: 2,
            defaultEnabled: true,
            defaultQuestionCount: 64,
            minQuestionCount: 20,
            maxQuestionCount: 90,
            defaultDurationMinutes: 30,
            minDurationMinutes: 15,
            maxDurationMinutes: 45,
            isMandatory: false,
            teacherCanDisable: true,
            teacherCanOverrideQuestionCount: true,
            teacherCanOverrideDuration: true,
            teacherCanReorder: true,
            questionType: 'MCQ_SINGLE',
            sectionType: 'STANDARD',
            passingPercentage: 50,
            negativeMarking: false,
          },
          {
            id: `60000000-0000-0000-0000-${String(Date.now()).slice(-12)}3`,
            templateId: newId,
            sectionCode: 'ACADEMIC',
            sectionName: 'Academic / General Evaluation',
            displayOrder: 3,
            defaultEnabled: true,
            defaultQuestionCount: 50,
            minQuestionCount: 15,
            maxQuestionCount: 60,
            defaultDurationMinutes: 30,
            minDurationMinutes: 15,
            maxDurationMinutes: 45,
            isMandatory: false,
            teacherCanDisable: true,
            teacherCanOverrideQuestionCount: true,
            teacherCanOverrideDuration: true,
            teacherCanReorder: true,
            questionType: 'MCQ_SINGLE',
            sectionType: 'STANDARD',
            passingPercentage: 50,
            negativeMarking: false,
          },
        ],
      };
      FALLBACK_TEMPLATES.push(newTpl);
      return newTpl;
    }

    // 1. Insert Template
    const { data: tpl, error: tplErr } = await (supabase as any)
      .from('test_pattern_templates')
      .insert({
        force_id: payload.forceId,
        entry_course_id: payload.entryCourseId,
        name: payload.name,
        stage: defaultStage,
        description: payload.description || null,
        is_default: isDef,
        version: 1,
      })
      .select('*')
      .single();

    if (tplErr || !tpl) {
      throw new Error(tplErr?.message || 'Failed to create template');
    }

    // 2. Insert standard default sections
    const defaultSections = [
      {
        template_id: tpl.id,
        section_code: 'VERBAL',
        section_name: 'Verbal Intelligence',
        display_order: 1,
        default_enabled: true,
        default_question_count: 84,
        min_question_count: 20,
        max_question_count: 100,
        default_duration_minutes: 30,
        min_duration_minutes: 15,
        max_duration_minutes: 45,
        is_mandatory: false,
        teacher_can_disable: true,
        teacher_can_override_question_count: true,
        teacher_can_override_duration: true,
        teacher_can_reorder: true,
        question_type: 'MCQ_SINGLE',
        section_type: 'STANDARD',
        passing_percentage: 50,
        negative_marking: false,
      },
      {
        template_id: tpl.id,
        section_code: 'NON_VERBAL',
        section_name: 'Non-Verbal Intelligence',
        display_order: 2,
        default_enabled: true,
        default_question_count: 64,
        min_question_count: 20,
        max_question_count: 90,
        default_duration_minutes: 30,
        min_duration_minutes: 15,
        max_duration_minutes: 45,
        is_mandatory: false,
        teacher_can_disable: true,
        teacher_can_override_question_count: true,
        teacher_can_override_duration: true,
        teacher_can_reorder: true,
        question_type: 'MCQ_SINGLE',
        section_type: 'STANDARD',
        passing_percentage: 50,
        negative_marking: false,
      },
      {
        template_id: tpl.id,
        section_code: 'ACADEMIC',
        section_name: 'Academic / General Evaluation',
        display_order: 3,
        default_enabled: true,
        default_question_count: 50,
        min_question_count: 15,
        max_question_count: 60,
        default_duration_minutes: 30,
        min_duration_minutes: 15,
        max_duration_minutes: 45,
        is_mandatory: false,
        teacher_can_disable: true,
        teacher_can_override_question_count: true,
        teacher_can_override_duration: true,
        teacher_can_reorder: true,
        question_type: 'MCQ_SINGLE',
        section_type: 'STANDARD',
        passing_percentage: 50,
        negative_marking: false,
      },
    ];

    const { data: createdSecs } = await (supabase as any)
      .from('test_pattern_sections')
      .insert(defaultSections)
      .select('*');

    return {
      id: tpl.id,
      forceId: tpl.force_id,
      entryCourseId: tpl.entry_course_id,
      name: tpl.name,
      stage: tpl.stage,
      description: tpl.description,
      version: tpl.version,
      isDefault: tpl.is_default,
      isActive: tpl.is_active,
      sections: (createdSecs || []).map((s: any) => ({
        id: s.id,
        templateId: s.template_id,
        sectionCode: s.section_code,
        sectionName: s.section_name,
        displayOrder: s.display_order,
        defaultEnabled: s.default_enabled,
        defaultQuestionCount: s.default_question_count,
        minQuestionCount: s.min_question_count,
        maxQuestionCount: s.max_question_count,
        defaultDurationMinutes: s.default_duration_minutes,
        minDurationMinutes: s.min_duration_minutes,
        maxDurationMinutes: s.max_duration_minutes,
        isMandatory: s.is_mandatory,
        teacherCanDisable: s.teacher_can_disable,
        teacherCanOverrideQuestionCount: s.teacher_can_override_question_count,
        teacherCanOverrideDuration: s.teacher_can_override_duration,
        teacherCanReorder: s.teacher_can_reorder,
        questionType: s.question_type,
        sectionType: s.section_type,
        passingPercentage: s.passing_percentage,
        negativeMarking: s.negative_marking,
      })),
    };
  },

  async deleteTemplate(templateId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      const idx = FALLBACK_TEMPLATES.findIndex((t) => t.id === templateId);
      if (idx !== -1) FALLBACK_TEMPLATES.splice(idx, 1);
      return;
    }

    const { error } = await (supabase as any)
      .from('test_pattern_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      throw new Error(error.message || 'Failed to delete template');
    }
  },

  async addSection(
    templateId: string,
    section: Partial<TestPatternSection>,
    subjectIds?: string[]
  ): Promise<TestPatternSection> {
    if (!isSupabaseConfigured()) {
      const newSecId = `sec-${Date.now()}`;
      const newSec: TestPatternSection = {
        id: newSecId,
        templateId,
        sectionCode: section.sectionCode || 'CUSTOM',
        sectionName: section.sectionName || 'Custom Section',
        displayOrder: section.displayOrder || 4,
        defaultEnabled: section.defaultEnabled !== undefined ? section.defaultEnabled : true,
        defaultQuestionCount: section.defaultQuestionCount || 30,
        minQuestionCount: section.minQuestionCount || 5,
        maxQuestionCount: section.maxQuestionCount || 100,
        defaultDurationMinutes: section.defaultDurationMinutes || 20,
        minDurationMinutes: section.minDurationMinutes || 5,
        maxDurationMinutes: section.maxDurationMinutes || 60,
        isMandatory: section.isMandatory || false,
        teacherCanDisable: section.teacherCanDisable !== undefined ? section.teacherCanDisable : true,
        teacherCanOverrideQuestionCount: section.teacherCanOverrideQuestionCount !== undefined ? section.teacherCanOverrideQuestionCount : true,
        teacherCanOverrideDuration: section.teacherCanOverrideDuration !== undefined ? section.teacherCanOverrideDuration : true,
        teacherCanReorder: true,
        questionType: section.questionType || 'MCQ_SINGLE',
        sectionType: section.sectionType || 'STANDARD',
        passingPercentage: section.passingPercentage || 50,
        negativeMarking: section.negativeMarking || false,
      };
      return newSec;
    }

    const { data: created, error } = await (supabase as any)
      .from('test_pattern_sections')
      .insert({
        template_id: templateId,
        section_code: section.sectionCode,
        section_name: section.sectionName,
        display_order: section.displayOrder || 1,
        default_enabled: section.defaultEnabled !== undefined ? section.defaultEnabled : true,
        default_question_count: section.defaultQuestionCount || 30,
        min_question_count: section.minQuestionCount || 5,
        max_question_count: section.maxQuestionCount || 100,
        default_duration_minutes: section.defaultDurationMinutes || 20,
        min_duration_minutes: section.minDurationMinutes || 5,
        max_duration_minutes: section.maxDurationMinutes || 60,
        is_mandatory: section.isMandatory || false,
        teacher_can_disable: section.teacherCanDisable !== undefined ? section.teacherCanDisable : true,
        teacher_can_override_question_count: section.teacherCanOverrideQuestionCount !== undefined ? section.teacherCanOverrideQuestionCount : true,
        teacher_can_override_duration: section.teacherCanOverrideDuration !== undefined ? section.teacherCanOverrideDuration : true,
        teacher_can_reorder: true,
        question_type: section.questionType || 'MCQ_SINGLE',
        section_type: section.sectionType || 'STANDARD',
        passing_percentage: section.passingPercentage || 50,
        negative_marking: section.negativeMarking || false,
      })
      .select('*')
      .single();

    if (error || !created) {
      throw new Error(error?.message || 'Failed to add section');
    }

    if (subjectIds && subjectIds.length > 0) {
      const pssRows = subjectIds.map((sid) => ({
        pattern_section_id: created.id,
        subject_id: sid,
        is_default: true,
      }));
      await (supabase as any).from('test_pattern_section_subjects').insert(pssRows);
    }

    return {
      id: created.id,
      templateId: created.template_id,
      sectionCode: created.section_code,
      sectionName: created.section_name,
      displayOrder: created.display_order,
      defaultEnabled: created.default_enabled,
      defaultQuestionCount: created.default_question_count,
      minQuestionCount: created.min_question_count,
      maxQuestionCount: created.max_question_count,
      defaultDurationMinutes: created.default_duration_minutes,
      minDurationMinutes: created.min_duration_minutes,
      maxDurationMinutes: created.max_duration_minutes,
      isMandatory: created.is_mandatory,
      teacherCanDisable: created.teacher_can_disable,
      teacherCanOverrideQuestionCount: created.teacher_can_override_question_count,
      teacherCanOverrideDuration: created.teacher_can_override_duration,
      teacherCanReorder: created.teacher_can_reorder,
      questionType: created.question_type,
      sectionType: created.section_type,
      passingPercentage: created.passing_percentage,
      negativeMarking: created.negative_marking,
    };
  },

  async deleteSection(sectionId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    const { error } = await (supabase as any)
      .from('test_pattern_sections')
      .delete()
      .eq('id', sectionId);

    if (error) {
      throw new Error(error.message || 'Failed to delete section');
    }
  },
};

export default testPatternService;
