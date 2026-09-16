import { BatchItem, BatchTestSchedule, BatchCadetPerformance } from './types';

const INITIAL_BATCHES: BatchItem[] = [];

const INITIAL_BATCH_STUDENTS: Record<string, BatchCadetPerformance[]> = {};

const INITIAL_BATCH_TESTS: Record<string, BatchTestSchedule[]> = {};

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
    return INITIAL_BATCH_STUDENTS[batchId] || [];
  }

  getBatchTests(batchId: string): BatchTestSchedule[] {
    return INITIAL_BATCH_TESTS[batchId] || [];
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
