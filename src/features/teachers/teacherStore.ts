import { Teacher, TeacherFormData } from './types';

const INITIAL_TEACHERS: Teacher[] = [];

class TeacherStore {
  private teachers: Teacher[] = [...INITIAL_TEACHERS];
  private listeners: (() => void)[] = [];

  constructor() {
    // Try localStorage if available
    try {
      const stored = localStorage.getItem('forces_academy_teachers');
      if (stored) {
        this.teachers = JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
  }

  private persist() {
    try {
      localStorage.setItem('forces_academy_teachers', JSON.stringify(this.teachers));
    } catch {
      // Ignore
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getTeachers(): Teacher[] {
    return [...this.teachers];
  }

  getTeacherById(id: string): Teacher | undefined {
    return this.teachers.find((t) => t.id === id);
  }

  addTeacher(data: TeacherFormData): Teacher {
    const newTeacher: Teacher = {
      ...data,
      id: `tch-${Date.now()}`,
      questionsCreatedCount: 0,
      activeTestsManaged: 0,
      lastActiveAt: new Date().toISOString(),
      joinedAt: new Date().toISOString().split('T')[0],
    };
    this.teachers = [newTeacher, ...this.teachers];
    this.persist();
    return newTeacher;
  }

  updateTeacher(id: string, data: Partial<TeacherFormData>): Teacher | null {
    const idx = this.teachers.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const updated = {
      ...this.teachers[idx],
      ...data,
      lastActiveAt: new Date().toISOString(),
    };
    this.teachers[idx] = updated;
    this.persist();
    return updated;
  }

  toggleStatus(id: string): Teacher | null {
    const teacher = this.teachers.find((t) => t.id === id);
    if (!teacher) return null;

    const nextStatus = teacher.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.updateTeacher(id, { status: nextStatus });
  }

  deleteTeacher(id: string): boolean {
    const initialLen = this.teachers.length;
    this.teachers = this.teachers.filter((t) => t.id !== id);
    if (this.teachers.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }
}

export const teacherStore = new TeacherStore();
