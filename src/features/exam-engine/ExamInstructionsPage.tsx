import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Play, Lock, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { attemptService } from '@/services/attemptService';
import { testService, TestRecord } from '@/services/testService';
import { familiarizationService } from '@/services/familiarizationService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ExamInstructionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const testIdParam = id || searchParams.get('testId');

  const { user } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<TestRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTest() {
      if (!isSupabaseConfigured()) return;
      try {
        let t: TestRecord | null = null;
        if (testIdParam && UUID_REGEX.test(testIdParam)) {
          t = await testService.getTestById(testIdParam);
        }
        if (!t) {
          const tests = await testService.getTests();
          if (tests && tests.length > 0) {
            t = tests[0];
          }
        }
        if (isMounted && t) {
          setTestData(t);
        }
      } catch (e) {
        console.warn('Failed to load test details:', e);
      }
    }
    loadTest();
    return () => { isMounted = false; };
  }, [testIdParam]);

  // Mandatory Pre-Test Familiarization Guard
  useEffect(() => {
    if (!testData && !testIdParam) return;
    // Bypass for preview or explicit instructor override
    if (user && user.role !== 'STUDENT') return;
    if (searchParams.get('skipFamiliarization') === 'true') return;

    const targetId = testData?.id || testIdParam;
    if (targetId) {
      const completed = familiarizationService.isFamiliarizationCompleted(targetId);
      if (!completed) {
        navigate(`/exam/familiarization?testId=${targetId}`, { replace: true });
      }
    }
  }, [testData, testIdParam, user, searchParams, navigate]);

  const handleStartExam = async () => {
    if (!agreed || loading) return;
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        // Staff/Admin preview mode (non-student users previewing exam)
        if (user && user.role !== 'STUDENT') {
          navigate('/exam/runner?preview=true');
          return;
        }

        // Resolve authoritative test UUID
        let targetTestId: string | null = null;
        if (testIdParam && UUID_REGEX.test(testIdParam)) {
          targetTestId = testIdParam;
        } else if (testData?.id && UUID_REGEX.test(testData.id)) {
          targetTestId = testData.id;
        } else {
          const tests = await testService.getTests();
          if (tests && tests.length > 0 && UUID_REGEX.test(tests[0].id)) {
            targetTestId = tests[0].id;
          }
        }

        if (!targetTestId) {
          throw new Error('No published computerized examination is currently assigned to your batch. Please contact your examination controller or proctor.');
        }

        const res = await attemptService.startAttempt(targetTestId);
        navigate(`/exam/runner?attemptId=${res.attempt_id}`);
      } else {
        navigate('/exam/runner');
      }
    } catch (err: any) {
      console.error('Failed to start test attempt:', err);
      toast.error(err.message || 'Failed to start examination. Please contact your proctor.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full py-6 select-none">
      <div className="bg-white border border-[#0E1B2A] rounded p-8 shadow-[0_4px_0_0_rgba(14,27,42,0.08)] space-y-6">
        {/* Header */}
        <div className="border-b border-[#D4D9DF] pb-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-sans uppercase tracking-widest text-[#C6A75E] font-bold">
              Shuja Forces Academy Pindsultani
            </span>
            <h1 className="text-xl font-bold uppercase tracking-wider text-[#0E1B2A] mt-0.5">
              {testData?.name || 'Preliminary Computerized Screening Examination'}
            </h1>
            <p className="text-xs text-[#64748B]">Instructions & Mandatory Code of Conduct</p>
          </div>
          <div className="w-10 h-10 rounded bg-[#0E1B2A] flex items-center justify-center text-[#C6A75E]">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        {/* Cadet Dossier Summary */}
        <div className="p-3.5 bg-[#EDF1F5] rounded border border-[#D4D9DF] flex items-center justify-between text-xs font-sans">
          <div>
            <span className="text-[#64748B]">CADET: </span>
            <span className="font-bold text-[#0E1B2A]">{user?.name || 'Cadet Hamza Tariq'}</span>
          </div>
          <div>
            <span className="text-[#64748B]">DOCKET: </span>
            <span className="font-bold text-[#0E1B2A] font-mono">{user?.rollNumber || 'PMA-2601'}</span>
          </div>
          <div>
            <span className="text-[#64748B]">TERMINAL: </span>
            <span className="font-bold text-[#234E35] font-mono">WS-CBT-01 (LOCKED)</span>
          </div>
        </div>

        {/* Familiarization Verification Badge */}
        <div className="p-3 bg-[#EDF6F0] rounded border border-[#88BE9B] flex items-center justify-between text-xs text-[#234E35] font-sans">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#234E35] shrink-0" />
            <span className="font-semibold">
              Mandatory Orientation Completed (5 Practice MCQs / 1-Minute Calibration Verified)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const tid = testData?.id || testIdParam;
              navigate(tid ? `/exam/familiarization?testId=${tid}` : '/exam/familiarization');
            }}
            className="inline-flex items-center space-x-1 font-bold text-[#234E35] hover:underline shrink-0 ml-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-run Practice (1 Min)</span>
          </button>
        </div>

        {/* Strict Exam Rules */}
        <div className="space-y-3 text-xs text-[#1F2937] leading-relaxed font-sans">
          <div className="flex items-start space-x-2">
            <span className="font-bold text-[#0E1B2A] font-sans tabular-nums">01.</span>
            <p>
              <strong>Timed Execution:</strong> You have <strong>{testData?.duration_minutes || 65} minutes</strong> to complete all questions.
              The countdown timer at the top cannot be paused once initiated.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-bold text-[#0E1B2A] font-sans tabular-nums">02.</span>
            <p>
              <strong>Autosave & Synchronization:</strong> Every selected answer is instantly recorded and cryptographically sealed on the central test engine.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-bold text-[#0E1B2A] font-sans tabular-nums">03.</span>
            <p>
              <strong>Zero-Tolerance Anomaly Detection:</strong> Window defocus, multiple screen events, or unauthorized key presses will trigger immediate proctor station alerts and terminal lockout.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-bold text-[#0E1B2A] font-sans tabular-nums">04.</span>
            <p>
              <strong>Navigation:</strong> Use the Question Matrix on the right to navigate or review flagged items. Unanswered questions will receive 0 marks.
            </p>
          </div>
        </div>

        {/* Declaration Checkbox */}
        <div className="pt-4 border-t border-[#D4D9DF]">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 text-[#0E1B2A] rounded border-[#D4D9DF] focus:ring-[#C6A75E]"
            />
            <span className="text-xs text-[#1F2937] font-semibold">
              I have read and fully understand the testing regulations and hereby solemnly affirm to maintain integrity.
            </span>
          </label>
        </div>

        {/* Start Button */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="px-4 py-2 border border-[#D4D9DF] text-xs font-semibold rounded text-[#64748B] hover:bg-[#EDF1F5]"
          >
            Cancel & Return
          </button>
          <button
            type="button"
            disabled={!agreed || loading}
            onClick={handleStartExam}
            className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
              agreed && !loading
                ? 'bg-[#0E1B2A] hover:bg-[#1A2C42] text-white shadow'
                : 'bg-[#EDF1F5] text-[#94A3B8] cursor-not-allowed'
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{loading ? 'Initializing Session...' : 'Begin Examination'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamInstructionsPage;
