import React, { useEffect, useState, useMemo } from 'react';
import {
  Trophy,
  Users,
  GraduationCap,
  Award,
  Layers,
  Search,
  BookOpen,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import {
  leaderboardService,
  LeaderboardEntry,
  StudentRankSummary,
  RankNeighborhoodEntry,
} from '@/services/leaderboardService';
import { testService, TestRecord } from '@/services/testService';
import { Link } from 'react-router-dom';

type LeaderboardTab = 'OVERALL' | 'BATCH' | 'COURSE' | 'TESTS';

export const StudentLeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('OVERALL');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<StudentRankSummary | null>(null);

  // Leaderboard data
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [currentStudent, setCurrentStudent] = useState<LeaderboardEntry | null>(null);
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [neighborhood, setNeighborhood] = useState<RankNeighborhoodEntry[]>([]);

  // Tests Tab State
  const [officialTests, setOfficialTests] = useState<TestRecord[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');

  // Search filter inside table
  const [searchFilter, setSearchFilter] = useState('');

  // 1. Initial Load: Fetch Rank Summary & Official Tests
  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const [sumRes, testsRes] = await Promise.all([
          leaderboardService.getStudentRankSummary(),
          testService.getTests(),
        ]);

        if (!isMounted) return;
        setSummary(sumRes);
        const tests = testsRes || [];
        setOfficialTests(tests);
        if (tests.length > 0) {
          setSelectedTestId(tests[0].id);
        }
      } catch (err) {
        console.warn('Failed to load student summary or tests:', err);
      }
    }

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // 2. Fetch Leaderboard Data on Tab or Test change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function fetchLeaderboard() {
      try {
        let res = { leaders: [] as LeaderboardEntry[], current_student: null as LeaderboardEntry | null, total_participants: 0 };
        let hoodScope: 'ACADEMY' | 'COURSE' | 'BATCH' | 'TEST' = 'ACADEMY';
        let hoodScopeId: string | null = null;

        if (activeTab === 'OVERALL') {
          res = await leaderboardService.getAcademyLeaderboard({ limit: 40 });
          hoodScope = 'ACADEMY';
        } else if (activeTab === 'BATCH') {
          // If student has a batch in summary
          const batchId = summary?.batch_rank !== null ? (summary as any)?.batch_id : null;
          res = await leaderboardService.getAcademyLeaderboard({
            batchId: batchId || null,
            limit: 40,
          });
          hoodScope = 'BATCH';
          hoodScopeId = batchId || null;
        } else if (activeTab === 'COURSE') {
          const courseId = (summary as any)?.course_id || null;
          if (courseId) {
            res = await leaderboardService.getCourseLeaderboard(courseId, null, 40);
            hoodScope = 'COURSE';
            hoodScopeId = courseId;
          } else {
            res = await leaderboardService.getAcademyLeaderboard({ limit: 40 });
            hoodScope = 'ACADEMY';
          }
        } else if (activeTab === 'TESTS' && selectedTestId) {
          res = await leaderboardService.getTestLeaderboard(selectedTestId, 40);
          hoodScope = 'TEST';
          hoodScopeId = selectedTestId;
        }

        if (!isMounted) return;
        setLeaders(res.leaders);
        setCurrentStudent(res.current_student);
        setTotalParticipants(res.total_participants);

        // Fetch neighborhood if student has rank > 40
        if (res.current_student && res.current_student.rank > 40) {
          const hood = await leaderboardService.getRankNeighborhood(hoodScope, hoodScopeId, 2);
          if (isMounted) setNeighborhood(hood);
        } else {
          setNeighborhood([]);
        }
      } catch (err) {
        console.warn('Failed to load leaderboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedTestId, summary]);

  // Filtered leaders for in-table search
  const filteredLeaders = useMemo(() => {
    if (!searchFilter.trim()) return leaders;
    const q = searchFilter.toLowerCase().trim();
    return leaders.filter(
      (l) =>
        l.student_name.toLowerCase().includes(q) ||
        l.roll_number.toLowerCase().includes(q) ||
        l.batch_name.toLowerCase().includes(q)
    );
  }, [leaders, searchFilter]);

  const isCurrentStudentInTop40 = leaders.some((l) => l.is_current_user);

  return (
    <div className="max-w-[1240px] w-full mx-auto space-y-6 sm:space-y-8 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E6E8EC]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0E1B2A] text-[#C6A75E] flex items-center justify-center font-bold shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0E1B2A]">
              Academy Leaderboard
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Official candidate merit standings across your cadre batch, entry course, and the academy.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            to="/student/results"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D4D9DF] text-xs font-semibold text-[#0E1B2A] bg-white hover:bg-[#F8FAFC] shadow-xs transition-colors"
          >
            <Award className="w-3.5 h-3.5 text-[#C6A75E]" />
            <span>My Results</span>
          </Link>
          <Link
            to="/student/tests"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E1B2A] text-white hover:bg-[#1C2E42] text-xs font-semibold shadow-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#C6A75E]" />
            <span>Assigned Tests</span>
          </Link>
        </div>
      </div>

      {/* 4 Standing KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Batch Position */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Batch Position</span>
            <Users className="w-4 h-4 text-[#C6A75E]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-sans tabular-nums text-[#0E1B2A]">
              {summary?.batch_rank ? `#${summary.batch_rank}` : '—'}
            </span>
            <span className="text-xs font-medium text-[#64748B]">
              of {summary?.batch_total || 0}
            </span>
          </div>
          <p className="text-[11px] text-[#166534] font-medium">Cadre wing standing</p>
        </div>

        {/* Course Position */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Course Position</span>
            <GraduationCap className="w-4 h-4 text-[#C6A75E]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-sans tabular-nums text-[#0E1B2A]">
              {summary?.course_rank ? `#${summary.course_rank}` : '—'}
            </span>
            <span className="text-xs font-medium text-[#64748B]">
              of {summary?.course_total || 0}
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] font-medium">Entry stream cohort</p>
        </div>

        {/* Academy Position */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Academy Position</span>
            <Shield className="w-4 h-4 text-[#C6A75E]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-sans tabular-nums text-[#0E1B2A]">
              {summary?.academy_rank ? `#${summary.academy_rank}` : '—'}
            </span>
            <span className="text-xs font-medium text-[#64748B]">
              of {summary?.academy_total || 0}
            </span>
          </div>
          <p className="text-[11px] text-[#854D0E] font-medium">Overall institutional merit</p>
        </div>

        {/* Aggregate Performance */}
        <div className="bg-white border border-[#E6E8EC] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Aggregate Score</span>
            <Award className="w-4 h-4 text-[#C6A75E]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-sans tabular-nums text-[#0E1B2A]">
              {summary?.tests_completed && summary.tests_completed > 0
                ? `${summary.aggregate_percentage}%`
                : '—'}
            </span>
            <span className="text-xs font-medium text-[#64748B]">
              ({summary?.tests_completed || 0} tests)
            </span>
          </div>
          <p className="text-[11px] text-[#166534] font-medium">
            Avg: {summary?.average_percentage || 0}% • Best: {summary?.best_percentage || 0}%
          </p>
        </div>
      </div>

      {/* Leaderboard Scope Navigation Tabs */}
      <div className="bg-white border border-[#E6E8EC] rounded-2xl p-2 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('OVERALL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'OVERALL'
                ? 'bg-[#0E1B2A] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0E1B2A] hover:bg-[#F8FAFC]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Overall Academy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BATCH')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'BATCH'
                ? 'bg-[#0E1B2A] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0E1B2A] hover:bg-[#F8FAFC]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>My Batch Wing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COURSE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'COURSE'
                ? 'bg-[#0E1B2A] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0E1B2A] hover:bg-[#F8FAFC]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>My Course Cohort</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TESTS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'TESTS'
                ? 'bg-[#0E1B2A] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#0E1B2A] hover:bg-[#F8FAFC]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Test-Wise Leaderboard</span>
          </button>
        </div>

        {/* Search within table */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search candidate or roll..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E2E8F0] text-xs text-[#0E1B2A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0E1B2A]/20"
          />
        </div>
      </div>

      {/* If Tests Tab Active: Selector Dropdown */}
      {activeTab === 'TESTS' && (
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <BookOpen className="w-4 h-4 text-[#C6A75E]" />
            <span className="font-semibold text-[#0E1B2A]">Select Assessment:</span>
          </div>
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs font-semibold text-[#0E1B2A] focus:outline-none focus:ring-2 focus:ring-[#0E1B2A]/20"
          >
            {officialTests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.duration_minutes}m • {t.total_marks} marks)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Leaderboard Table Card */}
      <div className="bg-white border border-[#E6E8EC] rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0E1B2A]">
              Top 40 Cadets
            </h2>
            <p className="text-xs text-[#64748B]">
              Standardized by {activeTab === 'TESTS' ? 'test percentage & score' : 'weighted aggregate score across official assessments'}.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
            {totalParticipants} candidate{totalParticipants === 1 ? '' : 's'} ranked
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#0E1B2A] animate-spin mx-auto" />
            <p className="text-xs text-[#64748B] font-medium">Computing official standings...</p>
          </div>
        ) : filteredLeaders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Trophy className="w-8 h-8 text-[#94A3B8] mx-auto opacity-60" />
            <p className="text-sm font-bold text-[#0E1B2A]">No leaderboard data yet</p>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Rankings will appear after candidates complete official assessments for this cohort.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E6E8EC] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Cadet Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Wing Batch</th>
                  {activeTab === 'TESTS' ? (
                    <>
                      <th className="py-3 px-4 text-center">Marks</th>
                      <th className="py-3 px-4 text-right">Percentage</th>
                      <th className="py-3 px-4 text-center">Result</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4 text-center">Tests</th>
                      <th className="py-3 px-4 text-right">Aggregate</th>
                      <th className="py-3 px-4 text-right">Best Score</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredLeaders.map((entry) => {
                  const isUser = entry.is_current_user;
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;

                  return (
                    <tr
                      key={entry.student_id}
                      className={`transition-colors ${
                        isUser
                          ? 'bg-[#0E1B2A]/5 font-semibold text-[#0E1B2A] border-l-4 border-l-[#0E1B2A]'
                          : 'hover:bg-[#F8FAFC] text-[#334155]'
                      }`}
                    >
                      {/* Rank Position with Subtle Accent */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FEFCE8] text-[#854D0E] border border-[#FEF08A] font-bold">
                            #1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] font-bold">
                            #2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FFF7ED] text-[#9A3412] border border-[#FED7AA] font-bold">
                            #3
                          </span>
                        ) : (
                          <span className="font-mono text-[#64748B]">#{entry.rank}</span>
                        )}
                      </td>

                      {/* Candidate Name + 'You' Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#0E1B2A]">{entry.student_name}</span>
                          {isUser && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0E1B2A] text-[#C6A75E] uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#94A3B8] block">{entry.course_name}</span>
                      </td>

                      {/* Roll Number */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#475569]">
                        {entry.roll_number}
                      </td>

                      {/* Wing Batch */}
                      <td className="py-3.5 px-4 text-[#475569]">
                        {entry.batch_name}
                      </td>

                      {/* Score Metrics */}
                      {activeTab === 'TESTS' ? (
                        <>
                          <td className="py-3.5 px-4 text-center font-mono font-semibold">
                            {entry.score} / {entry.total_marks}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-[#0E1B2A]">
                            {entry.percentage}%
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                entry.passed
                                  ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {entry.passed ? 'QUALIFIED' : 'FAILED'}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3.5 px-4 text-center font-mono">
                            {entry.tests_completed}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-[#0E1B2A]">
                            {entry.aggregate_percentage}%
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-[#166534] font-semibold">
                            {entry.best_percentage}%
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OUTSIDE TOP 40 STICKY / HIGHLIGHT CARD */}
      {!loading && currentStudent && !isCurrentStudentInTop40 && (
        <div className="bg-white border-2 border-[#0E1B2A] rounded-2xl p-6 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0E1B2A] text-[#C6A75E] flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0E1B2A]">Your Standing</h3>
                <p className="text-xs text-[#64748B]">Official verified position in this cohort ranking.</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-bold font-sans text-[#0E1B2A]">
                #{currentStudent.rank}
              </span>
              <span className="text-xs text-[#64748B] block">
                of {totalParticipants} candidates
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] text-xs">
            <div>
              <span className="text-[#64748B] block">Candidate</span>
              <span className="font-bold text-[#0E1B2A] mt-0.5 block">{currentStudent.student_name}</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Roll Number</span>
              <span className="font-mono font-semibold text-[#0E1B2A] mt-0.5 block">{currentStudent.roll_number}</span>
            </div>
            <div>
              <span className="text-[#64748B] block">{activeTab === 'TESTS' ? 'Test Percentage' : 'Aggregate Score'}</span>
              <span className="font-mono font-bold text-[#0E1B2A] mt-0.5 block text-sm">
                {activeTab === 'TESTS' ? `${currentStudent.percentage}%` : `${currentStudent.aggregate_percentage}%`}
              </span>
            </div>
            <div>
              <span className="text-[#64748B] block">{activeTab === 'TESTS' ? 'Result' : 'Tests Completed'}</span>
              <span className="font-semibold text-[#166534] mt-0.5 block">
                {activeTab === 'TESTS'
                  ? currentStudent.passed ? 'QUALIFIED' : 'FAILED'
                  : `${currentStudent.tests_completed} completed`}
              </span>
            </div>
          </div>

          {/* Rank Neighborhood (+/- 2 around candidate) */}
          {neighborhood.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Cohort Neighborhood (Standing Context)
              </span>
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden divide-y divide-[#F1F5F9] text-xs">
                {neighborhood.map((nh) => (
                  <div
                    key={nh.roll_number}
                    className={`flex items-center justify-between p-3 transition-colors ${
                      nh.is_current_user
                        ? 'bg-[#0E1B2A]/5 font-bold text-[#0E1B2A] border-l-4 border-l-[#0E1B2A]'
                        : 'bg-white text-[#475569]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 font-mono font-bold text-center">#{nh.rank}</span>
                      <span>{nh.student_name}</span>
                      {nh.is_current_user && (
                        <span className="px-1.5 py-0.5 rounded bg-[#0E1B2A] text-[#C6A75E] text-[10px] uppercase font-bold">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[#94A3B8] font-mono">{nh.roll_number}</span>
                      <span className="font-mono font-bold">{nh.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentLeaderboardPage;
