import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileQuestion,
  TrendingUp,
  RefreshCw,
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
  PageHeader,
} from '@/components/ui';
import { useAuth } from '@/app/providers';
import { financeService } from '@/services/financeService';
import { studentService } from '@/services/studentService';
import { testService } from '@/services/testService';
import { questionService } from '@/services/questionService';
import { teacherService } from '@/services/teacherService';
import { TeacherSalaryPanel } from './TeacherSalaryPanel';
import type { FinanceSummary, FinanceTransaction } from '@/types/finance.types';
import { toast } from 'sonner';

export const DashboardPage: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';
  const [salaryRefreshKey, setSalaryRefreshKey] = useState(0);

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

  const handleSyncFeed = () => {
    setSalaryRefreshKey(k => k + 1);
    loadDashboardMetrics();
    toast.success('Dashboard feeds refreshed');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
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

      {role === 'TEACHER' && <TeacherSalaryPanel refreshKey={salaryRefreshKey} />}

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
            />
            <MetricCard
              title="Outstanding Dues"
              value={`PKR ${(financeSummary?.outstanding_fees || 0).toLocaleString()}`}
              icon={<AlertCircle className="w-5 h-5 text-[#7A5312]" />}
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
        />
        <MetricCard
          title="Active Tests"
          value={testCount}
          icon={<FileQuestion className="w-5 h-5 text-[#C6A75E]" />}
          highlight={testCount > 0}
        />
        <MetricCard
          title="Item Bank Questions"
          value={questionCount}
          icon={<BookOpen className="w-5 h-5 text-[#234E35]" />}
        />
        <MetricCard
          title="Faculty Officers"
          value={teacherCount}
          icon={<Award className="w-5 h-5 text-sky-600" />}
        />
        <MetricCard
          title="Official Courses"
          value={5}
          icon={<Building className="w-5 h-5 text-[#0E1B2A]" />}
        />
      </div>

      {/* Enrolled Candidates by Branch */}
      <div className="w-full">
        {/* Branch Summary */}
        <div className="bg-white border border-[#E2E6EB] rounded-lg p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col justify-between space-y-4">
          <div className="border-b border-[#F1F5F9] pb-4">
            <h3 className="text-[15px] font-semibold text-[#0E1B2A] font-display">
              Enrolled Candidates by Branch
            </h3>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
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

    </div>
  );
};

export default DashboardPage;
