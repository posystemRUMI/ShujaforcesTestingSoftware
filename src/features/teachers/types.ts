import { MilitaryBranch, SubjectCategory } from '@/types';

export type TeacherRole =
  | 'CHIEF_EXAMINER'
  | 'SENIOR_INSTRUCTOR'
  | 'SUBJECT_SPECIALIST'
  | 'PROCTOR_OFFICER'
  | 'QUESTION_AUTHOR';

export type TeacherStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';

export interface Teacher {
  id: string;
  employeeId: string; // e.g. FAC-2024-01
  fullName: string;
  titleRank: string; // e.g. "Major", "Lt. Commander", "Sqn. Leader", "Dr.", "Engr."
  email: string;
  phone: string;
  assignedSubjects: SubjectCategory[];
  branchAffiliation: MilitaryBranch | 'TRI_SERVICE';
  role: TeacherRole;
  status: TeacherStatus;
  questionsCreatedCount: number;
  activeTestsManaged: number;
  lastActiveAt: string;
  joinedAt: string;
  bio?: string;
  avatarUrl?: string;
}

export type { TeacherFormData } from './teacherSchema';
