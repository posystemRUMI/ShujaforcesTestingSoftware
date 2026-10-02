import { StudentRecord } from './types';

const STORAGE_KEY = 'shuja_registered_students_v3';

function loadStoredStudents(): StudentRecord[] {
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load students from localStorage:', e);
  }
  return [];
}

function saveStoredStudents(students: StudentRecord[]): void {
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    }
  } catch (e) {
    console.warn('Failed to save students to localStorage:', e);
  }
}

class StudentStore {
  private students: StudentRecord[] = loadStoredStudents();

  getAll(): StudentRecord[] {
    return [...this.students];
  }

  getById(id: string): StudentRecord | undefined {
    return this.students.find((s) => s.id === id || s.rollNumber.toLowerCase() === id.toLowerCase());
  }

  create(student: Omit<StudentRecord, 'id' | 'totalAttempts' | 'highestScore' | 'passRate' | 'academicScoreAverage' | 'intelligenceScoreAverage' | 'enrolledAt'> & { id?: string }): StudentRecord {
    const newRecord: StudentRecord = {
      ...student,
      id: student.id || `std-${Date.now()}`,
      enrolledAt: new Date().toISOString().split('T')[0],
      academicScoreAverage: 0,
      intelligenceScoreAverage: 0,
      totalAttempts: 0,
      highestScore: 0,
      passRate: 0,
    };
    this.students = this.students.filter(
      (s) => s.id !== newRecord.id && s.rollNumber.toUpperCase() !== newRecord.rollNumber.toUpperCase()
    );
    this.students.unshift(newRecord);
    saveStoredStudents(this.students);
    return newRecord;
  }

  update(id: string, updates: Partial<StudentRecord>): StudentRecord | undefined {
    const index = this.students.findIndex((s) => s.id === id || s.rollNumber.toLowerCase() === id.toLowerCase());
    if (index === -1) return undefined;
    this.students[index] = { ...this.students[index], ...updates };
    saveStoredStudents(this.students);
    return this.students[index];
  }

  delete(id: string): boolean {
    const initialLen = this.students.length;
    this.students = this.students.filter((s) => s.id !== id && s.rollNumber.toLowerCase() !== id.toLowerCase());
    if (this.students.length < initialLen) {
      saveStoredStudents(this.students);
      return true;
    }
    return false;
  }
}

export const studentStore = new StudentStore();
