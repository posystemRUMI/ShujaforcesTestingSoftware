import { Cadet, Batch, Question, ExamResult, TerminalWorkstation, ExamSession, TestBlueprint, RetakeDocket } from '@/types';
import { mockCadets, mockBatches, mockQuestions, mockResults, mockTerminals, mockTests } from './mock-data';

export const mockRetakes: RetakeDocket[] = [
  {
    id: 'retake-001',
    originalResultId: 'res-003',
    cadetId: 'cadet-004',
    cadetName: 'Usman Ali',
    rollNumber: 'PMA-2604',
    branch: 'PAKISTAN_ARMY',
    testTitle: '154 PMA Long Course Initial Screening Examination',
    failedSubject: 'ACADEMIC_MATH',
    previousScorePercent: 58,
    scheduledDate: '2026-03-10',
    reason: 'Remediation completed in Non-Verbal Logic & Basic Mathematics.',
    status: 'SCHEDULED',
    authorizedOfficer: 'Maj. Tariq Mahmood (Chief Examiner)',
  },
];

class MockDataService {
  private cadets: Cadet[] = [...mockCadets];
  private batches: Batch[] = [...mockBatches];
  private questions: Question[] = [...mockQuestions];
  private results: ExamResult[] = [...mockResults];
  private terminals: TerminalWorkstation[] = [...mockTerminals];
  private tests: TestBlueprint[] = [...mockTests];
  private retakes: RetakeDocket[] = [...mockRetakes];
  private activeSession: ExamSession | null = null;

  // Cadets
  async getCadets(): Promise<Cadet[]> {
    return [...this.cadets];
  }

  async getCadetById(id: string): Promise<Cadet | undefined> {
    return this.cadets.find((c) => c.id === id);
  }

  // Batches
  async getBatches(): Promise<Batch[]> {
    return [...this.batches];
  }

  async getBatchById(id: string): Promise<Batch | undefined> {
    return this.batches.find((b) => b.id === id);
  }

  // Tests
  async getTests(): Promise<TestBlueprint[]> {
    return [...this.tests];
  }

  async getTestById(id: string): Promise<TestBlueprint | undefined> {
    return this.tests.find((t) => t.id === id || t.code === id);
  }

  // Questions
  async getQuestions(): Promise<Question[]> {
    return [...this.questions];
  }

  async addQuestion(question: Question): Promise<Question> {
    this.questions.push(question);
    return question;
  }

  // Results
  async getResults(): Promise<ExamResult[]> {
    return [...this.results];
  }

  async getResultById(id: string): Promise<ExamResult | undefined> {
    return this.results.find((r) => r.id === id);
  }

  async submitResult(result: ExamResult): Promise<ExamResult> {
    this.results.unshift(result);
    return result;
  }

  // Retakes
  async getRetakes(): Promise<RetakeDocket[]> {
    return [...this.retakes];
  }

  // Terminals / Proctor
  async getTerminals(): Promise<TerminalWorkstation[]> {
    return [...this.terminals];
  }

  // Exam Engine
  async createExamSession(cadetId: string, testId: string): Promise<ExamSession> {
    const cadet = this.cadets.find((c) => c.id === cadetId) || this.cadets[0];
    const test = this.tests.find((t) => t.id === testId) || this.tests[0];

    const session: ExamSession = {
      id: `sess-${Date.now()}`,
      testId: test.id,
      testTitle: test.title,
      cadetId: cadet.id,
      cadetName: cadet.fullName,
      rollNumber: cadet.rollNumber,
      branch: cadet.branch,
      terminalId: 'WS-CBT-01',
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + test.durationMinutes * 60 * 1000).toISOString(),
      status: 'IN_PROGRESS',
      answers: {},
      flaggedQuestionIds: [],
      currentQuestionIndex: 0,
      remainingSeconds: test.durationMinutes * 60,
      totalQuestions: this.questions.length,
    };
    this.activeSession = session;
    return session;
  }

  getActiveSession(): ExamSession | null {
    return this.activeSession;
  }

  updateActiveSession(session: ExamSession): void {
    this.activeSession = session;
  }
}

export const mockService = new MockDataService();

