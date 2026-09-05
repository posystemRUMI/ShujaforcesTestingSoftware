import { MilitaryBranch } from '@/types';

export interface ForceConfig {
  id: string;
  name: string;
  branch: MilitaryBranch;
  motto: string;
  mottoTranslation: string;
  headquarters: string;
  coursesCount: number;
  enrolledCadetsCount: number;
  totalQuestionsCount: number;
  activeTestsCount: number;
  description: string;
  inductionCenter: string;
}

export interface CourseConfig {
  id: string;
  code: string;
  name: string;
  branch: MilitaryBranch;
  durationMonths: number;
  minAge: number;
  maxAge: number;
  educationRequirement: string;
  passingMarksPercent: number;
  batchesCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
}

export interface SubjectConfig {
  id: string;
  code: string;
  name: string;
  category: 'INTELLIGENCE' | 'ACADEMIC' | 'GENERAL';
  questionCount: number;
  activeTestsCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  description: string;
}

export interface AcademySettings {
  academyProfile: {
    name: string;
    campusLocation: string;
    commandOfficer: string;
    contactEmail: string;
    contactPhone: string;
    centerCode: string;
  };
  examDefaults: {
    defaultDurationMinutes: number;
    passingScorePercent: number;
    negativeMarking: boolean;
    negativeMarkingPenalty: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    keyReleaseTiming: 'IMMEDIATE_POST_EXAM' | 'DELAYED_PROCTOR_RELEASE' | 'NEVER';
    anomalyLockThreshold: number;
  };
  notificationPreferences: {
    proctorSoundAlerts: boolean;
    autoFlagAnomalies: boolean;
    dailyCadetSummary: boolean;
    retakeAlerts: boolean;
  };
  interfacePreferences: {
    cadetHighContrastMode: boolean;
    compactAdminTables: boolean;
    stanineDistributionNorm: 'NORMALIZED_BELL' | 'RAW_PERCENTILE';
  };
  systemInfo: {
    softwareVersion: string;
    buildIdentifier: string;
    airGapStatus: 'VERIFIED_OFFLINE' | 'CONNECTED';
    terminalWorkstationsOnline: number;
    lastSecurityChecksum: string;
  };
}
