/**
 * Official Armed Forces Test Patterns & Configuration Engine
 * Strictly enforces ONLY:
 * 1. Pakistan Army (PMA Long Course, AFNS)
 * 2. Pakistan Air Force (GD(P) & Aeronautical Engineering, Airman)
 * 3. Pakistan Navy (Sailor)
 */

export interface OfficialForce {
  id: string;
  code: string;
  name: string;
  motto: string;
}

export interface OfficialCourse {
  id: string;
  forceCode: string;
  code: string;
  name: string;
}

export interface OfficialTestConfig {
  sequence: number;
  testName: string;
  code: string;
  totalQuestions: number;
  passingMarks: number;
  passingScorePercent: number;
  durationMinutes: number;
}

export const OFFICIAL_FORCES: OfficialForce[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    code: 'PAKISTAN_ARMY',
    name: 'Pakistan Army',
    motto: 'Iman, Taqwa, Jihad-fi-Sabilillah',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    code: 'PAKISTAN_AIR_FORCE',
    name: 'Pakistan Air Force (PAF)',
    motto: 'Sehraast Ki Daryaast',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    code: 'PAKISTAN_NAVY',
    name: 'Pakistan Navy',
    motto: 'Himmat Humaray Sath Hai',
  },
];

export const OFFICIAL_COURSES: OfficialCourse[] = [
  // Pakistan Army Courses
  {
    id: '10000000-0000-0000-0000-000000000001',
    forceCode: 'PAKISTAN_ARMY',
    code: 'PMA_LONG_COURSE',
    name: 'PMA Long Course',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    forceCode: 'PAKISTAN_ARMY',
    code: 'AFNS',
    name: 'AFNS',
  },
  // PAF Courses
  {
    id: '20000000-0000-0000-0000-000000000001',
    forceCode: 'PAKISTAN_AIR_FORCE',
    code: 'GDP_CAE',
    name: 'GD(P) & Aeronautical Engineering',
  },
  {
    id: '20000000-0000-0000-0000-000000000006',
    forceCode: 'PAKISTAN_AIR_FORCE',
    code: 'AIRMAN',
    name: 'Airman',
  },
  // Navy Courses
  {
    id: '30000000-0000-0000-0000-000000000004',
    forceCode: 'PAKISTAN_NAVY',
    code: 'SAILOR',
    name: 'Sailor',
  },
];

export const OFFICIAL_TEST_PATTERNS: Record<string, OfficialTestConfig[]> = {
  // 1. PAF — GD(P) & Aeronautical Engineering
  // Sequence: Intelligence -> Physics -> English -> Mathematics
  GDP_CAE: [
    {
      sequence: 1,
      testName: 'Intelligence',
      code: 'INTEL_GDP',
      totalQuestions: 100,
      passingMarks: 55,
      passingScorePercent: 55,
      durationMinutes: 35,
    },
    {
      sequence: 2,
      testName: 'Physics',
      code: 'PHYS_GDP',
      totalQuestions: 50,
      passingMarks: 30,
      passingScorePercent: 60,
      durationMinutes: 25,
    },
    {
      sequence: 3,
      testName: 'English',
      code: 'ENG_GDP',
      totalQuestions: 70,
      passingMarks: 40,
      passingScorePercent: 57.14,
      durationMinutes: 30,
    },
    {
      sequence: 4,
      testName: 'Mathematics',
      code: 'MATH_GDP',
      totalQuestions: 50,
      passingMarks: 30,
      passingScorePercent: 60,
      durationMinutes: 35,
    },
  ],

  // 2. Pakistan Army — PMA Long Course
  // Sequence: Verbal Intelligence -> Non-Verbal Intelligence -> Academic Test
  PMA_LONG_COURSE: [
    {
      sequence: 1,
      testName: 'Verbal Intelligence',
      code: 'VERBAL_PMA',
      totalQuestions: 84,
      passingMarks: 50,
      passingScorePercent: 59.52,
      durationMinutes: 30,
    },
    {
      sequence: 2,
      testName: 'Non-Verbal Intelligence',
      code: 'NONVERBAL_PMA',
      totalQuestions: 64,
      passingMarks: 32,
      passingScorePercent: 50,
      durationMinutes: 30,
    },
    {
      sequence: 3,
      testName: 'Academic Test',
      code: 'ACADEMIC_PMA',
      totalQuestions: 50,
      passingMarks: 30,
      passingScorePercent: 60,
      durationMinutes: 30,
    },
  ],

  // 3. Pakistan Army — AFNS (Same pattern as PMA Long Course)
  // Sequence: Verbal Intelligence -> Non-Verbal Intelligence -> Academic Test
  AFNS: [
    {
      sequence: 1,
      testName: 'Verbal Intelligence',
      code: 'VERBAL_AFNS',
      totalQuestions: 84,
      passingMarks: 50,
      passingScorePercent: 59.52,
      durationMinutes: 30,
    },
    {
      sequence: 2,
      testName: 'Non-Verbal Intelligence',
      code: 'NONVERBAL_AFNS',
      totalQuestions: 64,
      passingMarks: 32,
      passingScorePercent: 50,
      durationMinutes: 30,
    },
    {
      sequence: 3,
      testName: 'Academic Test',
      code: 'ACADEMIC_AFNS',
      totalQuestions: 50,
      passingMarks: 30,
      passingScorePercent: 60,
      durationMinutes: 30,
    },
  ],

  // 4. PAF — Airman
  // Sequence: Intelligence -> English
  AIRMAN: [
    {
      sequence: 1,
      testName: 'Intelligence',
      code: 'INTEL_AIRMAN',
      totalQuestions: 100,
      passingMarks: 55,
      passingScorePercent: 55,
      durationMinutes: 35,
    },
    {
      sequence: 2,
      testName: 'English',
      code: 'ENG_AIRMAN',
      totalQuestions: 50,
      passingMarks: 30,
      passingScorePercent: 60,
      durationMinutes: 20,
    },
  ],

  // 5. Pakistan Navy — Sailor
  // Sequence: Intelligence -> Academic
  SAILOR: [
    {
      sequence: 1,
      testName: 'Intelligence',
      code: 'INTEL_SAILOR',
      totalQuestions: 40,
      passingMarks: 24,
      passingScorePercent: 60,
      durationMinutes: 20,
    },
    {
      sequence: 2,
      testName: 'Academic',
      code: 'ACADEMIC_SAILOR',
      totalQuestions: 40,
      passingMarks: 24,
      passingScorePercent: 60,
      durationMinutes: 20,
    },
  ],
};

/**
 * Helper: Find course code by ID or Name or Code
 */
export function normalizeCourseCode(input?: string | null): string {
  if (!input) return 'UNKNOWN';
  const str = input.toLowerCase().trim();

  if (str.includes('gdp') || str.includes('gd(p)') || str.includes('cae') || str.includes('aeronautical')) return 'GDP_CAE';
  if (str.includes('airman')) return 'AIRMAN';
  if (str.includes('sailor')) return 'SAILOR';
  if (str.includes('afns') || str.includes('nursing')) return 'AFNS';
  if (str.includes('pma') || str.includes('long course')) return 'PMA_LONG_COURSE';

  return 'UNKNOWN';
}

/**
 * Helper: Find Force Code by Force Name or Code
 */
export function normalizeForceCode(input?: string | null): string {
  if (!input) return 'PAKISTAN_ARMY';
  const str = input.toLowerCase().trim();

  if (str.includes('air') || str.includes('paf')) return 'PAKISTAN_AIR_FORCE';
  if (str.includes('navy') || str.includes('pn')) return 'PAKISTAN_NAVY';
  if (str.includes('army')) return 'PAKISTAN_ARMY';

  return 'PAKISTAN_ARMY';
}

/**
 * Get tests for a given course in exact predefined sequence
 */
export function getOfficialTestsForCourse(courseInput?: string | null): OfficialTestConfig[] {
  const code = normalizeCourseCode(courseInput);
  return OFFICIAL_TEST_PATTERNS[code] || OFFICIAL_TEST_PATTERNS['PMA_LONG_COURSE'];
}

/**
 * Auto-load configuration for Admin Test Creation when (Course, TestName) is selected
 */
export function autoConfigForTest(courseInput: string, testNameInput: string): OfficialTestConfig | null {
  const tests = getOfficialTestsForCourse(courseInput);
  const targetName = testNameInput.toLowerCase().trim();

  return (
    tests.find((t) => t.testName.toLowerCase().trim() === targetName || t.code.toLowerCase() === targetName) || null
  );
}

/**
 * Strict Security Guard: Verify if student's registered course matches test course
 */
export function isTestAuthorizedForStudent(
  studentCourse: string | null | undefined,
  testCourse: string | null | undefined
): boolean {
  if (!studentCourse || !testCourse) return true; // If admin or missing context, allow
  const sCode = normalizeCourseCode(studentCourse);
  const tCode = normalizeCourseCode(testCourse);
  if (sCode === tCode) return true;
  // PMA Long Course & AFNS share the exact same Army syllabus and test pattern
  if (
    (sCode === 'PMA_LONG_COURSE' || sCode === 'AFNS') &&
    (tCode === 'PMA_LONG_COURSE' || tCode === 'AFNS')
  ) {
    return true;
  }
  return false;
}
