import React, { useEffect, useState } from 'react';
import { mockService } from '@/lib/mock-service';
import { testService } from '@/services/testService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { TestBlueprint } from '@/types';
import { ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentTestsPage: React.FC = () => {
  const [tests, setTests] = useState<TestBlueprint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTests() {
      try {
        if (isSupabaseConfigured()) {
          const dbTests = await testService.getTests();
          if (dbTests && dbTests.length > 0) {
            const mapped: TestBlueprint[] = dbTests.map((t) => ({
              id: t.id,
              code: t.name.slice(0, 8),
              title: t.name,
              branch: 'TRI_SERVICE',
              courseTarget: 'Commissioning Course',
              totalQuestions: t.total_marks || 100,
              durationMinutes: t.duration_minutes || 65,
              passingScorePercent: t.passing_threshold || 60,
              negativeMarking: t.negative_marking ?? false,
              shuffleQuestions: t.shuffle_questions ?? true,
              shuffleOptions: t.shuffle_options ?? true,
              status: t.status === 'PUBLISHED' || t.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
              sections: [
                { id: 's1', title: 'Verbal Intelligence', subject: 'INTELLIGENCE_VERBAL', questionCount: 2, timeLimitMinutes: 10 },
                { id: 's2', title: 'Non-Verbal Intelligence', subject: 'INTELLIGENCE_NON_VERBAL', questionCount: 2, timeLimitMinutes: 10 },
                { id: 's3', title: 'Academic Mathematics', subject: 'ACADEMIC_MATH', questionCount: 4, timeLimitMinutes: 45 },
              ],
            }));
            setTests(mapped);
            setLoading(false);
            return;
          }
        }
        const data = await mockService.getTests();
        setTests(data);
      } catch (e) {
        console.warn('Failed to load from testService:', e);
        const data = await mockService.getTests();
        setTests(data);
      } finally {
        setLoading(false);
      }
    }
    fetchTests();
  }, []);

  const filteredTests = tests.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = branchFilter === 'ALL' || t.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-md border border-[#D4D9DF] shadow-sm">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#C6A75E] uppercase tracking-wider">OFFICIAL TESTING ROSTER</span>
          <h1 className="text-xl font-bold text-[#0E1B2A] mt-0.5">Assigned Computerized Tests</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Access assigned screening examinations, intelligence batteries, and authorized retake tests.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-semibold px-3 py-1 bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B] rounded">
            {filteredTests.length} Tests Ready
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-md border border-[#D4D9DF] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by test title or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#D4D9DF] rounded focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
          />
        </div>

        {/* Branch Segment Filter */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto text-xs">
          {['ALL', 'PAKISTAN_ARMY', 'PAKISTAN_AIR_FORCE', 'PAKISTAN_NAVY'].map((branch) => (
            <button
              key={branch}
              type="button"
              onClick={() => setBranchFilter(branch)}
              className={`px-3 py-1.5 rounded font-mono text-[11px] uppercase transition-colors ${
                branchFilter === branch
                  ? 'bg-[#0E1B2A] text-white font-bold'
                  : 'bg-[#F6F8FA] text-[#64748B] hover:text-[#0E1B2A] border border-[#E2E6EB]'
              }`}
            >
              {branch === 'ALL' ? 'All Branches' : branch.replace('PAKISTAN_', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Test Cards List */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#64748B]">Loading assigned tests...</div>
      ) : filteredTests.length === 0 ? (
        <div className="bg-white p-8 rounded-md border border-[#D4D9DF] text-center text-xs text-[#64748B]">
          No assigned tests found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#0E1B2A] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#234E35] bg-[#EDF6F0] px-2 py-0.5 rounded border border-[#88BE9B] uppercase">
                    {test.branch.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B] font-semibold">{test.code}</span>
                </div>
                <h3 className="text-base font-bold text-[#0E1B2A] mt-2 leading-snug">{test.title}</h3>
                <p className="text-xs text-[#64748B] mt-1 font-mono">{test.courseTarget}</p>
              </div>

              {/* Sections Breakdown */}
              <div className="space-y-2 bg-[#F6F8FA] p-3 rounded border border-[#E2E6EB] text-xs">
                <span className="text-[10px] font-mono uppercase text-[#64748B] font-bold block">Section Breakdown:</span>
                {test.sections.map((sec) => (
                  <div key={sec.id} className="flex items-center justify-between text-[#1F2937] text-[11px]">
                    <span className="font-medium">• {sec.title}</span>
                    <span className="font-mono text-[#64748B]">
                      {sec.questionCount} Qs ({sec.timeLimitMinutes} min)
                    </span>
                  </div>
                ))}
              </div>

              {/* Test Meta Info */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono border-t border-[#E2E6EB] pt-3">
                <div>
                  <span className="text-[10px] text-[#64748B] block uppercase">Questions</span>
                  <span className="font-bold text-[#0E1B2A]">{test.totalQuestions}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block uppercase">Duration</span>
                  <span className="font-bold text-[#0E1B2A]">{test.durationMinutes} m</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block uppercase">Pass Mark</span>
                  <span className="font-bold text-[#234E35]">{test.passingScorePercent}%</span>
                </div>
              </div>

              {/* CTA Action */}
              <div className="pt-2">
                <Link
                  to={`/student/test/${test.id}/instructions`}
                  className="w-full inline-flex items-center justify-center space-x-2 bg-[#0E1B2A] text-white py-2.5 rounded text-xs font-bold uppercase tracking-wider hover:bg-[#1C2E42] transition-colors"
                >
                  <span>Start Examination</span>
                  <ArrowRight className="w-4 h-4 text-[#C6A75E]" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentTestsPage;
