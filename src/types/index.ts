export type MilitaryBranch = 'PAKISTAN_ARMY' | 'PAKISTAN_AIR_FORCE' | 'PAKISTAN_NAVY';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cadetId?: string;
  rollNumber?: string;
  branch?: MilitaryBranch;
  rankTitle?: string;
  avatarUrl?: string;
}

export type CadetStatus = 'ACTIVE' | 'GRADUATED' | 'RETAKE_REQUIRED' | 'DISQUALIFIED';

export interface Cadet {
  id: string;
  cnic: string;
  rollNumber: string;
  fullName: string;
  fatherName: string;
  branch: MilitaryBranch;
  batchId: string;
  batchCode: string;
  status: CadetStatus;
  enrolledAt: string;
  avatarUrl?: string;
  academicScoreAverage: number;
  intelligenceScoreAverage: number;
}

export interface Batch {
  id: string;
  code: string;
  name: string;
  branch: MilitaryBranch;
  cadetCount: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'UPCOMING';
  targetCourse: string; // e.g., "154 PMA Long Course", "158 GDP", "PN Cadet 2026-A"
}

export type SubjectCategory =
  | 'INTELLIGENCE_VERBAL'
  | 'INTELLIGENCE_NON_VERBAL'
  | 'ACADEMIC_PHYSICS'
  | 'ACADEMIC_MATH'
  | 'ACADEMIC_ENGLISH'
  | 'GENERAL_KNOWLEDGE';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export type QuestionApprovalStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'ARCHIVED';

export interface QuestionOption {
  id: string;
  label: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
  imageUrl?: string;
}

export interface Question {
  id: string;
  code: string;
  subject: SubjectCategory;
  subject_id?: string;
  subjectName?: string;
  branch: MilitaryBranch | 'TRI_SERVICE';
  stem: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  difficulty: DifficultyLevel;
  timeLimitSeconds: number;
  status: QuestionApprovalStatus;
  imageUrl?: string;
  authorName: string;
  tags: string[];
  updatedAt: string;
}

export interface TestSection {
  id: string;
  title: string;
  subject: SubjectCategory;
  questionCount: number;
  timeLimitMinutes: number;
}

export interface TestBlueprint {
  id: string;
  code: string;
  title: string;
  branch: MilitaryBranch | 'TRI_SERVICE';
  courseTarget: string;
  totalQuestions: number;
  durationMinutes: number;
  passingScorePercent: number;
  negativeMarking: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  sections: TestSection[];
  familiarizationEnabled?: boolean;
  familiarizationDurationSeconds?: number;
  familiarizationQuestionCount?: number;
}

export type ExamStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'PAUSED' | 'AUTO_SUBMITTED';

export interface ExamSession {
  id: string;
  testId: string;
  testTitle: string;
  cadetId: string;
  cadetName: string;
  rollNumber: string;
  branch: MilitaryBranch;
  terminalId: string;
  startedAt: string;
  expiresAt: string;
  status: ExamStatus;
  answers: Record<string, string>; // questionId -> optionId
  flaggedQuestionIds: string[];
  currentQuestionIndex: number;
  remainingSeconds: number;
  totalQuestions: number;
}

export type TerminalWorkstationStatus = 'ONLINE' | 'ACTIVE_EXAM' | 'ANOMALY' | 'OFFLINE';

export interface TerminalWorkstation {
  id: string;
  terminalCode: string;
  ipAddress: string;
  status: TerminalWorkstationStatus;
  currentCadet: {
    rollNumber: string;
    name: string;
    branch: MilitaryBranch;
  } | null;
  testTitle: string | null;
  currentQuestion: number;
  totalQuestions: number;
  timeRemainingSeconds: number;
  answeredCount: number;
  networkLatencyMs: number;
  anomalyDetected: boolean;
  anomalyMessage?: string;
  lockStatus: boolean;
}

export interface SectionScore {
  sectionTitle: string;
  subject: SubjectCategory;
  score: number;
  maxScore: number;
  passed: boolean;
}

export interface ExamResult {
  id: string;
  examSessionId: string;
  testId: string;
  testTitle: string;
  cadetId: string;
  cadetName: string;
  rollNumber: string;
  branch: MilitaryBranch;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
  timeSpentSeconds: number;
  sectionBreakdown: SectionScore[];
  verificationHash: string;
}

export interface RetakeDocket {
  id: string;
  originalResultId: string;
  cadetId: string;
  cadetName: string;
  rollNumber: string;
  branch: MilitaryBranch;
  testTitle: string;
  failedSubject: string;
  previousScorePercent: number;
  scheduledDate: string;
  reason: string;
  status: 'PENDING_APPROVAL' | 'SCHEDULED' | 'IN_PROGRESS' | 'RESOLVED';
  authorizedOfficer: string;
}
