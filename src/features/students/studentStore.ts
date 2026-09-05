import { StudentRecord } from './types';

const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 'std-001',
    cnic: '37405-1234567-1',
    rollNumber: 'PMA-2601',
    fullName: 'Hamza Tariq',
    fatherName: 'Tariq Mehmood',
    phone: '0300-5551234',
    branch: 'PAKISTAN_ARMY',
    batchId: 'batch-001',
    batchCode: '154-PMA-LC',
    targetCourse: '154 PMA Long Course',
    status: 'ACTIVE',
    enrolledAt: '2026-01-16',
    academicScoreAverage: 88.5,
    intelligenceScoreAverage: 92.0,
    totalAttempts: 6,
    highestScore: 94,
    passRate: 100,
  },
  {
    id: 'std-002',
    cnic: '35201-9876543-3',
    rollNumber: 'PAF-4402',
    fullName: 'Shahmeer Khan',
    fatherName: 'Jahangir Khan',
    phone: '0321-4445678',
    branch: 'PAKISTAN_AIR_FORCE',
    batchId: 'batch-002',
    batchCode: '158-GDP-PAF',
    targetCourse: '158 GDP / CAE',
    status: 'ACTIVE',
    enrolledAt: '2026-02-02',
    academicScoreAverage: 94.0,
    intelligenceScoreAverage: 96.5,
    totalAttempts: 5,
    highestScore: 98,
    passRate: 100,
  },
  {
    id: 'std-003',
    cnic: '42101-5678901-5',
    rollNumber: 'PNC-1108',
    fullName: 'Bilal Ahmed',
    fatherName: 'Ahmed Raza',
    phone: '0333-8889900',
    branch: 'PAKISTAN_NAVY',
    batchId: 'batch-003',
    batchCode: 'PNC-2026-A',
    targetCourse: 'PN Cadet 2026-A',
    status: 'ACTIVE',
    enrolledAt: '2026-02-11',
    academicScoreAverage: 82.0,
    intelligenceScoreAverage: 86.0,
    totalAttempts: 4,
    highestScore: 89,
    passRate: 100,
  },
  {
    id: 'std-004',
    cnic: '38403-3456789-7',
    rollNumber: 'PMA-2604',
    fullName: 'Usman Ali',
    fatherName: 'Muhammad Ali',
    phone: '0345-1112233',
    branch: 'PAKISTAN_ARMY',
    batchId: 'batch-001',
    batchCode: '154-PMA-LC',
    targetCourse: '154 PMA Long Course',
    status: 'RETAKE_REQUIRED',
    enrolledAt: '2026-01-16',
    academicScoreAverage: 58.0,
    intelligenceScoreAverage: 64.0,
    totalAttempts: 3,
    highestScore: 68,
    passRate: 33,
  },
  {
    id: 'std-005',
    cnic: '33100-8765432-9',
    rollNumber: 'PAF-4405',
    fullName: 'Zainab Fatima',
    fatherName: 'Asim Siddiqui',
    phone: '0312-3334455',
    branch: 'PAKISTAN_AIR_FORCE',
    batchId: 'batch-002',
    batchCode: '158-GDP-PAF',
    targetCourse: '158 GDP / CAE',
    status: 'ACTIVE',
    enrolledAt: '2026-02-02',
    academicScoreAverage: 91.0,
    intelligenceScoreAverage: 93.5,
    totalAttempts: 5,
    highestScore: 95,
    passRate: 100,
  },
  {
    id: 'std-006',
    cnic: '36302-1122334-1',
    rollNumber: 'PNC-1112',
    fullName: 'Danish Farooq',
    fatherName: 'Farooq Azam',
    phone: '0302-9998877',
    branch: 'PAKISTAN_NAVY',
    batchId: 'batch-003',
    batchCode: 'PNC-2026-A',
    targetCourse: 'PN Cadet 2026-A',
    status: 'GRADUATED',
    enrolledAt: '2025-07-01',
    academicScoreAverage: 89.0,
    intelligenceScoreAverage: 88.0,
    totalAttempts: 8,
    highestScore: 92,
    passRate: 100,
  },
];

class StudentStore {
  private students: StudentRecord[] = [...INITIAL_STUDENTS];

  getAll(): StudentRecord[] {
    return [...this.students];
  }

  getById(id: string): StudentRecord | undefined {
    return this.students.find((s) => s.id === id);
  }

  create(student: Omit<StudentRecord, 'id' | 'totalAttempts' | 'highestScore' | 'passRate' | 'academicScoreAverage' | 'intelligenceScoreAverage' | 'enrolledAt'>): StudentRecord {
    const newRecord: StudentRecord = {
      ...student,
      id: `std-${Date.now()}`,
      enrolledAt: new Date().toISOString().split('T')[0],
      academicScoreAverage: 0,
      intelligenceScoreAverage: 0,
      totalAttempts: 0,
      highestScore: 0,
      passRate: 0,
    };
    this.students.unshift(newRecord);
    return newRecord;
  }

  update(id: string, updates: Partial<StudentRecord>): StudentRecord | undefined {
    const index = this.students.findIndex((s) => s.id === id);
    if (index === -1) return undefined;
    this.students[index] = { ...this.students[index], ...updates };
    return this.students[index];
  }

  delete(id: string): boolean {
    const initialLen = this.students.length;
    this.students = this.students.filter((s) => s.id !== id);
    return this.students.length < initialLen;
  }
}

export const studentStore = new StudentStore();
