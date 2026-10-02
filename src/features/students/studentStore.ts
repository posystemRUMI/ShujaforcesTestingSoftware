import { StudentRecord } from './types';

const STORAGE_KEY = 'shuja_registered_students_v3';
const memoryStore = new Map<string, string>();

function loadStoredStudents(): StudentRecord[] {
  try {
    const raw = typeof localStorage !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY)
      : memoryStore.get(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load students from store:', e);
  }
  return [];
}

function saveStoredStudents(students: StudentRecord[]): void {
  try {
    const serialized = JSON.stringify(students);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, serialized);
    }
    memoryStore.set(STORAGE_KEY, serialized);
  } catch (e) {
    console.warn('Failed to save students to store:', e);
  }
}

class StudentStore {
  getAll(): StudentRecord[] {
    return loadStoredStudents();
  }

  getById(id: string): StudentRecord | undefined {
    return loadStoredStudents().find((s) => s.id === id || s.rollNumber.toLowerCase() === id.toLowerCase());
  }

  create(student: Omit<StudentRecord, 'id' | 'totalAttempts' | 'highestScore' | 'passRate' | 'academicScoreAverage' | 'intelligenceScoreAverage' | 'enrolledAt'> & { id?: string }): StudentRecord {
    const list = loadStoredStudents();
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
    const updated = [
      newRecord,
      ...list.filter((s) => s.id !== newRecord.id && s.rollNumber.toUpperCase() !== newRecord.rollNumber.toUpperCase()),
    ];
    saveStoredStudents(updated);
    return newRecord;
  }

  update(id: string, updates: Partial<StudentRecord>): StudentRecord | undefined {
    const list = loadStoredStudents();
    const index = list.findIndex((s) => s.id === id || s.rollNumber.toLowerCase() === id.toLowerCase());
    if (index === -1) return undefined;
    list[index] = { ...list[index], ...updates };
    saveStoredStudents(list);
    return list[index];
  }

  delete(id: string): boolean {
    const list = loadStoredStudents();
    const initialLen = list.length;
    const filtered = list.filter((s) => s.id !== id && s.rollNumber.toLowerCase() !== id.toLowerCase());
    if (filtered.length < initialLen) {
      saveStoredStudents(filtered);
      return true;
    }
    return false;
  }
}

export const studentStore = new StudentStore();
