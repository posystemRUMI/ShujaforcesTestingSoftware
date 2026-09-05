import { MilitaryBranch } from '@/types';

export interface BatchItem {
  id: string;
  code: string;
  name: string;
  wing: string;
  branch: MilitaryBranch;
  cadetCount: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'UPCOMING';
  targetCourse: string;
  benchmarkPassRate: number; // e.g. 81.4
  meanAggregate: number; // e.g. 76.2
  verbalMastery: number; // e.g. 84.5
  nonVerbalMastery: number; // e.g. 78.2
  academicMastery: number; // e.g. 68.9
  nextMockDate?: string;
  isFlagship?: boolean;
}

export interface BatchTestSchedule {
  id: string;
  batchId: string;
  testTitle: string;
  testCode: string;
  date: string;
  durationMinutes: number;
  totalQuestions: number;
  passingScorePercent: number;
  candidatesAttempted: number;
  averageScorePercent: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface BatchCadetPerformance {
  cadetId: string;
  rollNumber: string;
  fullName: string;
  fatherName: string;
  branch: MilitaryBranch;
  mocksCompleted: number;
  latestScore: number;
  verbalScore: number;
  nonVerbalScore: number;
  academicScore: number;
  stanine: number;
  readiness: 'RECOMMENDED' | 'ON_TRACK' | 'REMEDIATION_REQUIRED';
}
