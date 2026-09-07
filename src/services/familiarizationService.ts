import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

/**
 * Familiarization Service — Pre-Test Orientation & 1-Minute Practice Battery
 * Generates dynamic, subject-matched demo MCQs for candidate familiarization
 * Guarantee: Unscored, zero official attempt/result creation, zero secret answer leakage.
 */

export interface PracticeOption {
  id: string;
  label: string;
  text: string;
  imageUrl?: string;
}

export interface PracticeQuestion {
  id: string;
  code: string;
  subjectId: string;
  subjectName: string;
  stem: string;
  imageUrl?: string;
  options: PracticeOption[];
  correctOptionId: string;
  explanation: string;
}

// Dedicated safe demo question repository categorized by discipline
const DEMO_QUESTIONS_BY_SUBJECT: Record<string, PracticeQuestion[]> = {
  // Verbal Intelligence
  INTELLIGENCE_VERBAL: [
    {
      id: 'fam-v-01',
      code: 'DEMO-VRB-01',
      subjectId: 'INTELLIGENCE_VERBAL',
      subjectName: 'Verbal Intelligence',
      stem: 'If SOLDIER is coded as 19-15-12-4-9-5-18, what is the code for BRAVO?',
      options: [
        { id: 'opt-v1-a', label: 'A', text: '2-18-1-22-15' },
        { id: 'opt-v1-b', label: 'B', text: '2-17-1-21-14' },
        { id: 'opt-v1-c', label: 'C', text: '1-18-2-22-15' },
        { id: 'opt-v1-d', label: 'D', text: '2-19-1-23-16' },
      ],
      correctOptionId: 'opt-v1-a',
      explanation: 'Each alphabet letter is mapped directly to its 1-indexed alphabetical position: B=2, R=18, A=1, V=22, O=15.',
    },
    {
      id: 'fam-v-02',
      code: 'DEMO-VRB-02',
      subjectId: 'INTELLIGENCE_VERBAL',
      subjectName: 'Verbal Intelligence',
      stem: 'Which word does NOT belong with the others in the military hierarchy: General, Admiral, Colonel, Brigade?',
      options: [
        { id: 'opt-v2-a', label: 'A', text: 'General' },
        { id: 'opt-v2-b', label: 'B', text: 'Admiral' },
        { id: 'opt-v2-c', label: 'C', text: 'Colonel' },
        { id: 'opt-v2-d', label: 'D', text: 'Brigade' },
      ],
      correctOptionId: 'opt-v2-d',
      explanation: 'General, Admiral, and Colonel are officer ranks; Brigade is a tactical military formation/unit, not a personal rank.',
    },
    {
      id: 'fam-v-03',
      code: 'DEMO-VRB-03',
      subjectId: 'INTELLIGENCE_VERBAL',
      subjectName: 'Verbal Intelligence',
      stem: 'Compass is to Direction as Chronometer is to:',
      options: [
        { id: 'opt-v3-a', label: 'A', text: 'Altitude' },
        { id: 'opt-v3-b', label: 'B', text: 'Time' },
        { id: 'opt-v3-c', label: 'C', text: 'Pressure' },
        { id: 'opt-v3-d', label: 'D', text: 'Speed' },
      ],
      correctOptionId: 'opt-v3-b',
      explanation: 'A compass is an instrument used to determine direction, while a chronometer is an instrument designed to measure precise time.',
    },
    {
      id: 'fam-v-04',
      code: 'DEMO-VRB-04',
      subjectId: 'INTELLIGENCE_VERBAL',
      subjectName: 'Verbal Intelligence',
      stem: 'Complete the numeric series: 3, 6, 12, 24, 48, (___)?',
      options: [
        { id: 'opt-v4-a', label: 'A', text: '72' },
        { id: 'opt-v4-b', label: 'B', text: '84' },
        { id: 'opt-v4-c', label: 'C', text: '96' },
        { id: 'opt-v4-d', label: 'D', text: '108' },
      ],
      correctOptionId: 'opt-v4-c',
      explanation: 'Each subsequent term is multiplied by 2 (geometric progression): 48 × 2 = 96.',
    },
  ],

  // Non-Verbal Intelligence
  INTELLIGENCE_NON_VERBAL: [
    {
      id: 'fam-nv-01',
      code: 'DEMO-NVR-01',
      subjectId: 'INTELLIGENCE_NON_VERBAL',
      subjectName: 'Non-Verbal Intelligence',
      stem: 'In an analog radar display sequence, a target vector rotates 45° clockwise, then 90° clockwise, then 135° clockwise. By how many degrees will it rotate in the 4th step?',
      options: [
        { id: 'opt-nv1-a', label: 'A', text: '150° clockwise' },
        { id: 'opt-nv1-b', label: 'B', text: '180° clockwise' },
        { id: 'opt-nv1-c', label: 'C', text: '210° clockwise' },
        { id: 'opt-nv1-d', label: 'D', text: '225° clockwise' },
      ],
      correctOptionId: 'opt-nv1-b',
      explanation: 'The angular rotation increases by an increment of 45° at each phase: 45° → 90° (+45°) → 135° (+45°) → 180° (+45°).',
    },
    {
      id: 'fam-nv-02',
      code: 'DEMO-NVR-02',
      subjectId: 'INTELLIGENCE_NON_VERBAL',
      subjectName: 'Non-Verbal Intelligence',
      stem: 'If a solid square transforms into 4 equal quadrants, and a solid triangle transforms into 3 equal parts, what shape transforms into 5 equal triangular sectors?',
      options: [
        { id: 'opt-nv2-a', label: 'A', text: 'Hexagon' },
        { id: 'opt-nv2-b', label: 'B', text: 'Pentagon' },
        { id: 'opt-nv2-c', label: 'C', text: 'Octagon' },
        { id: 'opt-nv2-d', label: 'D', text: 'Rhombus' },
      ],
      correctOptionId: 'opt-nv2-b',
      explanation: 'A regular polygon divided from its centroid produces identical triangular sectors corresponding to its number of vertices (Pentagon = 5).',
    },
    {
      id: 'fam-nv-03',
      code: 'DEMO-NVR-03',
      subjectId: 'INTELLIGENCE_NON_VERBAL',
      subjectName: 'Non-Verbal Intelligence',
      stem: 'Identify the spatial mirror reflection of arrow [ → ]: across a vertical axis, it becomes [ ← ]. Across a horizontal axis, what does arrow [ ↑ ] become?',
      options: [
        { id: 'opt-nv3-a', label: 'A', text: 'Arrow pointing Downwards [ ↓ ]' },
        { id: 'opt-nv3-b', label: 'B', text: 'Arrow pointing Rightwards [ → ]' },
        { id: 'opt-nv3-c', label: 'C', text: 'Arrow pointing Leftwards [ ← ]' },
        { id: 'opt-nv3-d', label: 'D', text: 'Arrow pointing Diagonal [ ↗ ]' },
      ],
      correctOptionId: 'opt-nv3-a',
      explanation: 'Reflection across a horizontal baseline inverts the vertical direction: upwards [ ↑ ] inverts to downwards [ ↓ ].',
    },
  ],

  // Academic Mathematics
  ACADEMIC_MATH: [
    {
      id: 'fam-m-01',
      code: 'DEMO-MTH-01',
      subjectId: 'ACADEMIC_MATH',
      subjectName: 'Academic Mathematics',
      stem: 'Evaluate the basic algebraic expression: If 4x + 8 = 32, what is the value of 2x - 3?',
      options: [
        { id: 'opt-m1-a', label: 'A', text: '7' },
        { id: 'opt-m1-b', label: 'B', text: '9' },
        { id: 'opt-m1-c', label: 'C', text: '11' },
        { id: 'opt-m1-d', label: 'D', text: '13' },
      ],
      correctOptionId: 'opt-m1-b',
      explanation: '4x = 32 - 8 = 24 => x = 6. Substituting into 2x - 3 gives 2(6) - 3 = 12 - 3 = 9.',
    },
    {
      id: 'fam-m-02',
      code: 'DEMO-MTH-02',
      subjectId: 'ACADEMIC_MATH',
      subjectName: 'Academic Mathematics',
      stem: 'What is the sum of interior angles in any convex planar quadrilateral?',
      options: [
        { id: 'opt-m2-a', label: 'A', text: '180°' },
        { id: 'opt-m2-b', label: 'B', text: '270°' },
        { id: 'opt-m2-c', label: 'C', text: '360°' },
        { id: 'opt-m2-d', label: 'D', text: '540°' },
      ],
      correctOptionId: 'opt-m2-c',
      explanation: 'The sum of interior angles of an n-sided polygon is (n - 2) × 180°. For n=4, (4 - 2) × 180° = 360°.',
    },
  ],

  // Academic Physics
  ACADEMIC_PHYSICS: [
    {
      id: 'fam-p-01',
      code: 'DEMO-PHY-01',
      subjectId: 'ACADEMIC_PHYSICS',
      subjectName: 'Academic Physics',
      stem: 'According to Newton’s Second Law of Motion, acceleration of an aircraft is directly proportional to:',
      options: [
        { id: 'opt-p1-a', label: 'A', text: 'Net external force acting upon it' },
        { id: 'opt-p1-b', label: 'B', text: 'Total air density' },
        { id: 'opt-p1-c', label: 'C', text: 'Total flight altitude' },
        { id: 'opt-p1-d', label: 'D', text: 'Aircraft empty weight' },
      ],
      correctOptionId: 'opt-p1-a',
      explanation: 'F = ma => a = F/m. Acceleration is directly proportional to net resultant force and inversely proportional to mass.',
    },
    {
      id: 'fam-p-02',
      code: 'DEMO-PHY-02',
      subjectId: 'ACADEMIC_PHYSICS',
      subjectName: 'Academic Physics',
      stem: 'Which SI unit is used to measure electric capacitance in communications systems?',
      options: [
        { id: 'opt-p2-a', label: 'A', text: 'Henry' },
        { id: 'opt-p2-b', label: 'B', text: 'Ohm' },
        { id: 'opt-p2-c', label: 'C', text: 'Farad' },
        { id: 'opt-p2-d', label: 'D', text: 'Tesla' },
      ],
      correctOptionId: 'opt-p2-c',
      explanation: 'The SI unit of electrical capacitance is the Farad (F). Henry is inductance, Ohm is resistance, and Tesla is magnetic flux density.',
    },
  ],

  // Academic English
  ACADEMIC_ENGLISH: [
    {
      id: 'fam-e-01',
      code: 'DEMO-ENG-01',
      subjectId: 'ACADEMIC_ENGLISH',
      subjectName: 'Academic English',
      stem: 'Choose the correct preposition: The cadet platoon was congratulated ________ their outstanding drill performance.',
      options: [
        { id: 'opt-e1-a', label: 'A', text: 'for' },
        { id: 'opt-e1-b', label: 'B', text: 'on' },
        { id: 'opt-e1-c', label: 'C', text: 'at' },
        { id: 'opt-e1-d', label: 'D', text: 'with' },
      ],
      correctOptionId: 'opt-e1-b',
      explanation: 'The verb "congratulate" takes the fixed dependent preposition "on" (e.g., congratulate someone on an achievement).',
    },
  ],

  // Academic Biology
  ACADEMIC_BIOLOGY: [
    {
      id: 'fam-b-01',
      code: 'DEMO-BIO-01',
      subjectId: 'ACADEMIC_BIOLOGY',
      subjectName: 'Academic Biology',
      stem: 'Which organelle is recognized as the primary site of cellular ATP synthesis in aerobic respiration?',
      options: [
        { id: 'opt-b1-a', label: 'A', text: 'Mitochondria' },
        { id: 'opt-b1-b', label: 'B', text: 'Ribosome' },
        { id: 'opt-b1-c', label: 'C', text: 'Golgi Apparatus' },
        { id: 'opt-b1-d', label: 'D', text: 'Endoplasmic Reticulum' },
      ],
      correctOptionId: 'opt-b1-a',
      explanation: 'Mitochondria are the powerhouses of eukaryotic cells, generating the majority of cellular adenosine triphosphate (ATP).',
    },
  ],

  // Academic Chemistry
  ACADEMIC_CHEMISTRY: [
    {
      id: 'fam-c-01',
      code: 'DEMO-CHM-01',
      subjectId: 'ACADEMIC_CHEMISTRY',
      subjectName: 'Academic Chemistry',
      stem: 'What is the oxidation state of sulfur in sulfuric acid (H2SO4)?',
      options: [
        { id: 'opt-c1-a', label: 'A', text: '+4' },
        { id: 'opt-c1-b', label: 'B', text: '+6' },
        { id: 'opt-c1-c', label: 'C', text: '+2' },
        { id: 'opt-c1-d', label: 'D', text: '-2' },
      ],
      correctOptionId: 'opt-c1-b',
      explanation: 'In H2SO4: 2(+1) + S + 4(-2) = 0 => +2 + S - 8 = 0 => S = +6.',
    },
  ],

  // General Knowledge & National Studies
  GENERAL_KNOWLEDGE: [
    {
      id: 'fam-gk-01',
      code: 'DEMO-GEN-01',
      subjectId: 'GENERAL_KNOWLEDGE',
      subjectName: 'General Knowledge',
      stem: 'What is the highest military gallantry award in the Pakistan Armed Forces?',
      options: [
        { id: 'opt-gk1-a', label: 'A', text: 'Hilal-e-Jurat' },
        { id: 'opt-gk1-b', label: 'B', text: 'Sitara-e-Basalat' },
        { id: 'opt-gk1-c', label: 'C', text: 'Nishan-e-Haider' },
        { id: 'opt-gk1-d', label: 'D', text: 'Tamgha-e-Diffa' },
      ],
      correctOptionId: 'opt-gk1-c',
      explanation: 'Nishan-e-Haider (Sign of the Lion) is Pakistan’s highest military valor award, presented posthumously for extraordinary acts of heroism.',
    },
  ],
};

/**
 * Normalizes subject identifier from section metadata into standard demo keys
 */
function normalizeSubjectKey(rawKey?: string | null): string {
  if (!rawKey) return 'INTELLIGENCE_VERBAL';
  const upper = rawKey.toUpperCase();
  if (upper.includes('NON_VERBAL') || upper.includes('NON VERBAL') || upper.includes('MATRIX')) {
    return 'INTELLIGENCE_NON_VERBAL';
  }
  if (upper.includes('VERBAL') || upper.includes('INTELLIGENCE')) {
    return 'INTELLIGENCE_VERBAL';
  }
  if (upper.includes('MATH')) return 'ACADEMIC_MATH';
  if (upper.includes('PHYSIC')) return 'ACADEMIC_PHYSICS';
  if (upper.includes('ENGLISH')) return 'ACADEMIC_ENGLISH';
  if (upper.includes('BIO')) return 'ACADEMIC_BIOLOGY';
  if (upper.includes('CHEM')) return 'ACADEMIC_CHEMISTRY';
  if (upper.includes('GENERAL') || upper.includes('PAK')) return 'GENERAL_KNOWLEDGE';
  return 'INTELLIGENCE_VERBAL';
}

export const familiarizationService = {
  /**
   * Generates exactly 5 practice questions matching the real test's sections
   * @param sections Active test section blueprints or database records
   * @param count Target question count (fixed at 5 per specification)
   */
  generatePracticeQuestions(
    sections?: Array<{ subject_id?: string | null; name?: string }>,
    count: number = 5
  ): PracticeQuestion[] {
    // 1. Determine enabled subjects from real test
    const enabledSubjects = new Set<string>();

    if (sections && sections.length > 0) {
      for (const s of sections) {
        const key = normalizeSubjectKey(s.subject_id || s.name);
        enabledSubjects.add(key);
      }
    }

    // Default fallback if no valid sections provided: standard Tri-Service composite
    if (enabledSubjects.size === 0) {
      enabledSubjects.add('INTELLIGENCE_VERBAL');
      enabledSubjects.add('INTELLIGENCE_NON_VERBAL');
      enabledSubjects.add('ACADEMIC_MATH');
    }

    const subjectList = Array.from(enabledSubjects);
    const selected: PracticeQuestion[] = [];
    const usedIds = new Set<string>();

    // 2. Proportionally allocate exactly 5 questions among enabled subjects
    let currentSubjectIndex = 0;
    while (selected.length < count) {
      const targetSubject = subjectList[currentSubjectIndex % subjectList.length];
      const availablePool = DEMO_QUESTIONS_BY_SUBJECT[targetSubject] || DEMO_QUESTIONS_BY_SUBJECT.INTELLIGENCE_VERBAL;

      const unusedQ = availablePool.find((q) => !usedIds.has(q.id));
      if (unusedQ) {
        selected.push(unusedQ);
        usedIds.add(unusedQ.id);
      } else {
        // If pool exhausted, pick from primary intelligence demo pool
        const fallback = DEMO_QUESTIONS_BY_SUBJECT.INTELLIGENCE_VERBAL.find((q) => !usedIds.has(q.id));
        if (fallback) {
          selected.push(fallback);
          usedIds.add(fallback.id);
        } else {
          // Wrap around safely
          selected.push({
            ...availablePool[0],
            id: `fam-wrap-${selected.length}`,
          });
        }
      }
      currentSubjectIndex++;
    }

    return selected.slice(0, count);
  },

  /**
   * Loads familiarization data: uses backend RPC if available to dynamically match test sections,
   * otherwise falls back to local calibrated question pool.
   */
  async getFamiliarizationData(
    testId?: string | null,
    sections?: Array<{ subject_id?: string | null; name: string }>,
  ): Promise<{
    durationSeconds: number;
    questionCount: number;
    questions: PracticeQuestion[];
  }> {
    if (testId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testId) && isSupabaseConfigured()) {
      const { data, error } = await (supabase as any).rpc('get_familiarization_payload', { p_test_id: testId });
      if (error) {
        throw new Error(error.message || 'Failed to load orientation content.');
      }
      if (!data || !data.questions || data.questions.length !== 5) {
        throw new Error('Familiarization content is incomplete for this test.');
      }

      const mapped: PracticeQuestion[] = data.questions.map((q: any) => {
        const correctOpt = (q.options || []).find((o: any) => o.is_correct);
        return {
          id: q.id,
          code: q.code,
          subjectId: q.subject_name || 'ORIENTATION',
          subjectName: q.subject_name || 'Orientation Section',
          stem: q.stem,
          imageUrl: q.stem_image_url || undefined,
          options: (q.options || []).map((o: any) => ({
            id: o.id,
            label: o.label,
            text: o.text,
            imageUrl: o.image_url || undefined,
          })),
          correctOptionId: correctOpt?.id || q.options?.[0]?.id || '',
          explanation: q.explanation || '',
        };
      });
      return {
        durationSeconds: data.duration_seconds || 60,
        questionCount: 5,
        questions: mapped,
      };
    }

    const fallbackQs = this.generatePracticeQuestions(sections, 5);
    return {
      durationSeconds: 60,
      questionCount: fallbackQs.length,
      questions: fallbackQs,
    };
  },

  /**
   * Checks whether candidate has completed familiarization for this test session
   */
  isFamiliarizationCompleted(testId?: string | null): boolean {
    if (!testId) return false;
    try {
      return sessionStorage.getItem(`cbt_fam_completed_${testId}`) === 'true';
    } catch {
      return false;
    }
  },

  /**
   * Records lightweight completion of familiarization (zero scoring, zero attempt consumption)
   */
  markFamiliarizationCompleted(testId?: string | null): void {
    if (!testId) return;
    try {
      sessionStorage.setItem(`cbt_fam_completed_${testId}`, 'true');
    } catch {
      // Ignored in non-browser environments
    }

    // Lightweight database record if authenticated
    if (testId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testId) && isSupabaseConfigured()) {
      Promise.resolve((supabase as any).rpc('record_familiarization_completion', { p_test_id: testId })).catch(() => null);
    }
  },

  /**
   * Clears orientation state (e.g. for Repeat Practice)
   */
  clearFamiliarization(testId?: string | null): void {
    if (!testId) return;
    try {
      sessionStorage.removeItem(`cbt_fam_completed_${testId}`);
    } catch {
      // Ignored
    }
  },
};

export default familiarizationService;
