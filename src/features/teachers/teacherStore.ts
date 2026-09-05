import { Teacher, TeacherFormData } from './types';

const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch-01',
    employeeId: 'FAC-2024-01',
    fullName: 'Tariq Mehmood',
    titleRank: 'Maj.',
    email: 'tariq.mehmood@forcesacademy.edu.pk',
    phone: '+92 300 5551201',
    assignedSubjects: ['INTELLIGENCE_VERBAL', 'INTELLIGENCE_NON_VERBAL', 'GENERAL_KNOWLEDGE'],
    branchAffiliation: 'PAKISTAN_ARMY',
    role: 'SENIOR_INSTRUCTOR',
    status: 'ACTIVE',
    questionsCreatedCount: 342,
    activeTestsManaged: 4,
    lastActiveAt: '2026-09-05T18:40:00Z',
    joinedAt: '2021-03-15',
    bio: 'Former ISSB Psychometric Evaluator with 14 years instructional service in intelligence testing and officer induction preparation.',
  },
  {
    id: 'tch-02',
    employeeId: 'FAC-2024-02',
    fullName: 'Farhan Akhtar',
    titleRank: 'Lt. Cdr.',
    email: 'farhan.akhtar@forcesacademy.edu.pk',
    phone: '+92 321 4443310',
    assignedSubjects: ['ACADEMIC_PHYSICS', 'ACADEMIC_MATH'],
    branchAffiliation: 'PAKISTAN_NAVY',
    role: 'CHIEF_EXAMINER',
    status: 'ACTIVE',
    questionsCreatedCount: 415,
    activeTestsManaged: 6,
    lastActiveAt: '2026-09-05T20:15:00Z',
    joinedAt: '2019-08-01',
    bio: 'Naval Engineering Officer and Chief Examination Moderator for PN Cadet selection and academic qualifying batteries.',
  },
  {
    id: 'tch-03',
    employeeId: 'FAC-2024-03',
    fullName: 'Bilal Tariq',
    titleRank: 'Sqn. Ldr.',
    email: 'bilal.tariq@forcesacademy.edu.pk',
    phone: '+92 333 9876543',
    assignedSubjects: ['ACADEMIC_PHYSICS', 'ACADEMIC_MATH', 'INTELLIGENCE_NON_VERBAL'],
    branchAffiliation: 'PAKISTAN_AIR_FORCE',
    role: 'PROCTOR_OFFICER',
    status: 'ACTIVE',
    questionsCreatedCount: 280,
    activeTestsManaged: 5,
    lastActiveAt: '2026-09-05T21:05:00Z',
    joinedAt: '2020-01-10',
    bio: 'PAF Flight Instructor with focus on General Duty Pilot (GDP) aptitude psychometrics, spatial orientation, and exam center integrity.',
  },
  {
    id: 'tch-04',
    employeeId: 'FAC-2024-04',
    fullName: 'Dr. Ayesha Siddiqa',
    titleRank: 'Dr.',
    email: 'ayesha.siddiqa@forcesacademy.edu.pk',
    phone: '+92 301 2233445',
    assignedSubjects: ['ACADEMIC_ENGLISH', 'INTELLIGENCE_VERBAL'],
    branchAffiliation: 'TRI_SERVICE',
    role: 'SUBJECT_SPECIALIST',
    status: 'ACTIVE',
    questionsCreatedCount: 290,
    activeTestsManaged: 3,
    lastActiveAt: '2026-09-05T16:30:00Z',
    joinedAt: '2022-05-12',
    bio: 'PhD in Applied Linguistics, designing institutional verbal reasoning taxonomies and comprehension evaluation rubrics.',
  },
  {
    id: 'tch-05',
    employeeId: 'FAC-2024-05',
    fullName: 'Kamran Khan',
    titleRank: 'Engr.',
    email: 'kamran.khan@forcesacademy.edu.pk',
    phone: '+92 345 8877665',
    assignedSubjects: ['ACADEMIC_PHYSICS', 'INTELLIGENCE_NON_VERBAL', 'GENERAL_KNOWLEDGE'],
    branchAffiliation: 'TRI_SERVICE',
    role: 'QUESTION_AUTHOR',
    status: 'ACTIVE',
    questionsCreatedCount: 153,
    activeTestsManaged: 2,
    lastActiveAt: '2026-09-04T14:10:00Z',
    joinedAt: '2023-02-20',
    bio: 'Technical author specializing in electromagnetic physics, mechanical aptitude modules, and spatial pattern decomposition.',
  },
  {
    id: 'tch-06',
    employeeId: 'FAC-2024-06',
    fullName: 'Zeeshan Ali',
    titleRank: 'Capt.',
    email: 'zeeshan.ali@forcesacademy.edu.pk',
    phone: '+92 312 9988776',
    assignedSubjects: ['INTELLIGENCE_VERBAL', 'INTELLIGENCE_NON_VERBAL'],
    branchAffiliation: 'PAKISTAN_ARMY',
    role: 'SENIOR_INSTRUCTOR',
    status: 'ON_LEAVE',
    questionsCreatedCount: 98,
    activeTestsManaged: 1,
    lastActiveAt: '2026-08-28T11:00:00Z',
    joinedAt: '2024-01-15',
    bio: 'Infantry Officer on instructional deputation, instructing cadets on analytical reasoning and verbal analogy speed tests.',
  },
];

class TeacherStore {
  private teachers: Teacher[] = [...INITIAL_TEACHERS];
  private listeners: (() => void)[] = [];

  constructor() {
    // Try localStorage if available
    try {
      const stored = localStorage.getItem('forces_academy_teachers');
      if (stored) {
        this.teachers = JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
  }

  private persist() {
    try {
      localStorage.setItem('forces_academy_teachers', JSON.stringify(this.teachers));
    } catch {
      // Ignore
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getTeachers(): Teacher[] {
    return [...this.teachers];
  }

  getTeacherById(id: string): Teacher | undefined {
    return this.teachers.find((t) => t.id === id);
  }

  addTeacher(data: TeacherFormData): Teacher {
    const newTeacher: Teacher = {
      ...data,
      id: `tch-${Date.now()}`,
      questionsCreatedCount: 0,
      activeTestsManaged: 0,
      lastActiveAt: new Date().toISOString(),
      joinedAt: new Date().toISOString().split('T')[0],
    };
    this.teachers = [newTeacher, ...this.teachers];
    this.persist();
    return newTeacher;
  }

  updateTeacher(id: string, data: Partial<TeacherFormData>): Teacher | null {
    const idx = this.teachers.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const updated = {
      ...this.teachers[idx],
      ...data,
      lastActiveAt: new Date().toISOString(),
    };
    this.teachers[idx] = updated;
    this.persist();
    return updated;
  }

  toggleStatus(id: string): Teacher | null {
    const teacher = this.teachers.find((t) => t.id === id);
    if (!teacher) return null;

    const nextStatus = teacher.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.updateTeacher(id, { status: nextStatus });
  }

  deleteTeacher(id: string): boolean {
    const initialLen = this.teachers.length;
    this.teachers = this.teachers.filter((t) => t.id !== id);
    if (this.teachers.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }
}

export const teacherStore = new TeacherStore();
