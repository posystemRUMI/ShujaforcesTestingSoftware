import { StudentRecord } from './types';

const INITIAL_STUDENTS: StudentRecord[] = [];

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
