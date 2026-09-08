import { MilitaryBranch, CadetStatus } from '@/types';

export interface StudentRecord {
  id: string;
  cnic: string;
  rollNumber: string;
  fullName: string;
  fatherName: string;
  phone: string;
  branch: MilitaryBranch;
  batchId: string;
  batchCode: string;
  targetCourse: string;
  status: CadetStatus;
  enrolledAt: string;
  avatarUrl?: string;
  academicScoreAverage: number;
  intelligenceScoreAverage: number;
  totalAttempts: number;
  highestScore: number;
  passRate: number;
  dateOfBirth?: string;
  gender?: string;
  education?: string;
  educationDetails?: string;
  alternatePhone?: string;
  address?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianPhone?: string;
  admissionDate?: string;
  notes?: string;
  email?: string;
}

export interface StudentAttemptHistory {
  id: string;
  testTitle: string;
  attemptNumber: number;
  date: string;
  scorePercent: number;
  meritRank?: number;
  passed: boolean;
  timeSpentMinutes: number;
}
