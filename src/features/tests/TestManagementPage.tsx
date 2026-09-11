import React, { useEffect, useState } from 'react';
import { testService } from '@/services/testService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { TestBlueprint } from '@/types';
import { Plus, Search, Play, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TestManagementPage: React.FC = () => {
  const [tests, setTests] = useState<TestBlueprint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Test Detail Modal
  const [selectedTest, setSelectedTest] = useState<TestBlueprint | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SECTIONS' | 'QUESTIONS' | 'RESULTS'>('OVERVIEW');

  useEffect(() => {
    async function fetchTests() {
      try {
        if (isSupabaseConfigured()) {
          const dbTests = await testService.getTests();
          if (dbTests) {
            const mapped: TestBlueprint[] = dbTests.map((t) => ({
              id: t.id,
              code: t.name.slice(0, 8),
              title: t.name,
              branch: 'TRI_SERVICE',
              courseTarget: 'Armed Forces Induction',
              totalQuestions: t.total_marks || 100,
              durationMinutes: t.duration_minutes || 65,
              passingScorePercent: t.passing_threshold || 60,
              negativeMarking: t.negative_marking ?? false,
              shuffleQuestions: t.shuffle_questions ?? true,
              shuffleOptions: t.shuffle_options ?? true,
              status: t.status === 'PUBLISHED' || t.status === 'ACTIVE' ? 'ACTIVE' : t.status === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT',
              sections: [],
            }));
            setTests(mapped);
          }
        }
      } catch (e) {
        console.warn('Failed to load from testService:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchTests();
  }, []);

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.courseTarget.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBranch = branchFilter === 'ALL' || t.branch === branchFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-md border border-[#D4D9DF] shadow-sm">
        <div>
          <span className="text-[10px] font-sans font-bold text-[#C6A75E] uppercase tracking-wider">
            FACULTY TEST BLUEPRINT ENGINE
          </span>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#0E1B2A] mt-0.5">
            Test Management & Blueprints
          </h1>
          <p className="text-xs text-[#64748B]">
            Construct, configure, section-allocate, and publish CBT screening examinations.
          </p>
        </div>
        <Link
          to="/admin/test-builder"
          className="inline-flex items-center space-x-1.5 bg-[#0E1B2A] text-white px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#1A2C42] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 text-[#C6A75E]" />
          <span>Create New Test (Test Builder)</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-sans font-bold uppercase text-[#64748B]">Total Blueprints</span>
          <div className="text-2xl font-bold font-sans tabular-nums text-[#0E1B2A] mt-1">{tests.length}</div>
          <span className="text-[10px] text-[#64748B]">Screening Examinations</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-sans font-bold uppercase text-[#64748B]">Active & Deployed</span>
          <div className="text-2xl font-bold font-sans tabular-nums text-[#234E35] mt-1">
            {tests.filter((t) => t.status === 'ACTIVE').length}
          </div>
          <span className="text-[10px] text-[#234E35] font-semibold">CBT Ready</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-sans font-bold uppercase text-[#64748B]">Draft Blueprints</span>
          <div className="text-2xl font-bold font-sans tabular-nums text-[#7A5312] mt-1">
            {tests.filter((t) => t.status === 'DRAFT').length}
          </div>
          <span className="text-[10px] text-[#7A5312]">In Assembly</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-sans font-bold uppercase text-[#64748B]">Tri-Service Standard</span>
          <div className="text-2xl font-bold font-sans tabular-nums text-[#0E1B2A] mt-1">100%</div>
          <span className="text-[10px] text-[#234E35]">Multi-Section Validated</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-md border border-[#D4D9DF] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search test title, code, or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#D4D9DF] rounded focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-sans w-full md:w-auto">
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
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Tests Data Table */}
      <div className="bg-white border border-[#D4D9DF] rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-xs text-[#64748B]">Loading test blueprints...</div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#64748B]">No test blueprints found.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px] text-xs">
              <thead>
                <tr className="border-b border-[#D4D9DF] bg-[#F6F8FA] text-[#64748B] uppercase font-sans font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Test Code & Title</th>
                  <th className="py-3 px-3">Force & Target Course</th>
                  <th className="py-3 px-3">Sections</th>
                  <th className="py-3 px-3">Total Qs</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Passing %</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E6EB]">
                {filteredTests.map((test) => (
                  <tr key={test.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#0E1B2A]">{test.title}</div>
                      <div className="text-[10px] font-mono text-[#64748B]">Code: {test.code}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#0E1B2A]">{test.courseTarget}</div>
                      <div className="text-[10px] font-sans text-[#64748B]">{test.branch.replace('_', ' ')}</div>
                    </td>
                    <td className="py-3 px-3 font-sans tabular-nums font-semibold">
                      {test.sections.length} Sections
                    </td>
                    <td className="py-3 px-3 font-sans tabular-nums font-bold text-[#0E1B2A]">
                      {test.totalQuestions} Qs
                    </td>
                    <td className="py-3 px-3 font-sans tabular-nums text-[#64748B]">
                      {test.durationMinutes} mins
                    </td>
                    <td className="py-3 px-3 font-sans tabular-nums font-bold text-[#234E35]">
                      {test.passingScorePercent}%
                    </td>
                    <td className="py-3 px-3">
                      {test.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 font-sans text-[10px] font-bold text-[#234E35] bg-[#EDF6F0] px-2 py-0.5 rounded border border-[#88BE9B]">
                          <Check className="w-3 h-3" /> ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-sans text-[10px] font-bold text-[#7A5312] bg-[#FDF7EC] px-2 py-0.5 rounded border border-[#DEC088]">
                          {test.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setSelectedTest(test)}
                          className="px-2.5 py-1 text-xs font-semibold bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] hover:bg-[#EDF1F5]"
                        >
                          View Details
                        </button>
                        <Link
                          to={`/student/test/${test.id}/instructions`}
                          className="p-1.5 bg-[#0E1B2A] text-white rounded hover:bg-[#1A2C42]"
                          title="Simulate Student Launch"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Test Detail Modal Drawer */}
      {selectedTest && (
        <div className="fixed inset-0 bg-[#0E1B2A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0E1B2A] rounded-md p-6 max-w-3xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-3">
              <div>
                <span className="text-[10px] font-sans font-bold text-[#C6A75E] uppercase tracking-wider">
                  BLUEPRINT SPECIFICATION DOCKET
                </span>
                <h3 className="text-lg font-bold text-[#0E1B2A]">{selectedTest.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTest(null)}
                className="px-3 py-1 bg-[#0E1B2A] text-white text-xs font-bold rounded"
              >
                Close
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex space-x-2 border-b border-[#E2E6EB] text-xs font-sans">
              {(['OVERVIEW', 'SECTIONS', 'QUESTIONS', 'RESULTS'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-3 font-bold border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-[#0E1B2A] text-[#0E1B2A]'
                      : 'border-transparent text-[#64748B] hover:text-[#0E1B2A]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'OVERVIEW' && (
              <div className="grid grid-cols-2 gap-4 text-xs font-sans bg-[#F6F8FA] p-4 rounded border border-[#E2E6EB]">
                <div>
                  <span className="text-[#64748B] block text-[10px]">BLUEPRINT CODE</span>
                  <span className="font-bold text-[#0E1B2A] font-mono">{selectedTest.code}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">COURSE TARGET</span>
                  <span className="font-bold text-[#0E1B2A]">{selectedTest.courseTarget}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">TOTAL ITEMS</span>
                  <span className="font-bold text-[#0E1B2A] tabular-nums">{selectedTest.totalQuestions} Questions</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">CUMULATIVE TIME</span>
                  <span className="font-bold text-[#0E1B2A] tabular-nums">{selectedTest.durationMinutes} Minutes</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">PASSING SCORE</span>
                  <span className="font-bold text-[#234E35] tabular-nums">{selectedTest.passingScorePercent}%</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">SHUFFLE RULES</span>
                  <span className="font-bold text-[#0E1B2A]">
                    {selectedTest.shuffleQuestions ? 'Questions Shuffled' : 'Fixed Sequence'}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'SECTIONS' && (
              <div className="space-y-2 text-xs">
                {selectedTest.sections.map((sec) => (
                  <div key={sec.id} className="p-3 bg-[#F6F8FA] border rounded flex justify-between font-sans">
                    <div>
                      <div className="font-bold text-[#0E1B2A]">{sec.title}</div>
                      <div className="text-[10px] text-[#64748B]">Subject: {sec.subject}</div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="font-bold text-[#0E1B2A]">{sec.questionCount} Questions</div>
                      <div className="text-[10px] text-[#64748B]">{sec.timeLimitMinutes} mins</div>
                    </div>
                  </div>
                ))}
              </div>
            )}


            {activeTab === 'QUESTIONS' && (
              <div className="text-xs text-[#64748B] py-4 text-center">
                All {selectedTest.totalQuestions} questions allocated and sealed.
              </div>
            )}

            {activeTab === 'RESULTS' && (
              <div className="text-xs text-[#64748B] py-4 text-center">
                Candidate examination results synced from CBT terminals.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagementPage;
