import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { BookOpen, CheckCircle, Clock, ArrowRight, AlertCircle, RefreshCw, BarChart2, Shield, Trophy, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { testService, TestRecord } from '@/services/testService';
import { resultService, ResultRecord } from '@/services/resultService';
import { leaderboardService, StudentRankSummary } from '@/services/leaderboardService';
import { financeService } from '@/services/financeService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { TestBlueprint, ExamResult } from '@/types';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<TestBlueprint[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [rankSummary, setRankSummary] = useState<StudentRankSummary | null>(null);
  const [feeInfo, setFeeInfo] = useState<{
    totalDue: number;
    totalPaid: number;
    balance: number;
    status: 'PAID' | 'UNPAID' | 'PARTIAL';
    paymentsCount: number;
  }>({
    totalDue: 0,
    totalPaid: 0,
    balance: 0,
    status: 'PAID',
    paymentsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        if (isSupabaseConfigured()) {
          const studentId = user?.cadetId || user?.id;
          const [dbTests, dbResults, rSummary, feeAccs, feePays] = await Promise.all([
            testService.getTests().catch((_e: unknown) => [] as TestRecord[]),
            resultService.getResults({ studentId: studentId }).catch((_e: unknown) => [] as ResultRecord[]),
            leaderboardService.getStudentRankSummary().catch((_e: unknown) => null),
            studentId ? financeService.getStudentFeeAccounts(studentId).catch(() => []) : Promise.resolve([]),
            studentId ? financeService.getStudentFeePayments(studentId).catch(() => []) : Promise.resolve([]),
          ]);
          setRankSummary(rSummary);

          // Calculate Cadet Fee Summary
          let due = 0;
          let paid = 0;
          feeAccs.forEach((a) => {
            due += (a.amount_due || 0) - (a.discount_amount || 0) + (a.fine_amount || 0);
            paid += (a.amount_paid || 0);
          });
          const bal = Math.max(0, due - paid);
          let st: 'PAID' | 'UNPAID' | 'PARTIAL' = 'PAID';
          if (feeAccs.length > 0) {
            if (bal <= 0) st = 'PAID';
            else if (paid > 0) st = 'PARTIAL';
            else st = 'UNPAID';
          }
          setFeeInfo({
            totalDue: due,
            totalPaid: paid,
            balance: bal,
            status: st,
            paymentsCount: feePays.length,
          });

          if (dbTests && dbTests.length > 0) {
            const mappedTests: TestBlueprint[] = dbTests
              .filter((t) => t.status === 'PUBLISHED' || t.status === 'ACTIVE')
              .map((t: TestRecord) => ({
                id: t.id,
                code: t.name.slice(0, 12),
                title: t.name,
                branch: 'PAKISTAN_ARMY',
                courseTarget: 'PMA Long Course',
                totalQuestions: t.total_marks || 45,
                durationMinutes: t.duration_minutes || 65,
                passingScorePercent: t.passing_threshold || 60,
                negativeMarking: t.negative_marking ?? false,
                shuffleQuestions: t.shuffle_questions ?? true,
                shuffleOptions: t.shuffle_options ?? true,
                status: 'ACTIVE',
                sections: [],
              }));
            setTests(mappedTests);
          } else {
            setTests([]);
          }

          if (dbResults && dbResults.length > 0) {
            const mappedResults: ExamResult[] = dbResults.map((r: ResultRecord) => ({
              id: r.id,
              examSessionId: r.attempt_id,
              testId: r.test_id,
              testTitle: (r as any).tests?.name || 'Commissioning Screening Examination',
              cadetId: user?.id || r.student_id,
              cadetName: (r as any).students?.profiles?.display_name || user?.name || 'Cadet',
              rollNumber: (r as any).students?.roll_number || user?.rollNumber || 'PMA-2601',
              branch: (r as any).tests?.forces?.name || user?.branch || 'PAKISTAN_ARMY',
              totalScore: r.marks_obtained,
              maxScore: r.max_marks,
              percentage: Number(r.percentage),
              passed: r.passed,
              completedAt: r.generated_at,
              timeSpentSeconds: r.time_spent_seconds || 1800,
              sectionBreakdown: [],
              verificationHash: `SHA256:SEALED-${r.id.slice(0, 8).toUpperCase()}`,
            }));
            setResults(mappedResults);
          } else {
            setResults([]);
          }
        }
      } catch (err) {
        console.warn('Failed to load student dashboard data from database:', err);
        setTests([]);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-7 h-7 text-[#0E1B2A] animate-spin" />
        <span className="text-xs font-sans text-[#64748B] uppercase tracking-wider">Loading Cadet Dashboard...</span>
      </div>
    );
  }

  const activeTest = tests[0];
  const activeTestResult = activeTest ? results.find((r) => r.testId === activeTest.id) : undefined;
  const passedCount = results.filter((r) => r.passed).length;
  const avgScore = results.length
    ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Cadet Docket Header Card */}
      <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-md bg-[#0E1B2A] text-[#C6A75E] flex items-center justify-center font-bold text-xl border-2 border-[#C6A75E] shadow-sm">
            <Shield className="w-9 h-9" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-2">
              <span className="text-[11px] font-sans font-bold text-[#234E35] bg-[#EDF6F0] px-2 py-0.5 rounded border border-[#88BE9B] uppercase tracking-wider">
                ACTIVE CADET DOCKET
              </span>
              <span className="text-[11px] font-sans font-semibold text-[#64748B] uppercase">{user?.branch || 'PAKISTAN ARMY'}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0E1B2A] mt-1">{user?.name || 'Cadet'}</h1>
            <p className="text-xs text-[#64748B] font-sans mt-0.5">
              ROLL NO: <span className="font-mono font-bold text-[#0E1B2A]">{user?.rollNumber || 'PMA-2601'}</span> | SQUADRON: 154 PMA LONG COURSE ALPHA
            </p>
          </div>
        </div>

        {activeTest && (
          activeTestResult ? (
            <Link
              to={`/student/result/${activeTestResult.id}`}
              className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-[#234E35] text-white px-5 py-3 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#1E432E] transition-colors shadow-sm"
            >
              <span>Review Examination Result</span>
              <ArrowRight className="w-4 h-4 text-[#C6A75E]" />
            </Link>
          ) : (
            <Link
              to={`/student/test/${activeTest.id}/familiarization`}
              className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-[#0E1B2A] text-white px-5 py-3 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#1C2E42] transition-colors shadow-sm"
            >
              <span>Launch Computerized Test</span>
              <ArrowRight className="w-4 h-4 text-[#C6A75E]" />
            </Link>
          )
        )}
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Assigned Tests</span>
            <BookOpen className="w-4 h-4 text-[#0E1B2A]" />
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-[#0E1B2A] mt-2">{tests.length}</div>
          <div className="text-[11px] text-[#64748B] mt-1">Screening & Evaluation Blueprints</div>
        </div>

        <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Tests</span>
            <CheckCircle className="w-4 h-4 text-[#234E35]" />
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-[#234E35] mt-2">{results.length}</div>
          <div className="text-[11px] text-[#234E35] font-semibold mt-1">{passedCount} Qualified / Passed</div>
        </div>

        <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
            <BarChart2 className="w-4 h-4 text-[#C6A75E]" />
          </div>
          <div className="text-2xl font-bold font-sans tabular-nums text-[#0E1B2A] mt-2">{avgScore}%</div>
          <div className="text-[11px] text-[#64748B] mt-1">Across all completed attempts</div>
        </div>

        <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Academy Standing</span>
            <Trophy className="w-4 h-4 text-[#C6A75E]" />
          </div>
          <div className="text-2xl font-bold font-sans text-[#0E1B2A] mt-2">
            {rankSummary?.academy_rank ? `#${rankSummary.academy_rank}` : '—'}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            of {rankSummary?.academy_total || 0} candidates
          </div>
        </div>
      </div>

      {/* Compact Your Standing Banner */}
      <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-md bg-[#0E1B2A] text-[#C6A75E] flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0E1B2A]">Your Standing</h3>
            <p className="text-xs text-[#64748B]">Official verified ranks across academy cohorts.</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-[11px] text-[#64748B] block">Batch</span>
            <span className="text-sm font-bold text-[#0E1B2A]">{rankSummary?.batch_rank ? `#${rankSummary.batch_rank}` : '—'}</span>
          </div>
          <div className="h-6 w-[1px] bg-[#E2E6EB]" />
          <div>
            <span className="text-[11px] text-[#64748B] block">Course</span>
            <span className="text-sm font-bold text-[#0E1B2A]">{rankSummary?.course_rank ? `#${rankSummary.course_rank}` : '—'}</span>
          </div>
          <div className="h-6 w-[1px] bg-[#E2E6EB]" />
          <div>
            <span className="text-[11px] text-[#64748B] block">Academy</span>
            <span className="text-sm font-bold text-[#0E1B2A]">{rankSummary?.academy_rank ? `#${rankSummary.academy_rank}` : '—'}</span>
          </div>
        </div>

        <Link
          to="/student/leaderboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#0E1B2A] text-white hover:bg-[#1C2E42] text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto shrink-0"
        >
          <span>View Leaderboard</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#C6A75E]" />
        </Link>
      </div>

      {/* Cadet Financial Standing & Fee Ledger Widget */}
      <div className="bg-white border border-[#D4D9DF] rounded-md p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E6EB] pb-3 gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-md bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0E1B2A]">Cadet Financial Standing & Fee Ledger</h3>
              <p className="text-xs text-[#64748B]">Official tuition fee balance & verified payment receipts</p>
            </div>
          </div>

          <div>
            {feeInfo.status === 'PAID' ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B]">
                <span className="w-2 h-2 rounded-full bg-[#234E35] animate-pulse"></span>
                <span>FEES CLEAR • FULLY PAID</span>
              </span>
            ) : feeInfo.status === 'PARTIAL' ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>PARTIAL PAYMENT RECORDED</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#FDF2F2] text-[#782525] border border-[#E29A9A]">
                <span className="w-2 h-2 rounded-full bg-[#782525]"></span>
                <span>OUTSTANDING DUES PENDING</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#F8FAFC] border border-[#E2E6EB] rounded-md p-3.5">
            <span className="text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider block">Total Course Fee</span>
            <div className="text-xl font-bold font-mono text-[#0E1B2A] mt-1">
              Rs. {feeInfo.totalDue.toLocaleString('en-PK')}
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">Assigned Course Tuition</div>
          </div>

          <div className="bg-[#EDF6F0] border border-[#88BE9B] rounded-md p-3.5">
            <span className="text-[10px] font-sans font-bold text-[#234E35] uppercase tracking-wider block">Fee Amount Paid</span>
            <div className="text-xl font-bold font-mono text-[#234E35] mt-1">
              Rs. {feeInfo.totalPaid.toLocaleString('en-PK')}
            </div>
            <div className="text-[11px] text-[#234E35] font-semibold mt-0.5">{feeInfo.paymentsCount} Verified Receipts</div>
          </div>

          <div className={`p-3.5 rounded-md border ${
            feeInfo.balance > 0 ? 'bg-[#FDF2F2] border-[#E29A9A]' : 'bg-[#F8FAFC] border-[#E2E6EB]'
          }`}>
            <span className="text-[10px] font-sans font-bold text-[#64748B] uppercase tracking-wider block">Remaining Balance Due</span>
            <div className={`text-xl font-bold font-mono mt-1 ${
              feeInfo.balance > 0 ? 'text-[#782525]' : 'text-[#64748B]'
            }`}>
              Rs. {feeInfo.balance.toLocaleString('en-PK')}
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              {feeInfo.balance > 0 ? 'Please clear remaining balance' : 'Zero outstanding balance'}
            </div>
          </div>
        </div>
      </div>

      {/* Active Screening Test Banner */}
      {activeTest && (
        <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-3">
            <div>
              <span className={`text-[10px] font-sans font-bold uppercase tracking-wider ${activeTestResult ? 'text-[#234E35]' : 'text-[#C6A75E]'}`}>
                {activeTestResult ? 'OFFICIAL EXAMINATION ATTEMPT RECORDED' : 'IMMEDIATE ACTION REQUIRED'}
              </span>
              <h2 className="text-lg font-bold text-[#0E1B2A]">{activeTest.title}</h2>
            </div>
            {activeTestResult ? (
              activeTestResult.passed ? (
                <span className="inline-flex items-center gap-1 text-xs font-sans font-bold px-2.5 py-1 rounded bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] uppercase tracking-wider">
                  <CheckCircle className="w-3.5 h-3.5" /> QUALIFIED • {activeTestResult.percentage}%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-sans font-bold px-2.5 py-1 rounded bg-[#FDF2F2] text-[#782525] border border-[#E29A9A] uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" /> UNQUALIFIED • {activeTestResult.percentage}%
                </span>
              )
            ) : (
              <span className="text-xs font-sans font-semibold px-2.5 py-1 rounded bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] uppercase tracking-wider">
                READY FOR EXAMINATION
              </span>
            )}
          </div>

          <p className="text-xs text-[#64748B] leading-relaxed">
            Official Computerized Entrance & Screening Examination containing Verbal Intelligence, Non-Verbal Logic, and Academic evaluation sections.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F6F8FA] p-3 rounded border border-[#E2E6EB] text-xs font-sans">
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase">Duration</span>
              <span className="font-semibold text-[#0E1B2A] flex items-center gap-1 mt-0.5 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                {activeTest.durationMinutes} Minutes
              </span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase">Total Questions</span>
              <span className="font-semibold text-[#0E1B2A] mt-0.5 block tabular-nums">{activeTest.totalQuestions} Items</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase">Passing Threshold</span>
              <span className="font-semibold text-[#234E35] mt-0.5 block tabular-nums">{activeTest.passingScorePercent}% Minimum</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase">Target Cadre</span>
              <span className="font-semibold text-[#0E1B2A] mt-0.5 block">{activeTest.courseTarget}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2 space-x-3">
            {activeTestResult ? (
              <Link
                to={`/student/result/${activeTestResult.id}`}
                className="inline-flex items-center space-x-2 bg-[#234E35] text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1E432E] transition-colors"
              >
                <span>Review Answer Key & Result</span>
                <ArrowRight className="w-4 h-4 text-[#C6A75E]" />
              </Link>
            ) : (
              <Link
                to={`/student/test/${activeTest.id}/familiarization`}
                className="inline-flex items-center space-x-2 bg-[#0E1B2A] text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1C2E42] transition-colors"
              >
                <span>Start Orientation & Examination</span>
                <ArrowRight className="w-4 h-4 text-[#C6A75E]" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Recent Exam Attempts Section */}
      <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-3">
          <h2 className="text-base font-bold text-[#0E1B2A]">Recent Examination History</h2>
          <Link to="/student/results" className="text-xs font-bold text-[#0E1B2A] hover:underline">
            View All Results &rarr;
          </Link>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#64748B]">No prior examination results recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] text-xs">
              <thead>
                <tr className="border-b border-[#D4D9DF] bg-[#F6F8FA] text-[#64748B] uppercase font-sans font-semibold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Test Title</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Score %</th>
                  <th className="py-2.5 px-3">Marks</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E6EB]">
                {results.slice(0, 3).map((res) => (
                  <tr key={res.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-3 font-semibold text-[#0E1B2A]">{res.testTitle}</td>
                    <td className="py-3 px-3 font-sans tabular-nums text-[#64748B]">
                      {new Date(res.completedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-sans tabular-nums font-bold text-[#0E1B2A]">{res.percentage}%</td>
                    <td className="py-3 px-3 font-sans tabular-nums text-[#64748B]">{res.totalScore} / {res.maxScore}</td>
                    <td className="py-3 px-3">
                      {res.passed ? (
                        <span className="inline-flex items-center gap-1 font-sans text-[10px] font-bold text-[#234E35] bg-[#EDF6F0] px-2 py-0.5 rounded border border-[#88BE9B]">
                          <CheckCircle className="w-3 h-3" /> QUALIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-sans text-[10px] font-bold text-[#782525] bg-[#FDF2F2] px-2 py-0.5 rounded border border-[#E29A9A]">
                          <AlertCircle className="w-3 h-3" /> UNQUALIFIED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/student/result/${res.id}`}
                        className="text-xs font-bold text-[#0E1B2A] hover:underline"
                      >
                        Review Answer Key &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboardPage;
