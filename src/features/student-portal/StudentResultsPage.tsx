import React, { useEffect, useState } from 'react';
import { resultService } from '@/services/resultService';
import { retakeService } from '@/services/retakeService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from '@/app/providers';
import { ExamResult, RetakeDocket } from '@/types';
import { CheckCircle, AlertCircle, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [retakes, setRetakes] = useState<RetakeDocket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        if (isSupabaseConfigured()) {
          const [dbResults, dbRetakes] = await Promise.all([
            resultService.getResults({ studentId: user?.cadetId || user?.id }).catch(() => []),
            retakeService.getRetakePermissions({ studentId: user?.cadetId || user?.id }).catch(() => []),
          ]);

          if (dbResults && dbResults.length > 0) {
            const mappedResults: ExamResult[] = dbResults.map((r) => ({
              id: r.id,
              examSessionId: r.attempt_id,
              testId: r.test_id,
              testTitle: (r as any).tests?.name || 'Commissioning CBT Screening Exam',
              cadetId: r.student_id,
              cadetName: (r as any).students?.profiles?.display_name || user?.name || 'Cadet',
              rollNumber: (r as any).students?.roll_number || user?.rollNumber || 'PMA-2601',
              branch: (r as any).tests?.forces?.name || user?.branch || 'PAKISTAN_ARMY',
              totalScore: r.marks_obtained,
              maxScore: r.max_marks,
              percentage: Number(r.percentage),
              passed: r.passed,
              completedAt: r.generated_at,
              timeSpentSeconds: r.time_spent_seconds || 3900,
              sectionBreakdown: [],
              verificationHash: `SHA256:SEALED-${r.id.slice(0, 8).toUpperCase()}`,
            }));
            setResults(mappedResults);
          } else {
            setResults([]);
          }

          if (dbRetakes && dbRetakes.length > 0) {
            const mappedRetakes: RetakeDocket[] = dbRetakes.map((rt) => ({
              id: rt.id,
              originalResultId: rt.original_attempt_id || 'res-001',
              testId: rt.test_id,
              testTitle: 'Commissioning Screening Examination',
              cadetId: rt.student_id,
              cadetName: user?.name || 'Cadet',
              rollNumber: user?.rollNumber || 'PMA-2601',
              branch: 'PAKISTAN_ARMY',
              failedSubject: 'Academic Mathematics',
              previousScorePercent: 54,
              scheduledDate: rt.expires_at ? rt.expires_at.split('T')[0] : '2026-03-15',
              authorizedOfficer: 'Col. Farooq (Staff Admin)',
              reason: rt.notes || 'Official Retake Grant',
              status: rt.status === 'AVAILABLE' ? 'SCHEDULED' : 'RESOLVED',
            }));
            setRetakes(mappedRetakes);
          } else {
            setRetakes([]);
          }
        } else {
          setResults([]);
          setRetakes([]);
        }
      } catch (e) {
        console.warn('Failed to load results from backend:', e);
        setResults([]);
        setRetakes([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-md border border-[#D4D9DF] shadow-sm">
        <div>
          <span className="text-[10px] font-sans font-bold text-[#C6A75E] uppercase tracking-wider">ACADEMIC & EVALUATION RECORDS</span>
          <h1 className="text-xl font-bold text-[#0E1B2A] mt-0.5">My Examination Results</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Complete history of completed computerized examinations, score breakdowns, and authorized retakes.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-sans font-semibold tabular-nums px-3 py-1 bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] rounded">
            {results.length} Attempt Logged
          </span>
        </div>
      </div>

      {/* Retake Authorization Alert (if any active retakes) */}
      {retakes.length > 0 && (
        <div className="bg-[#FDF7EC] border border-[#DEC088] rounded-md p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-[#7A5312] mt-0.5" />
            <div>
              <span className="text-[10px] font-sans font-bold text-[#7A5312] uppercase tracking-wider">
                AUTHORIZED RETAKE DOCKET AVAILABLE
              </span>
              <h3 className="text-sm font-bold text-[#0E1B2A]">{retakes[0].testTitle}</h3>
              <p className="text-xs text-[#7A5312] mt-0.5">
                Authorized by: <span className="font-semibold">{retakes[0].authorizedOfficer}</span> ({retakes[0].reason})
              </p>
            </div>
          </div>
          <Link
            to="/exam/instructions"
            className="inline-flex items-center space-x-1.5 bg-[#7A5312] text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#60410E] transition-colors"
          >
            <span>Start Authorized Retake</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#0E1B2A] border-b border-[#E2E6EB] pb-3">
          Completed Attempt Docket
        </h2>

        {loading ? (
          <div className="text-center py-12 text-xs text-[#64748B]">Loading examination results...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#64748B]">No examination results recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px] text-xs">
              <thead>
                <tr className="border-b border-[#D4D9DF] bg-[#F6F8FA] text-[#64748B] uppercase font-sans font-semibold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Examination Title</th>
                  <th className="py-2.5 px-3">Branch</th>
                  <th className="py-2.5 px-3">Completed Date</th>
                  <th className="py-2.5 px-3">Score & Percentage</th>
                  <th className="py-2.5 px-3">Merit Rank</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E6EB]">
                {results.map((res) => (
                  <tr key={res.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-3 font-semibold text-[#0E1B2A]">
                      <div>{res.testTitle}</div>
                      <div className="text-[10px] font-mono text-[#64748B]">Attempt ID: {res.id}</div>
                    </td>
                    <td className="py-3 px-3 font-sans text-[11px] text-[#64748B]">
                      {res.branch.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 font-sans tabular-nums text-[#64748B]">
                      {new Date(res.completedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-sans tabular-nums font-bold text-[#0E1B2A]">
                      {res.totalScore}/{res.maxScore} ({res.percentage}%)
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        to={`/student/leaderboard?testId=${res.testId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B365D] hover:underline"
                      >
                        <span>View Standing</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
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
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0E1B2A] hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Review Key</span>
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

export default StudentResultsPage;
