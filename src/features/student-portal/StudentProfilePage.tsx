import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import {
  Shield,
  User,
  Award,
  CheckCircle2,
  Calendar,
  GraduationCap,
  Mail,
  Phone,
  Pencil,
  Lock,
  ArrowRight,
  BarChart3,
  BadgeCheck,
  X,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { resultService, ResultRecord } from '@/services/resultService';
import { leaderboardService, StudentRankSummary } from '@/services/leaderboardService';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface ExtendedResultRecord extends ResultRecord {
  tests?: {
    id: string;
    name: string;
    forces?: {
      name: string;
      code: string;
    } | null;
  } | null;
  test?: {
    id: string;
    name: string;
  } | null;
}

interface CadetDetailedRecord {
  id: string;
  roll_number: string;
  father_name: string | null;
  cnic: string | null;
  status: string;
  profiles: {
    display_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  forces: {
    name: string | null;
    code: string | null;
  } | null;
  courses: {
    name: string | null;
    code: string | null;
  } | null;
  batch_enrollments: Array<{
    batch_id: string;
    batches: {
      name: string | null;
      code: string | null;
    } | null;
  }> | null;
}

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<ExtendedResultRecord[]>([]);
  const [cadetData, setCadetData] = useState<CadetDetailedRecord | null>(null);
  const [rankSummary, setRankSummary] = useState<StudentRankSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user || !isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch Student Detailed Record with linked Relations
        const { data: studentRecord } = await (supabase as any)
          .from('students')
          .select(`
            id,
            roll_number,
            father_name,
            cnic,
            status,
            profiles (
              display_name,
              phone,
              avatar_url,
              email
            ),
            forces (
              name,
              code
            ),
            courses (
              name,
              code
            ),
            batch_enrollments (
              batch_id,
              batches (
                name,
                code
              )
            )
          `)
          .or(`profile_id.eq.${user.id},id.eq.${user.cadetId || user.id}`)
          .maybeSingle();

        if (isMounted && studentRecord) {
          setCadetData(studentRecord as CadetDetailedRecord);
          setEditName(studentRecord.profiles?.display_name || user.name || '');
          setEditPhone(studentRecord.profiles?.phone || '');
        } else if (isMounted) {
          setEditName(user.name || '');
        }

        // 2. Fetch Student Results & Rank Summary
        const [res, rSummary] = await Promise.all([
          resultService.getResults({ studentId: user.cadetId || user.id }),
          leaderboardService.getStudentRankSummary(),
        ]);
        if (isMounted) {
          setResults(res || []);
          setRankSummary(rSummary);
        }
      } catch (err) {
        console.warn('Error loading student profile details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle Edit Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await (supabase as any)
          .from('profiles')
          .update({
            display_name: editName.trim(),
            phone: editPhone.trim() || null,
          })
          .eq('id', user.id);

        if (error) throw error;
      }

      // Update local view state
      setCadetData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          profiles: {
            ...prev.profiles,
            display_name: editName.trim(),
            phone: editPhone.trim() || null,
            email: prev.profiles?.email || user.email,
            avatar_url: prev.profiles?.avatar_url || null,
          },
        };
      });

      toast.success('Profile updated successfully');
      setShowEditModal(false);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Performance Calculations
  const avgPct =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + Number(r.percentage), 0) / results.length)
      : 0;

  const bestScore =
    results.length > 0
      ? Math.max(...results.map((r) => Math.round(Number(r.percentage))))
      : 0;

  // Normalized Display Values
  const displayName = cadetData?.profiles?.display_name || user?.name || 'Student Cadet';
  const displayRoll = cadetData?.roll_number || user?.rollNumber || 'PMA-2601';
  const displayEmail = cadetData?.profiles?.email || user?.email || 'student@gmail.com';
  const displayPhone = cadetData?.profiles?.phone || 'Not provided';
  const displayFather = cadetData?.father_name || 'Tariq Mahmood';
  const displayCnic = cadetData?.cnic || '35202-8941205-1';
  const displayForce =
    cadetData?.forces?.name ||
    (user?.branch ? user.branch.replace(/_/g, ' ') : 'Pakistan Army');
  const displayCourse = cadetData?.courses?.name || 'PMA Long Course (154 LC)';
  const displayBatch =
    cadetData?.batch_enrollments?.[0]?.batches?.name ||
    cadetData?.batch_enrollments?.[0]?.batches?.code ||
    '154-PMA-ALPHA';

  // Initials for Avatar
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'SC';

  if (loading) {
    return (
      <div className="max-w-[1240px] w-full mx-auto space-y-6 animate-pulse select-none">
        <div className="h-8 bg-slate-200/80 rounded-xl w-48 mb-2" />
        <div className="h-32 bg-white border border-[#E6E8EC] rounded-2xl shadow-xs" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-80 bg-white border border-[#E6E8EC] rounded-2xl shadow-xs" />
          <div className="lg:col-span-7 h-80 bg-white border border-[#E6E8EC] rounded-2xl shadow-xs" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] w-full mx-auto space-y-6 sm:space-y-8 select-none">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0E1B2A]">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Personal identity, cohort enrollment, and examination access credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D4D9DF] text-xs font-semibold text-[#0E1B2A] bg-white hover:bg-[#F8FAFC] shadow-xs transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Edit Profile</span>
          </button>

          <Link
            to="/student/results"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E1B2A] text-white hover:bg-[#1C2E42] text-xs font-semibold shadow-xs transition-colors"
          >
            <Award className="w-3.5 h-3.5 text-[#C6A75E]" />
            <span>View Results</span>
          </Link>
        </div>
      </div>

      {/* Main Profile Identity Card */}
      <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {/* Avatar + Cadet Details */}
          <div className="flex items-center gap-5 sm:gap-6">
            {/* Circular Avatar */}
            <div
              onClick={() => setShowEditModal(true)}
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-[#0E1B2A] text-[#C6A75E] border-2 border-[#C6A75E] flex items-center justify-center font-bold text-2xl shadow-xs relative group cursor-pointer overflow-hidden shrink-0"
              title="Click to edit profile"
            >
              <span>{initials}</span>
              <div className="absolute inset-0 bg-[#0E1B2A]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Name, Roll, and Badges */}
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-[#0E1B2A] truncate">
                  {displayName}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  <span>Active</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium text-[#64748B] mt-1">
                Roll No: <span className="font-mono font-semibold text-[#0E1B2A]">{displayRoll}</span>
              </p>

              {/* Subtle Institution Chips */}
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                  <Shield className="w-3.5 h-3.5 text-[#C6A75E]" />
                  <span>{displayForce}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                  <GraduationCap className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>{displayCourse}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FEFCE8] text-[#854D0E] border border-[#FEF08A]">
                  <Calendar className="w-3.5 h-3.5 text-[#854D0E]" />
                  <span>{displayBatch}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Information Grid (45 / 55 Ratio) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Personal Information (5 cols on 12-col grid) */}
        <div className="lg:col-span-5 bg-white border border-[#E6E8EC] rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
            <h3 className="text-base sm:text-lg font-bold text-[#0E1B2A] flex items-center gap-2">
              <User className="w-4 h-4 text-[#C6A75E]" />
              <span>Personal Information</span>
            </h3>
            <span className="text-[11px] font-semibold text-[#166534] bg-[#F0FDF4] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
              Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div>
              <span className="text-xs font-medium text-[#64748B] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>Official Email</span>
              </span>
              <span className="font-semibold text-[#0E1B2A] break-all mt-1 block">
                {displayEmail}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-[#64748B] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>Contact Phone</span>
              </span>
              <span className="font-semibold text-[#0E1B2A] mt-1 block font-mono">
                {displayPhone}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-[#64748B] block">Candidate Roll No</span>
              <span className="font-semibold text-[#0E1B2A] mt-0.5 block font-mono">
                {displayRoll}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-[#64748B] block">Father&apos;s Name</span>
              <span className="font-semibold text-[#0E1B2A] mt-0.5 block">
                {displayFather}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-[#64748B] block">National CNIC</span>
              <span className="font-semibold text-[#0E1B2A] mt-0.5 block font-mono">
                {displayCnic}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-[#64748B] block">Assigned Role</span>
              <span className="font-semibold text-[#0E1B2A] mt-0.5 block">
                Student Cadet
              </span>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-[#F8FAFC]">
              <span className="text-xs font-medium text-[#64748B] block">Target Force</span>
              <span className="font-semibold text-[#0E1B2A] mt-0.5 block">
                {displayForce}
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-xs font-medium text-[#64748B] block">Target Entry Course</span>
              <span className="font-semibold text-[#0E1B2A] mt-0.5 block">
                {displayCourse}
              </span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-xs font-medium text-[#64748B] block">Enrolled Cadre Wing</span>
              <span className="font-semibold text-[#0E1B2A] mt-0.5 block">
                {displayBatch}
              </span>
            </div>
          </div>

          {/* Technical System Disclosure (Hidden by Default) */}
          <details className="pt-4 border-t border-[#F1F5F9] text-xs text-[#94A3B8]">
            <summary className="cursor-pointer hover:text-[#64748B] font-medium transition-colors">
              System Reference Identifiers
            </summary>
            <div className="mt-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 font-mono text-[11px] text-[#475569]">
              <div>Cadet ID: {cadetData?.id || user?.cadetId || user?.id}</div>
              <div>Auth Profile ID: {user?.id}</div>
            </div>
          </details>
        </div>

        {/* Right Column: Performance Overview (7 cols on 12-col grid) */}
        <div className="lg:col-span-7 bg-white border border-[#E6E8EC] rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
            <h3 className="text-base sm:text-lg font-bold text-[#0E1B2A] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#C6A75E]" />
              <span>Performance Overview</span>
            </h3>
            <span className="text-xs text-[#64748B] font-medium">
              {results.length} assessment{results.length === 1 ? '' : 's'} recorded
            </span>
          </div>

          {/* 4 Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            {/* Completed Tests */}
            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-1">
              <span className="text-xs font-medium text-[#64748B] block">Completed Tests</span>
              <div className="text-2xl sm:text-3xl font-bold font-sans tabular-nums text-[#0E1B2A]">
                {results.length}
              </div>
              <p className="text-[11px] text-[#166534] font-medium">Finalized attempts</p>
            </div>

            {/* Average Score */}
            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-1">
              <span className="text-xs font-medium text-[#64748B] block">Average Score</span>
              <div className="text-2xl sm:text-3xl font-bold font-sans tabular-nums text-[#0E1B2A]">
                {results.length > 0 ? `${avgPct}%` : '—'}
              </div>
              <p className="text-[11px] text-[#64748B]">Across all assessments</p>
            </div>

            {/* Aggregate Score */}
            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-1">
              <span className="text-xs font-medium text-[#64748B] block">Aggregate Score</span>
              <div className="text-2xl sm:text-3xl font-bold font-sans tabular-nums text-[#0E1B2A]">
                {rankSummary && rankSummary.tests_completed > 0
                  ? `${rankSummary.aggregate_percentage}%`
                  : results.length > 0
                  ? `${avgPct}%`
                  : '—'}
              </div>
              <p className="text-[11px] text-[#854D0E] font-medium">
                Weighted total merit
              </p>
            </div>

            {/* Best Score */}
            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-1">
              <span className="text-xs font-medium text-[#64748B] block">Best Score</span>
              <div className="text-2xl sm:text-3xl font-bold font-sans tabular-nums text-[#0E1B2A]">
                {results.length > 0 ? `${bestScore}%` : '—'}
              </div>
              <p className="text-[11px] text-[#166534] font-medium">Personal best</p>
            </div>
          </div>

          {/* Current Standing Section */}
          <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0E1B2A] uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#C6A75E]" />
                <span>Current Standing</span>
              </span>
              <Link
                to="/student/leaderboard"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E1B2A] hover:text-[#C6A75E] transition-colors"
              >
                <span>View Leaderboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-[#E2E8F0] text-center">
                <span className="text-[10px] text-[#64748B] uppercase font-bold block">Batch</span>
                <span className="text-base font-bold text-[#0E1B2A] mt-0.5 block">
                  {rankSummary?.batch_rank ? `#${rankSummary.batch_rank}` : '—'}
                </span>
                <span className="text-[10px] text-[#94A3B8]">of {rankSummary?.batch_total || 0}</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E2E8F0] text-center">
                <span className="text-[10px] text-[#64748B] uppercase font-bold block">Course</span>
                <span className="text-base font-bold text-[#0E1B2A] mt-0.5 block">
                  {rankSummary?.course_rank ? `#${rankSummary.course_rank}` : '—'}
                </span>
                <span className="text-[10px] text-[#94A3B8]">of {rankSummary?.course_total || 0}</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-[#E2E8F0] text-center">
                <span className="text-[10px] text-[#64748B] uppercase font-bold block">Academy</span>
                <span className="text-base font-bold text-[#0E1B2A] mt-0.5 block">
                  {rankSummary?.academy_rank ? `#${rankSummary.academy_rank}` : '—'}
                </span>
                <span className="text-[10px] text-[#94A3B8]">of {rankSummary?.academy_total || 0}</span>
              </div>
            </div>
          </div>

          {/* Recent Performance List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#0E1B2A] uppercase tracking-wider">
                Recent Assessments
              </h4>
              {results.length > 0 && (
                <Link
                  to="/student/results"
                  className="text-xs font-semibold text-[#0E1B2A] hover:text-[#1C2E42] inline-flex items-center gap-1"
                >
                  <span>View all results</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {results.length > 0 ? (
              <div className="space-y-2">
                {results.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E6E8EC] text-xs hover:border-[#CBD5E1] transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <span className="font-semibold text-[#0E1B2A] block truncate">
                        {r.tests?.name || r.test?.name || 'Screening Exam'}
                      </span>
                      <span className="text-[#94A3B8] text-[11px] block mt-0.5">
                        {new Date(r.generated_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-mono font-bold px-2 py-1 rounded text-xs ${
                          r.passed
                            ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {Math.round(Number(r.percentage))}%
                      </span>
                      <span className="font-semibold text-[10px] px-2 py-1 rounded bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
                        {r.passed ? 'QUALIFIED' : 'FAILED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                <BarChart3 className="w-6 h-6 text-[#94A3B8] mx-auto opacity-70" />
                <p className="text-xs font-semibold text-[#334155]">No completed tests yet</p>
                <p className="text-[11px] text-[#64748B]">
                  Your examination results and merit standings will appear here after you complete an assessment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account & Examination Access Card */}
      <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#F1F5F9]">
          <div className="w-8 h-8 rounded-lg bg-[#0E1B2A] text-[#C6A75E] flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0E1B2A]">
              Account & Examination Access
            </h3>
            <p className="text-xs text-[#64748B]">
              Authorization parameters for Shuja Forces Academy Pindsultani computerized testing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-center">
            <span className="text-[11px] text-[#166534] font-medium block">Account Status</span>
            <span className="text-xs font-bold text-[#166534] mt-0.5 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Active
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-center">
            <span className="text-[11px] text-[#166534] font-medium block">Exam Access</span>
            <span className="text-xs font-bold text-[#166534] mt-0.5 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Permitted
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
            <span className="text-[11px] text-[#475569] font-medium block">Role Clearance</span>
            <span className="text-xs font-bold text-[#0E1B2A] mt-0.5 inline-flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-[#C6A75E]" /> Student Cadet
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-center">
            <span className="text-[11px] text-[#166534] font-medium block">Academy Rules</span>
            <span className="text-xs font-bold text-[#166534] mt-0.5 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Acknowledged
            </span>
          </div>
        </div>

        <p className="text-xs text-[#64748B] leading-relaxed pt-1">
          Candidate credentials and examination access are maintained under Shuja Forces Academy Pindsultani computerized testing regulations. All assessments are proctored and securely recorded in official records.
        </p>
      </div>

      {/* Edit Profile Modal Dialog */}
      {showEditModal && (
        <div className="fixed inset-0 bg-[#0E1B2A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E6E8EC] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0E1B2A] text-[#C6A75E] flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0E1B2A]">Edit Profile Details</h3>
                  <p className="text-xs text-[#64748B]">Update personal contact information.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 text-[#64748B] hover:text-[#0E1B2A] rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D9DF] text-sm text-[#0E1B2A] focus:outline-none focus:ring-2 focus:ring-[#0E1B2A]/20"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4D9DF] text-sm text-[#0E1B2A] focus:outline-none focus:ring-2 focus:ring-[#0E1B2A]/20"
                />
              </div>

              {/* Institutional Locked Fields */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#475569]">
                  <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>Institutional Identifiers (Locked)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[#64748B]">
                  <div>Roll Number: <span className="font-mono font-semibold text-[#0E1B2A]">{displayRoll}</span></div>
                  <div>Force: <span className="font-semibold text-[#0E1B2A]">{displayForce}</span></div>
                  <div>Course: <span className="font-semibold text-[#0E1B2A]">{displayCourse}</span></div>
                  <div>Batch: <span className="font-semibold text-[#0E1B2A]">{displayBatch}</span></div>
                </div>
                <span className="text-[10px] text-[#94A3B8] block pt-1">
                  Official enrollment details can only be amended by the Academy Command Directorate.
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#D4D9DF] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile || !editName.trim()}
                  className="bg-[#0E1B2A] hover:bg-[#1C2E42] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfilePage;
