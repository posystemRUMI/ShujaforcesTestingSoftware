import React, { useEffect, useState, useMemo } from 'react';
import {
  Trophy,
  Filter,
  Search,
  Award,
  X,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  leaderboardService,
  LeaderboardEntry,
  StudentRankSummary,
} from '@/services/leaderboardService';
import { testService, TestRecord } from '@/services/testService';
import { configurationService } from '@/services/configurationService';

interface ForceOption {
  id: string;
  name: string;
  code: string;
}

interface CourseOption {
  id: string;
  name: string;
  force_id: string;
}

export const TeacherLeaderboardPage: React.FC = () => {
  // Filters State
  const [forces, setForces] = useState<ForceOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [tests, setTests] = useState<TestRecord[]>([]);

  const [selectedForceId, setSelectedForceId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedTestId, setSelectedTestId] = useState<string>(''); // '' means aggregate

  // Search query (server-side lookup)
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Leaderboard data
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Selected Student Performance Detail Modal
  const [inspectedStudent, setInspectedStudent] = useState<LeaderboardEntry | null>(null);
  const [inspectedSummary, setInspectedSummary] = useState<StudentRankSummary | null>(null);
  const [loadingInspection, setLoadingInspection] = useState(false);

  // 1. Load Filter Hierarchy Metadata
  useEffect(() => {
    let isMounted = true;

    async function loadFilterHierarchy() {
      try {
        const [fList, cList, tRes] = await Promise.all([
          configurationService.getForces(),
          configurationService.getCourses(),
          testService.getTests(),
        ]);

        if (!isMounted) return;
        setForces(fList.map((f) => ({ id: f.id, name: f.name, code: f.branch })));
        setCourses(cList.map((c) => ({ id: c.id, name: c.name, force_id: c.forceId || '' })));
        setTests(tRes || []);
      } catch (err) {
        console.warn('Failed to load filter metadata:', err);
      }
    }

    loadFilterHierarchy();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Dependent Filter Options
  const availableCourses = useMemo(() => {
    if (!selectedForceId) return courses;
    return courses.filter((c) => c.force_id === selectedForceId);
  }, [courses, selectedForceId]);

  const availableTests = useMemo(() => {
    let list = tests;
    if (selectedForceId) list = list.filter((t) => t.force_id === selectedForceId || t.eligibilities?.some(e => e.force_id === selectedForceId));
    if (selectedCourseId) list = list.filter((t) => t.course_id === selectedCourseId || t.eligibilities?.some(e => e.course_id === selectedCourseId));
    return list;
  }, [tests, selectedForceId, selectedCourseId]);

  // Handle Parent Filter Changes (Reset children)
  const handleForceChange = (forceId: string) => {
    setSelectedForceId(forceId);
    setSelectedCourseId('');
    setSelectedTestId('');
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedTestId('');
  };

  // Keep dependent selections valid
  useEffect(() => {
    if (selectedCourseId && !availableCourses.some((c) => c.id === selectedCourseId)) {
      setSelectedCourseId('');
    }
  }, [availableCourses, selectedCourseId]);

  useEffect(() => {
    if (selectedTestId && !availableTests.some((t) => t.id === selectedTestId)) {
      setSelectedTestId('');
    }
  }, [availableTests, selectedTestId]);

  // 3. Load Leaderboard Data based on Filters & Search
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    async function fetchLeaderboard() {
      try {
        if (searchQuery.trim()) {
          setSearching(true);
          const results = await leaderboardService.searchStudentOnLeaderboard(searchQuery, {
            forceId: selectedForceId || null,
            courseId: selectedCourseId || null,
            testId: selectedTestId || null,
          });
          if (isMounted) {
            // Apply defensive filtering to search results as well
            let filteredResults = results;
            if (selectedForceId) {
              const selectedForce = forces.find((f) => f.id === selectedForceId);
              filteredResults = filteredResults.filter((l) => {
                if (l.force_id && l.force_id === selectedForceId) return true;
                if (selectedForce && l.force_name) {
                  const fn = l.force_name.toLowerCase();
                  return fn === selectedForce.name.toLowerCase() || fn.includes(selectedForce.code.toLowerCase());
                }
                return false;
              });
            }
            if (selectedCourseId) {
              const selectedCourse = courses.find((c) => c.id === selectedCourseId);
              filteredResults = filteredResults.filter((l) => {
                if (l.course_id && l.course_id === selectedCourseId) return true;
                if (selectedCourse && l.course_name) {
                  return l.course_name.toLowerCase() === selectedCourse.name.toLowerCase();
                }
                return false;
              });
            }
            filteredResults = filteredResults.map((r, idx) => ({ ...r, rank: idx + 1 }));
            setLeaders(filteredResults);
            setTotalParticipants(filteredResults.length);
          }
          setSearching(false);
          return;
        }

        let res = { leaders: [] as LeaderboardEntry[], current_student: null as LeaderboardEntry | null, total_participants: 0 };
        if (selectedTestId) {
          res = await leaderboardService.getTestLeaderboard(selectedTestId, 40, {
            forceId: selectedForceId || null,
            courseId: selectedCourseId || null,
          });
        } else if (selectedCourseId) {
          res = await leaderboardService.getCourseLeaderboard(
            selectedCourseId,
            null,
            40,
            1,
            selectedForceId || null
          );
        } else {
          res = await leaderboardService.getAcademyLeaderboard({
            forceId: selectedForceId || null,
            courseId: selectedCourseId || null,
            limit: 40,
          });
        }

        if (!isMounted) return;

        // Strict defensive filtering for UI guarantees
        let displayLeaders = res.leaders || [];
        if (selectedForceId) {
          const selectedForce = forces.find((f) => f.id === selectedForceId);
          displayLeaders = displayLeaders.filter((l) => {
            if (l.force_id && l.force_id === selectedForceId) return true;
            if (selectedForce && l.force_name) {
              const fn = l.force_name.toLowerCase();
              return fn === selectedForce.name.toLowerCase() || fn.includes(selectedForce.code.toLowerCase());
            }
            return false;
          });
        }

        if (selectedCourseId) {
          const selectedCourse = courses.find((c) => c.id === selectedCourseId);
          displayLeaders = displayLeaders.filter((l) => {
            if (l.course_id && l.course_id === selectedCourseId) return true;
            if (selectedCourse && l.course_name) {
              return l.course_name.toLowerCase() === selectedCourse.name.toLowerCase();
            }
            return false;
          });
        }

        // Re-number ranks sequentially 1..N
        displayLeaders = displayLeaders.map((item, idx) => ({
          ...item,
          rank: idx + 1,
        }));

        setLeaders(displayLeaders);
        setTotalParticipants(displayLeaders.length);
      } catch (err) {
        console.warn('Failed to load teacher leaderboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [selectedForceId, selectedCourseId, selectedTestId, searchQuery, forces, courses]);

  // Inspect student detail modal handler
  const handleInspectStudent = async (entry: LeaderboardEntry) => {
    setInspectedStudent(entry);
    setLoadingInspection(true);
    try {
      const summary = await leaderboardService.getStudentRankSummary(entry.student_id);
      setInspectedSummary(summary);
    } catch (err) {
      console.warn('Failed to load student inspection summary:', err);
    } finally {
      setLoadingInspection(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E6E8EC]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0E1B2A] text-[#C6A75E] flex items-center justify-center font-bold shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0E1B2A]">
              Academy Standing & Leaderboard
            </h1>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-[#0E1B2A] self-start sm:self-auto shadow-xs">
          Ranked Cadets: <span className="font-bold text-[#C6A75E]">{totalParticipants}</span>
        </span>
      </div>

      {/* Dependent Filter Bar */}
      <div className="bg-white border border-[#E6E8EC] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0E1B2A] uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-[#C6A75E]" />
          <span>Hierarchy Filters & Scope</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Target Force */}
          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
              Armed Force
            </label>
            <select
              value={selectedForceId}
              onChange={(e) => handleForceChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D4D9DF] bg-[#F8FAFC] text-xs font-semibold text-[#0E1B2A] focus:outline-none focus:ring-2 focus:ring-[#0E1B2A]/20"
            >
              <option value="">All Armed Forces</option>
              {forces.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Target Course */}
          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
              Entry Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D4D9DF] bg-[#F8FAFC] text-xs font-semibold text-[#0E1B2A] focus:outline-none focus:ring-2 focus:ring-[#0E1B2A]/20"
            >
              <option value="">All Entry Courses</option>
              {availableCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Official Test vs Aggregate */}
          <div>
            <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
              Performance View
            </label>
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D4D9DF] bg-[#F8FAFC] text-xs font-semibold text-[#0E1B2A] focus:outline-none focus:ring-2 focus:ring-[#0E1B2A]/20"
            >
              <option value="">Overall Aggregate Performance</option>
              {availableTests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Candidate Search Bar */}
        <div className="pt-2 border-t border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name or roll number across database..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E2E8F0] text-xs text-[#0E1B2A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0E1B2A]/20"
            />
          </div>

          {(selectedForceId || selectedCourseId || selectedTestId || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedForceId('');
                setSelectedCourseId('');
                setSelectedTestId('');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-[#64748B] hover:text-[#0E1B2A] inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-white border border-[#E6E8EC] rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0E1B2A]">
              {selectedTestId
                ? 'Test Assessment Leaderboard'
                : 'Aggregate Merit Leaderboard'}
            </h2>
          </div>
        </div>

        {loading || searching ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#0E1B2A] animate-spin mx-auto" />
            <p className="text-xs text-[#64748B] font-medium">Computing institutional standings...</p>
          </div>
        ) : leaders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Trophy className="w-8 h-8 text-[#94A3B8] mx-auto opacity-60" />
            <p className="text-sm font-bold text-[#0E1B2A]">No candidates match the selected criteria</p>
            <p className="text-xs text-[#64748B]">
              Adjust the filters or search query to view official cadet standings.
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
                  <th className="py-3 px-4">Force & Course</th>
                  {selectedTestId ? (
                    <>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-right">Percentage</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-4 text-center">Tests</th>
                      <th className="py-3 px-4 text-right">Aggregate</th>
                      <th className="py-3 px-4 text-right">Best Score</th>
                    </>
                  )}
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {leaders.map((entry) => {
                  const isTop1 = entry.rank === 1;
                  const isTop2 = entry.rank === 2;
                  const isTop3 = entry.rank === 3;

                  return (
                    <tr
                      key={entry.student_id}
                      onClick={() => handleInspectStudent(entry)}
                      className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                    >
                      {/* Rank Position */}
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

                      {/* Candidate Name */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#0E1B2A] block">{entry.student_name}</span>
                      </td>

                      {/* Roll Number */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#475569]">
                        {entry.roll_number}
                      </td>

                      {/* Force & Course */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#0E1B2A] block">{entry.force_name}</span>
                        <span className="text-[11px] text-[#94A3B8] block">{entry.course_name}</span>
                      </td>

                      {/* Performance Columns */}
                      {selectedTestId ? (
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

                      {/* View Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          className="p-1 text-[#64748B] hover:text-[#0E1B2A] rounded-lg transition-colors"
                          title="View Cadet Performance"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECTION MODAL / DRAWER */}
      {inspectedStudent && (
        <div className="fixed inset-0 bg-[#0E1B2A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0E1B2A] text-[#C6A75E] flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0E1B2A]">{inspectedStudent.student_name}</h3>
                  <p className="text-xs text-[#64748B]">Roll No: {inspectedStudent.roll_number}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setInspectedStudent(null);
                  setInspectedSummary(null);
                }}
                className="p-1 text-[#64748B] hover:text-[#0E1B2A] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingInspection ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="w-5 h-5 text-[#0E1B2A] animate-spin mx-auto" />
                <p className="text-xs text-[#64748B]">Loading candidate performance audit...</p>
              </div>
            ) : inspectedSummary ? (
              <div className="space-y-4 text-xs">
                {/* 2 Positions Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                    <span className="text-[10px] text-[#64748B] uppercase font-bold block">Course Rank</span>
                    <span className="text-lg font-bold text-[#0E1B2A] mt-0.5 block">
                      {inspectedSummary.course_rank ? `#${inspectedSummary.course_rank}` : '—'}
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">of {inspectedSummary.course_total}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                    <span className="text-[10px] text-[#64748B] uppercase font-bold block">Academy Rank</span>
                    <span className="text-lg font-bold text-[#0E1B2A] mt-0.5 block">
                      {inspectedSummary.academy_rank ? `#${inspectedSummary.academy_rank}` : '—'}
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">of {inspectedSummary.academy_total}</span>
                  </div>
                </div>

                {/* Score Summary Box */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-[#64748B]">Completed Tests:</span>
                    <span className="text-[#0E1B2A]">{inspectedSummary.tests_completed} official assessments</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-[#64748B]">Aggregate Percentage:</span>
                    <span className="text-[#0E1B2A] font-mono font-bold text-sm">{inspectedSummary.aggregate_percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-[#64748B]">Average Test Percentage:</span>
                    <span className="text-[#0E1B2A] font-mono">{inspectedSummary.average_percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-[#64748B]">Best Recorded Percentage:</span>
                    <span className="text-[#166534] font-mono font-bold">{inspectedSummary.best_percentage}%</span>
                  </div>
                </div>

                {/* Latest Assessment Box */}
                {inspectedSummary.latest_test_name && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                      Most Recent Official Assessment
                    </span>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="font-semibold text-[#0E1B2A]">{inspectedSummary.latest_test_name}</span>
                      <span className="font-mono font-bold text-[#0E1B2A]">{inspectedSummary.latest_test_percentage}%</span>
                    </div>
                    <span className="text-[11px] text-[#64748B] block">
                      Test Rank: #{inspectedSummary.latest_test_rank} of {inspectedSummary.latest_test_total} candidates
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#64748B] text-center p-4">No summary data available.</p>
            )}

            <div className="pt-2 border-t border-[#F1F5F9] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setInspectedStudent(null);
                  setInspectedSummary(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#0E1B2A] text-white text-xs font-semibold hover:bg-[#1C2E42] transition-colors"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLeaderboardPage;
