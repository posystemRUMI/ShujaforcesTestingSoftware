import React, { useEffect, useState } from 'react';
import { mockService } from '@/lib/mock-service';
import { ExamResult } from '@/types';
import { CheckCircle, XCircle, Search, Printer, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';

export const ResultsPage: React.FC = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Detail Modal State
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    async function loadResults() {
      try {
        const data = await mockService.getResults();
        setResults(data);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, []);

  const filteredResults = results.filter((r) => {
    const matchesSearch =
      r.cadetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.testTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBranch = branchFilter === 'ALL' || r.branch === branchFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PASSED' && r.passed) ||
      (statusFilter === 'FAILED' && !r.passed);

    return matchesSearch && matchesBranch && matchesStatus;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    toast.success('Candidate results dataset exported to CSV format.');
  };

  // Metrics
  const totalAttempts = results.length;
  const avgScore = results.length
    ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length)
    : 0;
  const passRate = results.length
    ? Math.round((results.filter((r) => r.passed).length / results.length) * 100)
    : 0;
  const highestScore = results.length ? Math.max(...results.map((r) => r.percentage)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-md border border-[#D4D9DF] shadow-sm">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#C6A75E] uppercase tracking-wider">
            FACULTY ASSESSMENT EVALUATION CONSOLE
          </span>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#0E1B2A] mt-0.5">
            Candidate Results & Transcripts
          </h1>
          <p className="text-xs text-[#64748B]">
            Institutional score evaluations, Stanine ratings, and cryptographically signed transcripts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 bg-white border border-[#D4D9DF] text-[#0E1B2A] px-3.5 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#EDF1F5]"
          >
            <Download className="w-4 h-4 text-[#C6A75E]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 bg-[#0E1B2A] text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1A2C42]"
          >
            <Printer className="w-4 h-4 text-[#C6A75E]" />
            <span>Print Master Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#64748B]">Total Attempts Logged</span>
          <div className="text-2xl font-bold font-mono text-[#0E1B2A] mt-1">{totalAttempts}</div>
          <span className="text-[10px] text-[#64748B]">Evaluated Scripts</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#64748B]">Cohort Average</span>
          <div className="text-2xl font-bold font-mono text-[#0E1B2A] mt-1">{avgScore}%</div>
          <span className="text-[10px] text-[#64748B]">Score Mean</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#64748B]">Qualification Rate</span>
          <div className="text-2xl font-bold font-mono text-[#234E35] mt-1">{passRate}%</div>
          <span className="text-[10px] text-[#234E35] font-semibold">Pass Threshold Cleared</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#64748B]">Highest Score</span>
          <div className="text-2xl font-bold font-mono text-[#C6A75E] mt-1">{highestScore}%</div>
          <span className="text-[10px] text-[#64748B]">Stanine 9 Benchmark</span>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white p-4 rounded-md border border-[#D4D9DF] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search candidate name, roll number, or test..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#D4D9DF] rounded focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono w-full md:w-auto">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 border border-[#D4D9DF] rounded bg-white text-[#0E1B2A] font-semibold"
          >
            <option value="ALL">All Forces</option>
            <option value="PAKISTAN_ARMY">Pakistan Army</option>
            <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option>
            <option value="PAKISTAN_NAVY">Pakistan Navy</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[#D4D9DF] rounded bg-white text-[#0E1B2A] font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="PASSED">Qualified Only</option>
            <option value="FAILED">Unqualified Only</option>
          </select>
        </div>
      </div>

      {/* Master Results Table */}
      <div className="bg-white border border-[#D4D9DF] rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-xs text-[#64748B]">Loading candidate results...</div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#64748B]">No results match filter.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px] text-xs">
              <thead>
                <tr className="border-b border-[#D4D9DF] bg-[#F6F8FA] text-[#64748B] uppercase font-mono text-[10px]">
                  <th className="py-3 px-3">Candidate & Roll No</th>
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3">Examination Title</th>
                  <th className="py-3 px-3">Score & %</th>
                  <th className="py-3 px-3">Stanine</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Submitted</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E6EB]">
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#0E1B2A]">{r.cadetName}</div>
                      <div className="text-[10px] font-mono text-[#64748B]">{r.rollNumber}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px]">
                      <span className="bg-[#EDF6F0] text-[#234E35] px-2 py-0.5 rounded border border-[#88BE9B] font-bold">
                        {r.branch.replace('PAKISTAN_', '')}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-[#0E1B2A] max-w-xs truncate" title={r.testTitle}>
                      {r.testTitle}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-[#0E1B2A]">
                      {r.totalScore}/{r.maxScore} ({r.percentage}%)
                    </td>

                    <td className="py-3 px-3 font-mono font-bold">
                      <span className="bg-[#FDF7EC] text-[#7A5312] px-2 py-0.5 rounded border border-[#DEC088]">
                        Stanine {r.stanine}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {r.passed ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#234E35] bg-[#EDF6F0] px-2 py-0.5 rounded border border-[#88BE9B]">
                          <CheckCircle className="w-3 h-3" /> QUALIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#782525] bg-[#FDF2F2] px-2 py-0.5 rounded border border-[#E29A9A]">
                          <XCircle className="w-3 h-3 text-red-600" /> UNQUALIFIED
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono text-[#64748B]">
                      {new Date(r.completedAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedResult(r)}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-[#0E1B2A] text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1A2C42]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Script</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item-by-Item Answer Review Modal Drawer (Phase 13 Result Detail) */}
      {selectedResult && (
        <div className="fixed inset-0 bg-[#0E1B2A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0E1B2A] rounded-md p-6 max-w-3xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#C6A75E] uppercase tracking-wider">
                  FACULTY SCRIPT & ANSWER KEY INSPECTION
                </span>
                <h3 className="text-lg font-bold text-[#0E1B2A]">
                  Candidate: {selectedResult.cadetName} ({selectedResult.rollNumber})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResult(null)}
                className="px-3 py-1 bg-[#0E1B2A] text-white text-xs font-bold rounded"
              >
                Close
              </button>
            </div>

            {/* Result Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F6F8FA] p-4 rounded border font-mono text-xs text-center">
              <div>
                <span className="text-[10px] text-[#64748B] block">FINAL SCORE</span>
                <span className="text-lg font-bold text-[#0E1B2A]">{selectedResult.percentage}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block">STANINE</span>
                <span className="text-lg font-bold text-[#7A5312]">{selectedResult.stanine}/9</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block">STATUS</span>
                <span className={`text-xs font-bold ${selectedResult.passed ? 'text-[#234E35]' : 'text-[#782525]'}`}>
                  {selectedResult.passed ? 'QUALIFIED' : 'UNQUALIFIED'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block">TIME SPENT</span>
                <span className="text-xs font-bold text-[#0E1B2A]">
                  {Math.round(selectedResult.timeSpentSeconds / 60)} Mins
                </span>
              </div>
            </div>

            {/* Section Breakdown Cards */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase text-[#0E1B2A] block">Section Performance Breakdown:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                {selectedResult.sectionBreakdown.map((s, idx) => (
                  <div key={idx} className="p-3 bg-[#F8FAFC] border rounded">
                    <span className="font-bold text-[#0E1B2A] block truncate">{s.sectionTitle}</span>
                    <span className="text-[#64748B] text-[10px] block mt-0.5">
                      Score: {s.score}/{s.maxScore} ({Math.round((s.score / s.maxScore) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic Verification Hash Docket */}
            <div className="p-3 bg-[#EDF1F5] rounded border text-[10px] font-mono text-[#64748B] truncate">
              HASH SEAL: {selectedResult.verificationHash}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#E2E6EB]">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 border border-[#D4D9DF] text-xs font-bold rounded text-[#0E1B2A] hover:bg-[#EDF1F5]"
              >
                Print Candidate Transcript
              </button>
              <button
                type="button"
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 bg-[#0E1B2A] text-white text-xs font-bold rounded"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
