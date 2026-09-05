import {
  ForceConfig,
  CourseConfig,
  SubjectConfig,
  AcademySettings,
} from './types';

const INITIAL_FORCES: ForceConfig[] = [
  {
    id: 'force-army',
    name: 'Pakistan Army',
    branch: 'PAKISTAN_ARMY',
    motto: 'Iman, Taqwa, Jihad fi Sabilillah',
    mottoTranslation: 'Faith, Piety and Struggle in the Path of Allah',
    headquarters: 'General Headquarters (GHQ), Rawalpindi',
    coursesCount: 3,
    enrolledCadetsCount: 114,
    totalQuestionsCount: 1450,
    activeTestsCount: 8,
    description:
      'The land service branch of the Pakistan Armed Forces. Primary officer induction via Pakistan Military Academy (PMA) Kakul and Technical Cadet Corps (TCC).',
    inductionCenter: 'Army Selection & Recruitment Center (AS&RC)',
  },
  {
    id: 'force-air-force',
    name: 'Pakistan Air Force',
    branch: 'PAKISTAN_AIR_FORCE',
    motto: 'Sehra ast ke Darya ast, Tah-o-Bala-o-Par-i-Mast',
    mottoTranslation: 'Lord of All I Survey, over Sea and Desert Alike',
    headquarters: 'Air Headquarters (AHQ), Islamabad',
    coursesCount: 2,
    enrolledCadetsCount: 60,
    totalQuestionsCount: 980,
    activeTestsCount: 6,
    description:
      'The aerial warfare branch. Primary officer training at PAF Academy Asghar Khan, Risalpur across GD(P), CAE, Air Defence, and Admin branches.',
    inductionCenter: 'PAF Information & Selection Center (I&SC)',
  },
  {
    id: 'force-navy',
    name: 'Pakistan Navy',
    branch: 'PAKISTAN_NAVY',
    motto: 'Himmat Ka Nishan, Samundar Ki Jaan',
    mottoTranslation: 'A Silent Force to Reckon With / Pride of the Seas',
    headquarters: 'Naval Headquarters (NHQ), Islamabad',
    coursesCount: 2,
    enrolledCadetsCount: 28,
    totalQuestionsCount: 720,
    activeTestsCount: 4,
    description:
      'The naval warfare service branch. Primary officer inductees undergo rigorous seamanship, navigation, and engineering at Pakistan Naval Academy (PNA) PNS Rahbar, Manora.',
    inductionCenter: 'PN Recruitment & Selection Center (PNS Manora)',
  },
];

const INITIAL_COURSES: CourseConfig[] = [
  {
    id: 'crs-01',
    code: '154-PMA-LC',
    name: '154 PMA Long Course',
    branch: 'PAKISTAN_ARMY',
    durationMonths: 24,
    minAge: 17,
    maxAge: 22,
    educationRequirement: 'Intermediate / F.Sc / A-Level (Minimum 60% Marks)',
    passingMarksPercent: 60,
    batchesCount: 2,
    status: 'ACTIVE',
    description: 'Regular Commission in the Pakistan Army Combat Arms and Services.',
  },
  {
    id: 'crs-02',
    code: '158-PAF-GDP',
    name: '158 General Duty Pilot (GDP)',
    branch: 'PAKISTAN_AIR_FORCE',
    durationMonths: 36,
    minAge: 16,
    maxAge: 22,
    educationRequirement: 'F.Sc (Pre-Engineering / Pre-Medical with Additional Math) (60% Marks)',
    passingMarksPercent: 65,
    batchesCount: 1,
    status: 'ACTIVE',
    description: 'Permanent Commission in PAF Flying Branch as Fighter / Transport Pilot.',
  },
  {
    id: 'crs-03',
    code: 'PN-CADET-26A',
    name: 'PN Cadet 2026-A Term',
    branch: 'PAKISTAN_NAVY',
    durationMonths: 18,
    minAge: 17,
    maxAge: 21,
    educationRequirement: 'F.Sc (Pre-Engineering) with Physics & Math (60% Marks)',
    passingMarksPercent: 60,
    batchesCount: 1,
    status: 'ACTIVE',
    description: 'Permanent Commission in Operations, Weapon Engineering, and Marine Engineering.',
  },
  {
    id: 'crs-04',
    code: '36-TCC',
    name: '36 Technical Cadet Course (TCC)',
    branch: 'PAKISTAN_ARMY',
    durationMonths: 48,
    minAge: 17,
    maxAge: 21,
    educationRequirement: 'F.Sc (Pre-Engineering / ICS with Physics & Math) (65% Marks)',
    passingMarksPercent: 65,
    batchesCount: 1,
    status: 'ACTIVE',
    description: 'Military Engineering Degree at NUST followed by 1 Year Military Training at PMA.',
  },
  {
    id: 'crs-05',
    code: '104-PAF-CAE',
    name: '104 College of Aeronautical Engineering (CAE)',
    branch: 'PAKISTAN_AIR_FORCE',
    durationMonths: 48,
    minAge: 16,
    maxAge: 22,
    educationRequirement: 'F.Sc (Pre-Engineering) with 65% Marks in Physics & Mathematics',
    passingMarksPercent: 65,
    batchesCount: 1,
    status: 'ACTIVE',
    description: 'Aeronautical and Avionics Engineering Officer Commission at PAF Academy Risalpur.',
  },
  {
    id: 'crs-06',
    code: 'LCC-24',
    name: 'Lady Cadet Course (LCC-24)',
    branch: 'PAKISTAN_ARMY',
    durationMonths: 6,
    minAge: 20,
    maxAge: 28,
    educationRequirement: '16 Years of Education / Masters in Engineering, IT, or Law',
    passingMarksPercent: 60,
    batchesCount: 1,
    status: 'ACTIVE',
    description: 'Direct Short Service Commission for Female Officers in Corps of Signals, EME, and JAG.',
  },
];

const INITIAL_SUBJECTS: SubjectConfig[] = [
  {
    id: 'subj-01',
    code: 'SUBJ-VERB',
    name: 'Verbal Intelligence',
    category: 'INTELLIGENCE',
    questionCount: 420,
    activeTestsCount: 12,
    status: 'ACTIVE',
    description: 'Analogies, classification, coding-decoding, logical sequencing, and syllogisms.',
  },
  {
    id: 'subj-02',
    code: 'SUBJ-NVERB',
    name: 'Non-Verbal Intelligence',
    category: 'INTELLIGENCE',
    questionCount: 380,
    activeTestsCount: 12,
    status: 'ACTIVE',
    description: 'Pattern series, matrix completion, spatial rotation, and paper folding reasoning.',
  },
  {
    id: 'subj-03',
    code: 'SUBJ-PHYS',
    name: 'Physics',
    category: 'ACADEMIC',
    questionCount: 310,
    activeTestsCount: 8,
    status: 'ACTIVE',
    description: 'Mechanics, thermodynamics, electrodynamics, optics, and nuclear physics.',
  },
  {
    id: 'subj-04',
    code: 'SUBJ-MATH',
    name: 'Mathematics',
    category: 'ACADEMIC',
    questionCount: 290,
    activeTestsCount: 8,
    status: 'ACTIVE',
    description: 'Algebra, trigonometry, calculus, analytical geometry, and vectors.',
  },
  {
    id: 'subj-05',
    code: 'SUBJ-ENG',
    name: 'English',
    category: 'ACADEMIC',
    questionCount: 275,
    activeTestsCount: 10,
    status: 'ACTIVE',
    description: 'Grammar, vocabulary, sentence correction, active/passive voice, and comprehension.',
  },
  {
    id: 'subj-06',
    code: 'SUBJ-CHEM',
    name: 'Chemistry',
    category: 'ACADEMIC',
    questionCount: 190,
    activeTestsCount: 4,
    status: 'ACTIVE',
    description: 'Physical chemistry, organic reaction mechanisms, stoichiometry, and periodicity.',
  },
  {
    id: 'subj-07',
    code: 'SUBJ-BIO',
    name: 'Biology',
    category: 'ACADEMIC',
    questionCount: 160,
    activeTestsCount: 3,
    status: 'ACTIVE',
    description: 'Cell biology, human physiology, genetics, and biotechnology modules.',
  },
  {
    id: 'subj-08',
    code: 'SUBJ-GK',
    name: 'General Knowledge',
    category: 'GENERAL',
    questionCount: 240,
    activeTestsCount: 6,
    status: 'ACTIVE',
    description: 'World geography, international affairs, military treaties, capitals, and currencies.',
  },
  {
    id: 'subj-09',
    code: 'SUBJ-PAK',
    name: 'Pakistan Studies',
    category: 'GENERAL',
    questionCount: 210,
    activeTestsCount: 6,
    status: 'ACTIVE',
    description: 'Freedom movement, constitutional history, national defense, and geographic strategic points.',
  },
  {
    id: 'subj-10',
    code: 'SUBJ-ISL',
    name: 'Islamiat',
    category: 'GENERAL',
    questionCount: 180,
    activeTestsCount: 6,
    status: 'ACTIVE',
    description: 'Quranic teachings, Seerat-un-Nabi (PBUH), Islamic battles, and ethical principles.',
  },
];

const INITIAL_SETTINGS: AcademySettings = {
  academyProfile: {
    name: 'Forces Academy Computerized Testing System',
    campusLocation: 'Joint Armed Forces Assessment Complex, Sector H-9, Islamabad',
    commandOfficer: 'Brigadier Muhammad Ahsan (Retd.), Chief Academic Director',
    contactEmail: 'director.examinations@forcesacademy.edu.pk',
    contactPhone: '+92 51 9260114',
    centerCode: 'CBT-ISB-CTR-01',
  },
  examDefaults: {
    defaultDurationMinutes: 45,
    passingScorePercent: 60,
    negativeMarking: true,
    negativeMarkingPenalty: 0.25,
    shuffleQuestions: true,
    shuffleOptions: true,
    keyReleaseTiming: 'DELAYED_PROCTOR_RELEASE',
    anomalyLockThreshold: 3,
  },
  notificationPreferences: {
    proctorSoundAlerts: true,
    autoFlagAnomalies: true,
    dailyCadetSummary: true,
    retakeAlerts: true,
  },
  interfacePreferences: {
    cadetHighContrastMode: false,
    compactAdminTables: false,
    stanineDistributionNorm: 'NORMALIZED_BELL',
  },
  systemInfo: {
    softwareVersion: 'v2.4.0-AIRGAP-LOCKED',
    buildIdentifier: 'BUILD-2026-SEP-SHA256-FA39C8',
    airGapStatus: 'VERIFIED_OFFLINE',
    terminalWorkstationsOnline: 64,
    lastSecurityChecksum: 'e8b39a1f7d492c10b0e517865c1926f0',
  },
};

class ConfigStore {
  private forces: ForceConfig[] = [...INITIAL_FORCES];
  private courses: CourseConfig[] = [...INITIAL_COURSES];
  private subjects: SubjectConfig[] = [...INITIAL_SUBJECTS];
  private settings: AcademySettings = { ...INITIAL_SETTINGS };
  private listeners: (() => void)[] = [];

  constructor() {
    try {
      const storedForces = localStorage.getItem('forces_academy_forces');
      if (storedForces) this.forces = JSON.parse(storedForces);

      const storedCourses = localStorage.getItem('forces_academy_courses');
      if (storedCourses) this.courses = JSON.parse(storedCourses);

      const storedSubjects = localStorage.getItem('forces_academy_subjects');
      if (storedSubjects) this.subjects = JSON.parse(storedSubjects);

      const storedSettings = localStorage.getItem('forces_academy_settings');
      if (storedSettings) this.settings = JSON.parse(storedSettings);
    } catch {
      // Ignore
    }
  }

  private persist() {
    try {
      localStorage.setItem('forces_academy_forces', JSON.stringify(this.forces));
      localStorage.setItem('forces_academy_courses', JSON.stringify(this.courses));
      localStorage.setItem('forces_academy_subjects', JSON.stringify(this.subjects));
      localStorage.setItem('forces_academy_settings', JSON.stringify(this.settings));
    } catch {
      // Ignore
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Forces
  getForces(): ForceConfig[] {
    return [...this.forces];
  }

  getForceById(id: string): ForceConfig | undefined {
    return this.forces.find((f) => f.id === id || f.branch === id);
  }

  // Courses
  getCourses(): CourseConfig[] {
    return [...this.courses];
  }

  getCoursesByForce(branch: string): CourseConfig[] {
    return this.courses.filter((c) => c.branch === branch);
  }

  addCourse(course: Omit<CourseConfig, 'id' | 'batchesCount'>): CourseConfig {
    const newCourse: CourseConfig = {
      ...course,
      id: `crs-${Date.now()}`,
      batchesCount: 0,
    };
    this.courses = [newCourse, ...this.courses];
    this.persist();
    return newCourse;
  }

  updateCourse(id: string, data: Partial<CourseConfig>): CourseConfig | null {
    const idx = this.courses.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.courses[idx] = { ...this.courses[idx], ...data };
    this.persist();
    return this.courses[idx];
  }

  toggleCourseStatus(id: string): CourseConfig | null {
    const c = this.courses.find((item) => item.id === id);
    if (!c) return null;
    return this.updateCourse(id, {
      status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
  }

  // Subjects
  getSubjects(): SubjectConfig[] {
    return [...this.subjects];
  }

  addSubject(subject: Omit<SubjectConfig, 'id' | 'questionCount' | 'activeTestsCount'>): SubjectConfig {
    const newSubject: SubjectConfig = {
      ...subject,
      id: `subj-${Date.now()}`,
      questionCount: 0,
      activeTestsCount: 0,
    };
    this.subjects = [newSubject, ...this.subjects];
    this.persist();
    return newSubject;
  }

  updateSubject(id: string, data: Partial<SubjectConfig>): SubjectConfig | null {
    const idx = this.subjects.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.subjects[idx] = { ...this.subjects[idx], ...data };
    this.persist();
    return this.subjects[idx];
  }

  toggleSubjectStatus(id: string): SubjectConfig | null {
    const s = this.subjects.find((item) => item.id === id);
    if (!s) return null;
    return this.updateSubject(id, {
      status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
  }

  // Settings
  getSettings(): AcademySettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<AcademySettings>): AcademySettings {
    this.settings = {
      ...this.settings,
      ...newSettings,
      academyProfile: {
        ...this.settings.academyProfile,
        ...(newSettings.academyProfile || {}),
      },
      examDefaults: {
        ...this.settings.examDefaults,
        ...(newSettings.examDefaults || {}),
      },
      notificationPreferences: {
        ...this.settings.notificationPreferences,
        ...(newSettings.notificationPreferences || {}),
      },
      interfacePreferences: {
        ...this.settings.interfacePreferences,
        ...(newSettings.interfacePreferences || {}),
      },
    };
    this.persist();
    return this.settings;
  }
}

export const configStore = new ConfigStore();
