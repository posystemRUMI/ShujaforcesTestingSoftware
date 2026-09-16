import {
  ForceConfig,
  CourseConfig,
  SubjectConfig,
  AcademySettings,
} from './types';

const INITIAL_FORCES: ForceConfig[] = [];

const INITIAL_COURSES: CourseConfig[] = [];

const INITIAL_SUBJECTS: SubjectConfig[] = [];

const INITIAL_SETTINGS: AcademySettings = {
  academyProfile: {
    name: 'Shuja Forces Academy Pindsultani',
    campusLocation: 'Shuja Forces Academy Campus, Pindsultani, Attock',
    commandOfficer: 'Brigadier Muhammad Ahsan (Retd.), Chief Academic Director',
    contactEmail: 'director.examinations@shujaforces.edu.pk',
    contactPhone: '+92 51 9260114',
    centerCode: 'CBT-SFA-PINDSULTANI-01',
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
    meritDistributionNorm: 'DENSE_RANK',
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
  getCourses(forceId?: string): CourseConfig[] {
    if (!forceId) return [...this.courses];
    return this.courses.filter(
      (c) => c.forceId === forceId || c.branch === forceId || c.id === forceId
    );
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
