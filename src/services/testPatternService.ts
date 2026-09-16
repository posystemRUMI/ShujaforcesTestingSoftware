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

export const testPatternService = {
  async getTemplates(forceId?: string, courseId?: string): Promise<TestPatternTemplate[]> {
    if (!isSupabaseConfigured()) {
      return [];
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
        if (error) console.warn('Error fetching test pattern templates:', error);
        return [];
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
      return [];
    }
  },

  async getTemplateDetails(templateId: string): Promise<TestPatternTemplate | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data: tpl, error: tplError } = await (supabase as any)
        .from('test_pattern_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();

      if (tplError || !tpl) return null;

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
          sections: [],
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
      return null;
    }
  },

  async saveTemplate(template: TestPatternTemplate): Promise<void> {
    if (!isSupabaseConfigured()) {
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
      throw new Error('Supabase not configured');
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
