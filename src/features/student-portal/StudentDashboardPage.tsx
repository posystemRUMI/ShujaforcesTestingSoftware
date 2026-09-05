import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { BookOpen, Award, CheckCircle, Clock, ArrowRight, AlertCircle, RefreshCw, BarChart2, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockService } from '@/lib/mock-service';
import { TestBlueprint, ExamResult } from '@/types';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<TestBlueprint[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [testList, resultList] = await Promise.all([
          mockService.getTests(),
          mockService.getResults(),
        ]);
        setTests(testList);
        setResults(resultList);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-7 h-7 text-[#0E1B2A] animate-spin" />
        <span className="text-xs font-mono text-[#64748B] uppercase tracking-wider">Loading Cadet Dashboard...</span>
      </div>
    );
  }

  const activeTest = tests[0];
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
              <span className="text-[11px] font-mono font-bold text-[#234E35] bg-[#EDF6F0] px-2 py-0.5 rounded border border-[#88BE9B] uppercase tracking-wider">
                ACTIVE CADET DOCKET
              </span>
              <span className="text-[11px] font-mono text-[#64748B] uppercase">{user?.branch || 'PAKISTAN ARMY'}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0E1B2A] mt-1">{user?.name || 'Cadet Hamza Tariq'}</h1>
            <p className="text-xs text-[#64748B] font-mono mt-0.5">
              ROLL NO: <span className="font-semibold text-[#0E1B2A]">{user?.rollNumber || 'PMA-2601'}</span> | SQUADRON: 154 PMA LONG COURSE ALPHA
            </p>
          </div>
        </div>

        {activeTest && (
          <Link
            to={`/student/test/${activeTest.id}/instructions`}
            className="w-full md:w-auto inline-flex items-center justify-center space-x-2 bg-[#0E1B2A] text-white px-5 py-3 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#1C2E42] transition-colors shadow-sm"
          >
            <span>Launch Computerized Test</span>
            <ArrowRight className="w-4 h-4 text-[#C6A75E]" />
          </Link>
        )}
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Assigned Tests</span>
            <BookOpen className="w-4 h-4 text-[#0E1B2A]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0E1B2A] mt-2">{tests.length}</div>
          <div className="text-[11px] text-[#64748B] mt-1">Screening & Evaluation Blueprints</div>
        </div>

        <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Tests</span>
            <CheckCircle className="w-4 h-4 text-[#234E35]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#234E35] mt-2">{results.length}</div>
          <div className="text-[11px] text-[#234E35] font-semibold mt-1">{passedCount} Qualified / Passed</div>
        </div>

        <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
            <BarChart2 className="w-4 h-4 text-[#C6A75E]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0E1B2A] mt-2">{avgScore}%</div>
          <div className="text-[11px] text-[#64748B] mt-1">Across all completed attempts</div>
        </div>

        <div className="bg-white border border-[#D4D9DF] rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Academic Standings</span>
            <Award className="w-4 h-4 text-[#C6A75E]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0E1B2A] mt-2">Stanine 8</div>
          <div className="text-[11px] text-[#64748B] mt-1">Top 10% in Academy Cohort</div>
        </div>
      </div>

      {/* Active Screening Test Banner */}
      {activeTest && (
        <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#C6A75E] uppercase tracking-wider">
                IMMEDIATE ACTION REQUIRED
              </span>
              <h2 className="text-lg font-bold text-[#0E1B2A]">{activeTest.title}</h2>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] uppercase">
              READY FOR EXAMINATION
            </span>
          </div>

          <p className="text-xs text-[#64748B] leading-relaxed">
            Official Computerized Entrance & Screening Examination containing Verbal Intelligence, Non-Verbal Logic, and Academic evaluation sections.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F6F8FA] p-3 rounded border border-[#E2E6EB] text-xs font-mono">
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase">Duration</span>
              <span className="font-semibold text-[#0E1B2A] flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                {activeTest.durationMinutes} Minutes
              </span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase">Total Questions</span>
              <span className="font-semibold text-[#0E1B2A] mt-0.5 block">{activeTest.totalQuestions} Items</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase">Passing Threshold</span>
              <span className="font-semibold text-[#234E35] mt-0.5 block">{activeTest.passingScorePercent}% Minimum</span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase">Target Cadre</span>
              <span className="font-semibold text-[#0E1B2A] mt-0.5 block">{activeTest.courseTarget}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Link
              to={`/student/test/${activeTest.id}/instructions`}
              className="inline-flex items-center space-x-2 bg-[#0E1B2A] text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1C2E42] transition-colors"
            >
              <span>Proceed to Test Instructions</span>
              <ArrowRight className="w-4 h-4 text-[#C6A75E]" />
            </Link>
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
                <tr className="border-b border-[#D4D9DF] bg-[#F6F8FA] text-[#64748B] uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Test Title</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Stanine</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E6EB]">
                {results.slice(0, 3).map((res) => (
                  <tr key={res.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-3 font-semibold text-[#0E1B2A]">{res.testTitle}</td>
                    <td className="py-3 px-3 font-mono text-[#64748B]">
                      {new Date(res.completedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#0E1B2A]">{res.percentage}%</td>
                    <td className="py-3 px-3 font-mono">{res.stanine}</td>
                    <td className="py-3 px-3">
                      {res.passed ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#234E35] bg-[#EDF6F0] px-2 py-0.5 rounded border border-[#88BE9B]">
                          <CheckCircle className="w-3 h-3" /> QUALIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#782525] bg-[#FDF2F2] px-2 py-0.5 rounded border border-[#E29A9A]">
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
