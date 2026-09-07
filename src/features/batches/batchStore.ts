import { BatchItem, BatchTestSchedule, BatchCadetPerformance } from './types';

const INITIAL_BATCHES: BatchItem[] = [
  {
    id: 'batch-pma-154',
    code: 'BATCH-2026-PMA154',
    name: 'PMA 154 Long Course',
    wing: 'Alpha Wing (Rawalpindi Sector)',
    branch: 'PAKISTAN_ARMY',
    cadetCount: 42,
    startDate: '2026-02-01',
    endDate: '2026-06-30',
    status: 'ACTIVE',
    targetCourse: '154 PMA Long Course',
    benchmarkPassRate: 81.4,
    meanAggregate: 76.2,
    verbalMastery: 84.5,
    nonVerbalMastery: 78.2,
    academicMastery: 68.9,
    nextMockDate: 'Tomorrow 09:00 PKT',
    isFlagship: true,
  },
  {
    id: 'batch-gdp-158',
    code: 'BATCH-2026-GDP158',
    name: '158 General Duty Pilot (GDP)',
    wing: 'Bravo Wing (PAF Risalpur)',
    branch: 'PAKISTAN_AIR_FORCE',
    cadetCount: 36,
    startDate: '2026-02-15',
    endDate: '2026-07-15',
    status: 'ACTIVE',
    targetCourse: '158 GDP Fighter Stream',
    benchmarkPassRate: 85.0,
    meanAggregate: 79.5,
    verbalMastery: 88.0,
    nonVerbalMastery: 82.5,
    academicMastery: 74.0,
    nextMockDate: '2026-09-08 10:00 PKT',
    isFlagship: false,
  },
  {
    id: 'batch-pn-2026a',
    code: 'BATCH-2026-PN26A',
    name: 'PN Cadet 2026-A Intakes',
    wing: 'Charlie Wing (Manora Naval Base)',
    branch: 'PAKISTAN_NAVY',
    cadetCount: 28,
    startDate: '2026-03-01',
    endDate: '2026-08-01',
    status: 'ACTIVE',
    targetCourse: 'PN Cadet 2026-A Term',
    benchmarkPassRate: 77.8,
    meanAggregate: 73.4,
    verbalMastery: 81.0,
    nonVerbalMastery: 75.6,
    academicMastery: 71.2,
    nextMockDate: '2026-09-10 11:30 PKT',
    isFlagship: false,
  },
  {
    id: 'batch-tcc-36',
    code: 'BATCH-2026-TCC36',
    name: 'Technical Cadet Course (TCC 36)',
    wing: 'Delta Wing (NUST Rawalpindi)',
    branch: 'PAKISTAN_ARMY',
    cadetCount: 30,
    startDate: '2026-01-10',
    endDate: '2026-06-15',
    status: 'ACTIVE',
    targetCourse: '36 Technical Cadet Course',
    benchmarkPassRate: 88.6,
    meanAggregate: 82.1,
    verbalMastery: 85.0,
    nonVerbalMastery: 86.4,
    academicMastery: 81.8,
    nextMockDate: '2026-09-12 09:00 PKT',
    isFlagship: false,
  },
  {
    id: 'batch-cae-104',
    code: 'BATCH-2026-CAE104',
    name: '104 CAE Aeronautical Engineering',
    wing: 'Echo Wing (PAF Risalpur)',
    branch: 'PAKISTAN_AIR_FORCE',
    cadetCount: 24,
    startDate: '2026-02-20',
    endDate: '2026-07-30',
    status: 'ACTIVE',
    targetCourse: '104 CAE Engineering Branch',
    benchmarkPassRate: 83.2,
    meanAggregate: 77.8,
    verbalMastery: 83.0,
    nonVerbalMastery: 80.5,
    academicMastery: 76.5,
    nextMockDate: '2026-09-15 14:00 PKT',
    isFlagship: false,
  },
  {
    id: 'batch-pma-153',
    code: 'BATCH-2025-PMA153',
    name: 'PMA 153 Long Course (Graduated)',
    wing: 'Alpha Wing Historical',
    branch: 'PAKISTAN_ARMY',
    cadetCount: 48,
    startDate: '2025-08-01',
    endDate: '2025-12-20',
    status: 'COMPLETED',
    targetCourse: '153 PMA Long Course',
    benchmarkPassRate: 89.2,
    meanAggregate: 83.4,
    verbalMastery: 89.0,
    nonVerbalMastery: 86.0,
    academicMastery: 80.0,
    isFlagship: false,
  },
];

const INITIAL_BATCH_STUDENTS: Record<string, BatchCadetPerformance[]> = {
  'batch-pma-154': [
    {
      cadetId: 'cdt-001',
      rollNumber: 'PMA-88412',
      fullName: 'Hamza Tariq',
      fatherName: 'Tariq Aziz',
      branch: 'PAKISTAN_ARMY',
      mocksCompleted: 6,
      latestScore: 84,
      verbalScore: 88,
      nonVerbalScore: 86,
      academicScore: 78,
      meritRank: 2,
      readiness: 'RECOMMENDED',
    },
    {
      cadetId: 'cdt-002',
      rollNumber: 'PMA-88415',
      fullName: 'Muhammad Bilal Khan',
      fatherName: 'Javed Iqbal Khan',
      branch: 'PAKISTAN_ARMY',
      mocksCompleted: 6,
      latestScore: 79,
      verbalScore: 82,
      nonVerbalScore: 80,
      academicScore: 75,
      meritRank: 3,
      readiness: 'RECOMMENDED',
    },
    {
      cadetId: 'cdt-003',
      rollNumber: 'PMA-88421',
      fullName: 'Saad Ahmed Malik',
      fatherName: 'Malik Nasir Ali',
      branch: 'PAKISTAN_ARMY',
      mocksCompleted: 5,
      latestScore: 74,
      verbalScore: 80,
      nonVerbalScore: 76,
      academicScore: 66,
      meritRank: 4,
      readiness: 'ON_TRACK',
    },
    {
      cadetId: 'cdt-004',
      rollNumber: 'PMA-88429',
      fullName: 'Usman Ghani',
      fatherName: 'Abdul Ghani',
      branch: 'PAKISTAN_ARMY',
      mocksCompleted: 4,
      latestScore: 68,
      verbalScore: 72,
      nonVerbalScore: 70,
      academicScore: 62,
      meritRank: 5,
      readiness: 'REMEDIATION_REQUIRED',
    },
    {
      cadetId: 'cdt-005',
      rollNumber: 'PMA-88435',
      fullName: 'Zain Ul Abideen',
      fatherName: 'Shaukat Ali',
      branch: 'PAKISTAN_ARMY',
      mocksCompleted: 6,
      latestScore: 89,
      verbalScore: 92,
      nonVerbalScore: 90,
      academicScore: 85,
      meritRank: 1,
      readiness: 'RECOMMENDED',
    },
  ],
};

const INITIAL_BATCH_TESTS: Record<string, BatchTestSchedule[]> = {
  'batch-pma-154': [
    {
      id: 'bts-01',
      batchId: 'batch-pma-154',
      testTitle: 'PMA 154 Comprehensive Intelligence Diagnostic #01',
      testCode: 'TST-PMA-INT-01',
      date: '2026-08-25',
      durationMinutes: 45,
      totalQuestions: 90,
      passingScorePercent: 60,
      candidatesAttempted: 42,
      averageScorePercent: 78.4,
      status: 'COMPLETED',
    },
    {
      id: 'bts-02',
      batchId: 'batch-pma-154',
      testTitle: 'Academic Core Battery (Physics & Math Drill)',
      testCode: 'TST-PMA-ACAD-02',
      date: '2026-09-02',
      durationMinutes: 40,
      totalQuestions: 50,
      passingScorePercent: 60,
      candidatesAttempted: 40,
      averageScorePercent: 69.2,
      status: 'COMPLETED',
    },
    {
      id: 'bts-03',
      batchId: 'batch-pma-154',
      testTitle: 'Full Selection Board Simulator (Air-Gapped LAN)',
      testCode: 'TST-PMA-SIM-03',
      date: '2026-09-07',
      durationMinutes: 60,
      totalQuestions: 100,
      passingScorePercent: 65,
      candidatesAttempted: 0,
      averageScorePercent: 0,
      status: 'SCHEDULED',
    },
  ],
};

class BatchStore {
  private batches: BatchItem[] = [...INITIAL_BATCHES];
  private listeners: (() => void)[] = [];

  constructor() {
    try {
      const stored = localStorage.getItem('forces_academy_batches');
      if (stored) {
        this.batches = JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
  }

  private persist() {
    try {
      localStorage.setItem('forces_academy_batches', JSON.stringify(this.batches));
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

  getBatches(): BatchItem[] {
    return [...this.batches];
  }

  getBatchById(id: string): BatchItem | undefined {
    return this.batches.find((b) => b.id === id || b.code === id);
  }

  getBatchStudents(batchId: string): BatchCadetPerformance[] {
    return (
      INITIAL_BATCH_STUDENTS[batchId] || [
        {
          cadetId: 'cdt-generic-01',
          rollNumber: 'CAD-99120',
          fullName: 'Taimoor Shah',
          fatherName: 'Shah Zaman',
          branch: 'PAKISTAN_ARMY',
          mocksCompleted: 3,
          latestScore: 78,
          verbalScore: 82,
          nonVerbalScore: 76,
          academicScore: 72,
          meritRank: 2,
          readiness: 'ON_TRACK',
        },
        {
          cadetId: 'cdt-generic-02',
          rollNumber: 'CAD-99121',
          fullName: 'Daniyal Qureshi',
          fatherName: 'Irfan Qureshi',
          branch: 'PAKISTAN_ARMY',
          mocksCompleted: 4,
          latestScore: 85,
          verbalScore: 88,
          nonVerbalScore: 84,
          academicScore: 81,
          meritRank: 1,
          readiness: 'RECOMMENDED',
        },
      ]
    );
  }

  getBatchTests(batchId: string): BatchTestSchedule[] {
    return (
      INITIAL_BATCH_TESTS[batchId] || [
        {
          id: 'bts-gen-01',
          batchId,
          testTitle: 'Intelligence Qualifying Battery A',
          testCode: 'TST-GEN-01',
          date: '2026-08-30',
          durationMinutes: 40,
          totalQuestions: 80,
          passingScorePercent: 60,
          candidatesAttempted: 24,
          averageScorePercent: 74.5,
          status: 'COMPLETED',
        },
        {
          id: 'bts-gen-02',
          batchId,
          testTitle: 'Speed & Accuracy Rapid Assessment',
          testCode: 'TST-GEN-02',
          date: '2026-09-08',
          durationMinutes: 30,
          totalQuestions: 60,
          passingScorePercent: 65,
          candidatesAttempted: 0,
          averageScorePercent: 0,
          status: 'SCHEDULED',
        },
      ]
    );
  }

  addBatch(data: Omit<BatchItem, 'id' | 'benchmarkPassRate' | 'meanAggregate' | 'verbalMastery' | 'nonVerbalMastery' | 'academicMastery'>): BatchItem {
    const newBatch: BatchItem = {
      ...data,
      id: `batch-${Date.now()}`,
      benchmarkPassRate: 75.0,
      meanAggregate: 70.0,
      verbalMastery: 75.0,
      nonVerbalMastery: 72.0,
      academicMastery: 65.0,
      isFlagship: false,
    };
    this.batches = [newBatch, ...this.batches];
    this.persist();
    return newBatch;
  }

  updateBatch(id: string, data: Partial<BatchItem>): BatchItem | null {
    const idx = this.batches.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.batches[idx] = { ...this.batches[idx], ...data };
    this.persist();
    return this.batches[idx];
  }
}

export const batchStore = new BatchStore();
