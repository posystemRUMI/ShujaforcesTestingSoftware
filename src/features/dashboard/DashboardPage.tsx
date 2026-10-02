import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileQuestion,
  TrendingUp,
  RefreshCw,
  Printer,
  BookOpen,
  Wallet,
  Receipt,
  ArrowUpRight,
  Building,
  CreditCard,
  Banknote,
  AlertCircle,
  Award,
} from 'lucide-react';
import {
  MetricCard,
  StatusBadge,
  ForceBadge,
  Avatar,
  PageHeader,
} from '@/components/ui';
import { useAuth } from '@/app/providers';
import { financeService } from '@/services/financeService';
import { studentService } from '@/services/studentService';
import { testService } from '@/services/testService';
import { questionService } from '@/services/questionService';
import { teacherService } from '@/services/teacherService';
import type { FinanceSummary, FinanceTransaction } from '@/types/finance.types';
import { toast } from 'sonner';

interface RecentSubmission {
  id: string;
  cadetName: string;
  avatarText: string;
  center: string;
  rollNumber: string;
  testTitle: string;
  subTitle: string;
  branch: 'PAKISTAN_ARMY' | 'PAKISTAN_AIR_FORCE' | 'PAKISTAN_NAVY';
  scorePercent: number;
  scoreText: string;
  passed: boolean;
  timestamp: string;
  relativeTime: string;
  critical?: boolean;
}

const RECENT_SUBMISSIONS: RecentSubmission[] = [];

export const DashboardPage: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);
  const [loadingFinance, setLoadingFinance] = useState<boolean>(false);

  const [studentCount, setStudentCount] = useState<number>(0);
  const [testCount, setTestCount] = useState<number>(0);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [teacherCount, setTeacherCount] = useState<number>(0);
  const [armyStudentCount, setArmyStudentCount] = useState<number>(0);
  const [pafStudentCount, setPafStudentCount] = useState<number>(0);
  const [navyStudentCount, setNavyStudentCount] = useState<number>(0);

  const loadFinanceData = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingFinance(true);
    try {
      const [summary, transactions] = await Promise.all([
        financeService.getFinanceSummary(),
        financeService.getFinanceTransactions(),
      ]);
      setFinanceSummary(summary);
      setFinanceTransactions(transactions.slice(0, 5));
    } catch (err) {
      console.warn('Finance data load:', err);
    } finally {
      setLoadingFinance(false);
    }
  }, [isAdmin]);

  const loadDashboardMetrics = useCallback(async () => {
    if (isAdmin) {
      loadFinanceData();
    }
    try {
      const [students, tests, questions, teachers] = await Promise.all([
        studentService.getStudents().catch(() => []),
        testService.getTests().catch(() => []),
        questionService.getQuestions().catch(() => []),
        teacherService.getTeachers().catch(() => []),
      ]);

      setStudentCount(students.length);
      setTestCount(tests.length);
      setQuestionCount(questions.length);
      setTeacherCount(teachers.length);

      const isArmy = (b?: string) => Boolean(b && (b.toUpperCase().includes('ARMY') || b.toUpperCase().includes('PMA')));
      const isPaf = (b?: string) => Boolean(b && (b.toUpperCase().includes('AIR') || b.toUpperCase().includes('PAF') || b.toUpperCase().includes('GDP')));
      const isNavy = (b?: string) => Boolean(b && (b.toUpperCase().includes('NAVY') || b.toUpperCase().includes('SAILOR') || b.toUpperCase().includes('PN')));

      setArmyStudentCount(students.filter((s) => isArmy(s.branch)).length);
      setPafStudentCount(students.filter((s) => isPaf(s.branch)).length);
      setNavyStudentCount(students.filter((s) => isNavy(s.branch)).length);
    } catch (err) {
      console.warn('Dashboard metrics load error:', err);
    }
  }, [isAdmin, loadFinanceData]);

  useEffect(() => {
    loadDashboardMetrics();
  }, [loadDashboardMetrics]);

  const filteredSubmissions = RECENT_SUBMISSIONS.filter((s) => {
    if (selectedBranch === 'ALL') return true;
    return s.branch === selectedBranch;
  });

  const handleSyncFeed = () => {
    loadDashboardMetrics();
    toast.success('Dashboard feeds refreshed');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Shuja Forces Academy Pindsultani · Overview & recent activity"
        breadcrumbs={[{ label: 'Dashboard' }]}
        badge={
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B]">
            <span className="w-2 h-2 rounded-full bg-[#234E35] mr-1.5 animate-pulse" />
            System Online
          </span>
        }
        actions={
          <button
            type="button"
            onClick={handleSyncFeed}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#0E1B2A] text-white rounded-lg text-sm font-semibold hover:bg-[#1A2C42] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0E1B2A] focus:ring-offset-1"
          >
            <RefreshCw className={`w-4 h-4 ${loadingFinance ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Financial Health & Cash Flow Overview (Admin Access) */}
      {isAdmin && (
        <div className="space-y-5 bg-[#FBFBFC] border border-[#E2E6EB] p-5 sm:p-6 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E6EB] pb-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0E1B2A] text-[#C6A75E] flex items-center justify-center font-bold">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-[#0E1B2A] font-display flex items-center gap-2">
                    Financial Health & Cash Flow
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B]">
                      Real-Time Ledger
                    </span>
                  </h2>
                  <p className="text-[13px] text-[#64748B]">
                    Real-time fee collections, operating expenses, and net cash balance
                  </p>
                </div>
              </div>
            </div>
            <Link
              to="/admin/finance"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0E1B2A] border border-[#E2E6EB] shadow-sm transition-colors group"
            >
              <span>Open Finance Ledger</span>
              <ArrowUpRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0E1B2A] transition-colors" />
            </Link>
          </div>

          {/* 4 Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <MetricCard
              title="Fees Collected"
              value={`PKR ${(financeSummary?.fees_collected || 0).toLocaleString()}`}
              icon={<Wallet className="w-5 h-5 text-[#234E35]" />}
              trend={{ value: 'Collected', direction: 'up' }}
              subtext="Cadet tuition & admission dues"
            />
            <MetricCard
              title="Outstanding Dues"
              value={`PKR ${(financeSummary?.outstanding_fees || 0).toLocaleString()}`}
              icon={<AlertCircle className="w-5 h-5 text-[#7A5312]" />}
              subtext="Pending student fee balances"
              highlight={(financeSummary?.outstanding_fees || 0) > 0}
            />
            <MetricCard
              title="Operational Expenses"
              value={`PKR ${(financeSummary?.total_expenses || 0).toLocaleString()}`}
              icon={<Receipt className="w-5 h-5 text-[#782525]" />}
              subtext={`Salaries: PKR ${(financeSummary?.salary_expenses || 0).toLocaleString()}`}
            />
            <MetricCard
              title="Net Cash Flow"
              value={`PKR ${(financeSummary?.net_cash_flow || 0).toLocaleString()}`}
              icon={<TrendingUp className="w-5 h-5 text-[#0E1B2A]" />}
              trend={{
                value: (financeSummary?.net_cash_flow || 0) >= 0 ? '+Surplus' : '-Deficit',
                direction: (financeSummary?.net_cash_flow || 0) >= 0 ? 'up' : 'down',
              }}
              subtext="Current net operating balance"
            />
          </div>

          {/* 2-Column Finance Breakdown & Recent Ledger Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Recent Financial Ledger Activity */}
            <div className="lg:col-span-8 bg-white border border-[#E2E6EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col justify-between">
              <div className="px-5 py-3.5 border-b border-[#F1F5F9] flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-[14.5px] font-semibold text-[#0E1B2A] font-display">
                    Recent Financial Activity
                  </h3>
                  <p className="text-[12px] text-[#64748B]">Latest fee payments and expense vouchers</p>
                </div>
                <Link
                  to="/admin/finance"
                  className="text-[12.5px] font-semibold text-[#0E1B2A] hover:underline"
                >
                  View All &rarr;
                </Link>
              </div>

              <div className="overflow-x-auto flex-1">
                {financeTransactions.length === 0 ? (
                  <div className="py-8 text-center text-[#64748B] text-[13px]">
                    <CreditCard className="w-8 h-8 text-[#94A3B8] mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-[#0E1B2A]">No financial transactions recorded this period</p>
                    <p className="text-[12px] text-[#64748B] mt-0.5">Use the Finance module to record fees, salaries, or utility expenses.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="bg-[#F8FAFC] text-[#475569] font-semibold text-[11.5px] border-b border-[#E2E6EB]">
                      <tr>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-3">Entity / Payee</th>
                        <th className="py-2.5 px-3">Receipt / Ref</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {financeTransactions.map((tx) => (
                        <tr key={tx.transaction_id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  tx.transaction_type === 'INCOME' ? 'bg-[#234E35]' : 'bg-[#782525]'
                                }`}
                              />
                              <span className="font-semibold text-[#0E1B2A]">{tx.category_name}</span>
                            </div>
                            <span className="text-[11px] text-[#64748B] ml-4 block">{tx.description}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#374151]">
                            {tx.party_name || 'Academy Staff'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748B]">
                            {tx.receipt_number || tx.reference_number || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            <span
                              className={`font-bold ${
                                tx.transaction_type === 'INCOME' ? 'text-[#234E35]' : 'text-[#782525]'
                              }`}
                            >
                              {tx.transaction_type === 'INCOME' ? '+' : '-'} PKR {Number(tx.amount || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold ${
                                tx.status === 'VOID'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right text-[11.5px] text-[#64748B] tabular-nums">
                            {tx.date ? new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right: Quick Budget Distribution & Shortcuts */}
            <div className="lg:col-span-4 bg-white border border-[#E2E6EB] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-4">
              <div className="border-b border-[#F1F5F9] pb-3">
                <h3 className="text-[14.5px] font-semibold text-[#0E1B2A] font-display">
                  Operational Distribution
                </h3>
                <p className="text-[12px] text-[#64748B]">Breakdown of outgoing operational costs</p>
              </div>

              <div className="space-y-3.5 flex-1">
                {/* Salaries */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#374151] font-medium flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#0E1B2A]" /> Instructor Salaries
                    </span>
                    <span className="font-semibold text-[#0E1B2A] tabular-nums">
                      PKR {(financeSummary?.salary_expenses || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#EDF1F5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0E1B2A] rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          financeSummary?.total_expenses
                            ? ((financeSummary.salary_expenses || 0) / financeSummary.total_expenses) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Rent */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#374151] font-medium flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#455D4A]" /> Campus & Hostel Rent
                    </span>
                    <span className="font-semibold text-[#0E1B2A] tabular-nums">
                      PKR {(financeSummary?.rent_expenses || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#EDF1F5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#455D4A] rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          financeSummary?.total_expenses
                            ? ((financeSummary.rent_expenses || 0) / financeSummary.total_expenses) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Utilities */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#374151] font-medium flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-[#C6A75E]" /> Utilities & Drills
                    </span>
                    <span className="font-semibold text-[#0E1B2A] tabular-nums">
                      PKR {(financeSummary?.utility_expenses || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#EDF1F5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C6A75E] rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          financeSummary?.total_expenses
                            ? ((financeSummary.utility_expenses || 0) / financeSummary.total_expenses) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] grid grid-cols-2 gap-2">
                <Link
                  to="/admin/finance"
                  className="px-3 py-2 text-center text-[12px] font-semibold rounded-lg bg-[#0E1B2A] text-white hover:bg-[#1A2C42] transition-colors"
                >
                  Fee Collection
                </Link>
                <Link
                  to="/admin/finance"
                  className="px-3 py-2 text-center text-[12px] font-semibold rounded-lg bg-[#F4F6F9] hover:bg-[#EAECF0] text-[#0E1B2A] border border-[#E2E6EB] transition-colors"
                >
                  Record Expense
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5-Column Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <MetricCard
          title="Enrolled Students"
          value={studentCount}
          icon={<Users className="w-5 h-5" />}
          subtext="Active cadet roster"
        />
        <MetricCard
          title="Active Tests"
          value={testCount}
          icon={<FileQuestion className="w-5 h-5 text-[#C6A75E]" />}
          subtext="Published CBT batteries"
          highlight={testCount > 0}
        />
        <MetricCard
          title="Item Bank Questions"
          value={questionCount}
          icon={<BookOpen className="w-5 h-5 text-[#234E35]" />}
          subtext="Validated question items"
        />
        <MetricCard
          title="Faculty Officers"
          value={teacherCount}
          icon={<Award className="w-5 h-5 text-sky-600" />}
          subtext="Accredited examiners"
        />
        <MetricCard
          title="Official Courses"
          value={5}
          icon={<Building className="w-5 h-5 text-[#0E1B2A]" />}
          subtext="Army, PAF & Navy tracks"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 30-Day Score Trend */}
        <div className="lg:col-span-8 bg-white border border-[#E2E6EB] rounded-lg p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F1F5F9] pb-4 gap-2">
            <div>
              <h3 className="text-[15px] font-semibold text-[#0E1B2A] font-display">
                30-Day Score Trend
              </h3>
              <p className="text-[13px] text-[#64748B] mt-0.5">Academy score progression vs. standard pass threshold</p>
            </div>
            <span className="px-2.5 py-1 rounded-md font-sans text-[12px] font-semibold tabular-nums bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B]">
              Pass threshold: 60%
            </span>
          </div>

          {/* SVG Chart */}
          <div className="relative w-full h-56 select-none">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 760 220">
              <defs>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#455D4A" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#455D4A" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line stroke="#F1F5F9" strokeWidth="1" x1="0" x2="760" y1="30" y2="30" />
              <line stroke="#F1F5F9" strokeWidth="1" x1="0" x2="760" y1="80" y2="80" />
              <line stroke="#F1F5F9" strokeWidth="1" x1="0" x2="760" y1="130" y2="130" />
              <line stroke="#F1F5F9" strokeWidth="1" x1="0" x2="760" y1="180" y2="180" />

              {/* Pass Threshold Line (60%) */}
              <line stroke="#C6A75E" strokeDasharray="5,4" strokeWidth="1.5" x1="0" x2="760" y1="140" y2="140" />
              <text className="font-sans text-[10px]" fill="#A37E2C" x="10" y="135">
                Pass threshold (60%)
              </text>
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between items-center text-[#94A3B8] font-sans tabular-nums text-[12px] pt-2">
              <span>Cohort Base</span>
              <span>Intake Stage 1</span>
              <span>Intake Stage 2</span>
              <span>Mid Term</span>
              <span>Final Exam</span>
              <span className="text-[#234E35] font-semibold">Active Cycle</span>
            </div>
          </div>

          {/* Footer Micro-Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#F1F5F9] bg-[#F8FAFC] p-4 rounded-lg text-center">
            <div>
              <span className="text-[12px] text-[#64748B]">Enrolled Cadets</span>
              <div className="text-[14px] font-bold text-[#0E1B2A] font-display mt-0.5">
                {studentCount}
              </div>
            </div>
            <div>
              <span className="text-[12px] text-[#64748B]">Active Test Batteries</span>
              <div className="text-[14px] font-bold text-[#0E1B2A] font-display mt-0.5">
                {testCount}
              </div>
            </div>
            <div>
              <span className="text-[12px] text-[#64748B]">Item Bank Questions</span>
              <div className="text-[14px] font-bold text-[#234E35] font-display mt-0.5">
                {questionCount}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Enrolled Candidates by Branch */}
        <div className="lg:col-span-4 bg-white border border-[#E2E6EB] rounded-lg p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col justify-between space-y-4">
          <div className="border-b border-[#F1F5F9] pb-4">
            <h3 className="text-[15px] font-semibold text-[#0E1B2A] font-display">
              Enrolled Candidates by Branch
            </h3>
            <p className="text-[13px] text-[#64748B] mt-0.5">Current active intake breakdown</p>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {/* Army */}
            <div className="p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#0E1B2A] text-white flex items-center justify-center font-sans text-[11px] font-bold">
                    PA
                  </div>
                  <div>
                    <span className="text-[13.5px] font-semibold text-[#0E1B2A]">Pakistan Army</span>
                    <span className="text-[12px] text-[#64748B] block tabular-nums">{armyStudentCount} students</span>
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <span className="text-[14px] font-bold text-[#234E35]">
                    {studentCount > 0 ? `${Math.round((armyStudentCount / studentCount) * 100)}%` : '0%'}
                  </span>
                  <span className="text-[11px] text-[#64748B] block">of intake</span>
                </div>
              </div>
              <div className="w-full h-2 bg-[#EDF1F5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#455D4A] rounded-full transition-all"
                  style={{ width: `${studentCount > 0 ? (armyStudentCount / studentCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* PAF */}
            <div className="p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#153250] text-white flex items-center justify-center font-sans text-[11px] font-bold">
                    PAF
                  </div>
                  <div>
                    <span className="text-[13.5px] font-semibold text-[#0E1B2A]">Pakistan Air Force</span>
                    <span className="text-[12px] text-[#64748B] block tabular-nums">{pafStudentCount} students</span>
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <span className="text-[14px] font-bold text-[#0E1B2A]">
                    {studentCount > 0 ? `${Math.round((pafStudentCount / studentCount) * 100)}%` : '0%'}
                  </span>
                  <span className="text-[11px] text-[#64748B] block">of intake</span>
                </div>
              </div>
              <div className="w-full h-2 bg-[#EDF1F5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0E1B2A] rounded-full transition-all"
                  style={{ width: `${studentCount > 0 ? (pafStudentCount / studentCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Navy */}
            <div className="p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#0A2540] text-white flex items-center justify-center font-sans text-[11px] font-bold">
                    PN
                  </div>
                  <div>
                    <span className="text-[13.5px] font-semibold text-[#0E1B2A]">Pakistan Navy</span>
                    <span className="text-[12px] text-[#64748B] block tabular-nums">{navyStudentCount} students</span>
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <span className="text-[14px] font-bold text-[#234E35]">
                    {studentCount > 0 ? `${Math.round((navyStudentCount / studentCount) * 100)}%` : '0%'}
                  </span>
                  <span className="text-[11px] text-[#64748B] block">of intake</span>
                </div>
              </div>
              <div className="w-full h-2 bg-[#EDF1F5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#455D4A] rounded-full transition-all"
                  style={{ width: `${studentCount > 0 ? (navyStudentCount / studentCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <Link
            to="/admin/students"
            className="w-full h-10 bg-[#F4F6F9] hover:bg-[#EAECF0] text-[#0E1B2A] rounded-lg text-[13.5px] font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Manage Enrolled Cadets</span>
          </Link>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-white border border-[#E2E6EB] rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-6 py-4 border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h3 className="text-[15px] font-semibold text-[#0E1B2A] font-display">
              Recent Submissions
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-[13px] bg-white border border-[#E2E6EB] rounded-lg px-3 py-2 font-sans text-[#374151] focus:outline-none focus:border-[#0E1B2A] hover:border-[#B0B8C4] transition-colors"
            >
              <option value="ALL">All branches</option>
              <option value="PAKISTAN_ARMY">Pakistan Army</option>
              <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option>
              <option value="PAKISTAN_NAVY">Pakistan Navy</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F4F6F9] text-[#374151] font-semibold text-[12px] border-b border-[#E2E6EB]">
              <tr>
                <th className="py-3.5 px-5">Student</th>
                <th className="py-3.5 px-4">Roll No.</th>
                <th className="py-3.5 px-4">Test</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4 text-right">Score</th>
                <th className="py-3.5 px-4 text-center">Result</th>
                <th className="py-3.5 px-4">Time</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#64748B]">
                    No recent examination submissions recorded.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-[#F8FAFC] transition-colors ${
                      row.critical ? 'bg-red-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center space-x-3">
                        <Avatar size="sm" fallbackText={row.avatarText} />
                        <div>
                          <div className="font-semibold text-[#0E1B2A]">{row.cadetName}</div>
                          <div className="text-[12px] text-[#64748B]">{row.center}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#374151] text-[12px]">
                      {row.rollNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#0E1B2A]">{row.testTitle}</div>
                      <div className="text-[12px] text-[#64748B]">{row.subTitle}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <ForceBadge branch={row.branch} compact />
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums">
                      <span
                        className={`font-bold text-[14px] ${
                          row.passed ? 'text-[#234E35]' : 'text-[#782525]'
                        }`}
                      >
                        {row.scorePercent}%
                      </span>
                      <span className="block text-[12px] text-[#64748B]">{row.scoreText}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={row.passed ? 'pass' : 'fail'} />
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-[#64748B]">
                      <div className="text-[13px]">{row.timestamp}</div>
                      <span className="text-[12px] text-[#94A3B8]">{row.relativeTime}</span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => toast.info(`Viewing result for ${row.cadetName}`)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-[12.5px] font-semibold rounded-lg bg-[#F4F6F9] hover:bg-[#EAECF0] text-[#0E1B2A] border border-[#E2E6EB] transition-colors"
                          title="View result"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#234E35]" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toast.info(`Printing transcript: ${row.rollNumber}`)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0E1B2A] hover:bg-[#F4F6F9] transition-colors"
                          title="Print transcript"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
