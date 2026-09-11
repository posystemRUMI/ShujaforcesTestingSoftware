import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Search,
  Plus,
  Receipt,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Building2,
  Zap,
  GraduationCap,
  ShieldCheck,
  XCircle,
  RefreshCw,
  Printer,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import { financeService } from '@/services/financeService';
import type {
  FinanceSummary,
  StudentSearchResult,
  StudentFeeAccount,
  StudentFeePayment,
  FinanceExpense,
  TeacherSalaryPayment,
  TeacherDropdownItem,
  FinanceTransaction,
  StudentFeeOverviewItem,
  PaymentMethod,
  SalaryPaymentType,
} from '@/types/finance.types';
import { PrintableFeeReceipt } from './components/PrintableFeeReceipt';

const COLORS = ['#0E1B2A', '#D97706', '#10B981', '#3B82F6', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'];

const formatPKR = (val?: number | null) => {
  return `Rs. ${(val || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fee-collection' | 'expenses' | 'salaries' | 'ledger'>('overview');
  const [loading, setLoading] = useState(true);

  // Overview Data
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [dateRange, setDateRange] = useState<'this-month' | 'last-30' | 'this-year' | 'all'>('this-month');

  // Fee Collection Tab Data
  const [allStudentsOverview, setAllStudentsOverview] = useState<StudentFeeOverviewItem[]>([]);
  const [loadingAllStudents, setLoadingAllStudents] = useState(false);
  const [feeStatusFilter, setFeeStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'PARTIAL'>('ALL');
  const [searchCadetQuery, setSearchCadetQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [studentAccounts, setStudentAccounts] = useState<StudentFeeAccount[]>([]);
  const [studentPayments, setStudentPayments] = useState<StudentFeePayment[]>([]);
  const [loadingStudentData, setLoadingStudentData] = useState(false);

  // Modals & Action States
  const [activeAccountForPayment, setActiveAccountForPayment] = useState<StudentFeeAccount | null>(null);
  const [activeAccountForAdjust, setActiveAccountForAdjust] = useState<StudentFeeAccount | null>(null);
  const [activeAccountForWaive, setActiveAccountForWaive] = useState<StudentFeeAccount | null>(null);
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);
  const [isRecordSalaryOpen, setIsRecordSalaryOpen] = useState(false);
  const [isGenerateFeesOpen, setIsGenerateFeesOpen] = useState(false);
  const [printableData, setPrintableData] = useState<{
    isOpen: boolean;
    account: StudentFeeAccount | null;
    payment: StudentFeePayment | null;
    student: StudentSearchResult | null;
  }>({
    isOpen: false,
    account: null,
    payment: null,
    student: null,
  });

  // Expenses Tab Data
  const [expenses, setExpenses] = useState<FinanceExpense[]>([]);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // Salaries Tab Data
  const [salaries, setSalaries] = useState<TeacherSalaryPayment[]>([]);
  const [teachersList, setTeachersList] = useState<TeacherDropdownItem[]>([]);
  const [salaryMonth, setSalaryMonth] = useState<number>(new Date().getMonth() + 1);
  const [salaryYear, setSalaryYear] = useState<number>(new Date().getFullYear());
  const [loadingSalaries, setLoadingSalaries] = useState(false);

  // Ledger Tab Data
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>('ALL');
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Initial Load
  useEffect(() => {
    loadSummary();
    loadTeachers();
  }, [dateRange]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let start: string | undefined;
      let end: string | undefined;

      if (dateRange === 'this-month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      } else if (dateRange === 'last-30') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        start = d.toISOString().split('T')[0];
        end = now.toISOString().split('T')[0];
      } else if (dateRange === 'this-year') {
        start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      }

      const res = await financeService.getFinanceSummary(start, end);
      setSummary(res);
    } catch (err: any) {
      console.error(err);
      toast.error('Error fetching financial overview: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await financeService.getTeachersForSalaryDropdown();
      setTeachersList(res);
    } catch (e) {
      console.error('Failed to load teachers for dropdown', e);
    }
  };

  const loadAllStudentsOverview = async () => {
    setLoadingAllStudents(true);
    try {
      const res = await financeService.getAllStudentsFeeOverview();
      setAllStudentsOverview(res);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load student fee overview: ' + (e.message || ''));
    } finally {
      setLoadingAllStudents(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return allStudentsOverview.filter((s) => {
      if (feeStatusFilter !== 'ALL') {
        if (feeStatusFilter === 'PAID' && s.status !== 'PAID') return false;
        if (feeStatusFilter === 'UNPAID' && s.status !== 'UNPAID') return false;
        if (feeStatusFilter === 'PARTIAL' && s.status !== 'PARTIAL') return false;
      }
      if (searchCadetQuery.trim()) {
        const q = searchCadetQuery.toLowerCase().trim();
        const matchesName = s.display_name.toLowerCase().includes(q);
        const matchesRoll = s.roll_number.toLowerCase().includes(q);
        const matchesFather = s.father_name ? s.father_name.toLowerCase().includes(q) : false;
        const matchesCourse = s.course_name ? s.course_name.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesRoll && !matchesFather && !matchesCourse) return false;
      }
      return true;
    });
  }, [allStudentsOverview, feeStatusFilter, searchCadetQuery]);

  // Load Tab Specific Data
  useEffect(() => {
    if (activeTab === 'fee-collection') loadAllStudentsOverview();
    if (activeTab === 'expenses') loadExpenses();
    if (activeTab === 'salaries') loadSalaries();
    if (activeTab === 'ledger') loadLedger();
  }, [activeTab, expenseCategoryFilter, salaryMonth, salaryYear, ledgerTypeFilter]);

  const loadExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const res = await financeService.getExpenses({
        category: expenseCategoryFilter === 'ALL' ? undefined : expenseCategoryFilter,
      });
      setExpenses(res);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load expenses');
    } finally {
      setLoadingExpenses(false);
    }
  };

  const loadSalaries = async () => {
    setLoadingSalaries(true);
    try {
      const res = await financeService.getTeacherSalaryPayments(salaryYear, salaryMonth);
      setSalaries(res);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load salaries');
    } finally {
      setLoadingSalaries(false);
    }
  };

  const loadLedger = async () => {
    setLoadingLedger(true);
    try {
      const res = await financeService.getFinanceTransactions(
        undefined,
        undefined,
        ledgerTypeFilter === 'ALL' ? undefined : ledgerTypeFilter,
      );
      setTransactions(res);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load ledger');
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleSelectStudent = async (student: StudentSearchResult) => {
    setSelectedStudent(student);
    setSearchCadetQuery('');
    setLoadingStudentData(true);
    try {
      const [accRes, payRes] = await Promise.all([
        financeService.getStudentFeeAccounts(student.id),
        financeService.getStudentFeePayments(student.id),
      ]);
      setStudentAccounts(accRes);
      setStudentPayments(payRes);
    } catch (e: any) {
      toast.error('Failed to load cadet fee records: ' + (e.message || ''));
    } finally {
      setLoadingStudentData(false);
    }
  };

  // Void Payment
  const handleVoidPayment = async (payment: StudentFeePayment) => {
    const reason = window.prompt(`Please enter reason for VOIDING receipt ${payment.receipt_number}:`);
    if (!reason || !reason.trim()) {
      toast.info('Void operation cancelled: A valid reason is required.');
      return;
    }
    try {
      await financeService.voidStudentFeePayment(payment.id, reason.trim());
      toast.success(`Payment ${payment.receipt_number} voided successfully`);
      if (selectedStudent) {
        handleSelectStudent(selectedStudent);
      }
      loadSummary();
    } catch (err: any) {
      toast.error(err.message || 'Failed to void payment');
    }
  };

  // Void Expense
  const handleVoidExpense = async (expense: FinanceExpense) => {
    const reason = window.prompt(`Enter reason for VOIDING expense "${expense.title}":`);
    if (!reason || !reason.trim()) {
      toast.info('Void operation cancelled: Reason is mandatory.');
      return;
    }
    try {
      await financeService.voidExpense(expense.id, reason.trim());
      toast.success(`Expense voided successfully`);
      loadExpenses();
      loadSummary();
    } catch (err: any) {
      toast.error(err.message || 'Failed to void expense');
    }
  };

  // Export Ledger to CSV
  const handleExportLedgerCSV = () => {
    if (!transactions.length) {
      toast.info('No transactions to export.');
      return;
    }
    const headers = ['Date', 'Reference/Receipt', 'Type', 'Category', 'Description', 'Party', 'Method', 'Amount (PKR)', 'Status'];
    const rows = transactions.map((t) => [
      t.date,
      t.receipt_number || t.reference_number || '',
      t.transaction_type,
      t.category_name || t.category,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${(t.party_name || '').replace(/"/g, '""')}"`,
      t.payment_method,
      t.amount,
      t.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SFA_Finance_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Financial ledger exported to CSV');
  };

  // Chart Data Preparation
  const chartBarData = useMemo(() => {
    if (!summary) return [];
    return [
      {
        name: 'Financial Cash Flow',
        Inflow: summary.fees_collected,
        Outflow: summary.total_expenses,
      },
    ];
  }, [summary]);

  const pieCategoryData = useMemo(() => {
    if (!summary) return [];
    const items = [
      { name: 'Teacher Salaries', value: summary.salary_expenses },
      { name: 'Building Rent', value: summary.rent_expenses },
      { name: 'Utilities', value: summary.utility_expenses },
      { name: 'General Ops', value: summary.other_expenses },
    ].filter((item) => item.value > 0);
    return items;
  }, [summary]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#0E1B2A] text-amber-400 rounded-lg shadow-sm">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#0E1B2A]">
                Finance & Accounts Management
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Shuja Forces Academy Pindsultani • Authoritative Double-Entry Financial Control
              </p>
            </div>
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-[#0E1B2A] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('fee-collection')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'fee-collection'
                ? 'bg-white text-[#0E1B2A] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cadet Fees
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'expenses'
                ? 'bg-white text-[#0E1B2A] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('salaries')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'salaries'
                ? 'bg-white text-[#0E1B2A] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Salaries
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === 'ledger'
                ? 'bg-white text-[#0E1B2A] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Master Ledger
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        loading ? (
          <div className="bg-white rounded-xl p-16 text-center text-slate-400 text-xs flex items-center justify-center space-x-2 border border-slate-200 shadow-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
            <span className="font-semibold text-slate-600">Loading financial overview...</span>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Period Filter & Quick Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Financial Period:</span>
              <select
                value={dateRange}
                onChange={(e: any) => setDateRange(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="this-month">This Month ({new Date().toLocaleString('default', { month: 'short', year: 'numeric' })})</option>
                <option value="last-30">Last 30 Days</option>
                <option value="this-year">Fiscal Year ({new Date().getFullYear()})</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setActiveTab('fee-collection');
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#0E1B2A] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Collect Fee</span>
              </button>
              <button
                onClick={() => setIsRecordExpenseOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Expense</span>
              </button>
              <button
                onClick={() => setIsRecordSalaryOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg border border-amber-300 transition-colors"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                <span>Pay Salary</span>
              </button>
              <button
                onClick={() => setIsGenerateFeesOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold rounded-lg border border-blue-300 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                <span>Generate Fees</span>
              </button>
            </div>
          </div>

          {/* Hero 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Fees Collected */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Fees Collected
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {formatPKR(summary?.fees_collected)}
                </div>
                <div className="mt-1 flex items-center text-[11px] text-emerald-600 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  <span>Cash Inflow from Cadets</span>
                </div>
              </div>
            </div>

            {/* 2. Total Outstanding Dues */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Outstanding Dues
                </span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-amber-700 font-mono">
                  {formatPKR(summary?.outstanding_fees)}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Uncollected accounts across all cadets
                </div>
              </div>
            </div>

            {/* 3. Total Expenses Paid */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Expenses Paid
                </span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {formatPKR(summary?.total_expenses)}
                </div>
                <div className="mt-1 flex items-center text-[11px] text-rose-600 font-semibold">
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  <span>Salaries, Rent, Utilities & Ops</span>
                </div>
              </div>
            </div>

            {/* 4. Net Cash Flow */}
            <div className={`p-5 rounded-xl border shadow-sm relative overflow-hidden ${
              (summary?.net_cash_flow || 0) >= 0
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-rose-50/40 border-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Net Cash Flow
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  (summary?.net_cash_flow || 0) >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {(summary?.net_cash_flow || 0) >= 0 ? 'Surplus' : 'Deficit'}
                </span>
              </div>
              <div className="mt-3">
                <div className={`text-2xl font-black font-mono ${
                  (summary?.net_cash_flow || 0) >= 0 ? 'text-emerald-800' : 'text-rose-800'
                }`}>
                  {formatPKR(summary?.net_cash_flow)}
                </div>
                <div className="mt-1 text-[11px] text-slate-600 font-medium">
                  Net Cash Surplus (Inflow - Outflow)
                </div>
              </div>
            </div>
          </div>

          {/* Sub-KPI Details Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-lg">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Faculty Payroll</span>
                <span className="font-mono font-bold text-xs text-slate-900">{formatPKR(summary?.salary_expenses)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-lg">
              <Building2 className="w-5 h-5 text-amber-600" />
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Building Rent</span>
                <span className="font-mono font-bold text-xs text-slate-900">{formatPKR(summary?.rent_expenses)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-600" />
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Campus Utilities</span>
                <span className="font-mono font-bold text-xs text-slate-900">{formatPKR(summary?.utility_expenses)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">General Operations</span>
                <span className="font-mono font-bold text-xs text-purple-800">{formatPKR(summary?.other_expenses)}</span>
              </div>
            </div>
          </div>

          {/* Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inflow vs Outflow Bar Chart */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Cash Inflow vs Outflow Comparison</h3>
                <span className="text-[11px] text-slate-500 font-mono">Current Period</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(val) => `Rs.${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: any) => formatPKR(Number(value))} />
                    <Bar dataKey="Inflow" fill="#10B981" radius={[4, 4, 0, 0]} name="Fees Collected (Inflow)" />
                    <Bar dataKey="Outflow" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expenses Paid (Outflow)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense Breakdown Donut */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Expense Allocation by Category</h3>
                <span className="text-[11px] text-slate-500 font-mono">Total {pieCategoryData.length} heads</span>
              </div>
              <div className="h-64 w-full">
                {pieCategoryData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No expense records in this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieCategoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatPKR(Number(value))} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
        )
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CADET FEE COLLECTION */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TAB 2: CADET FEE COLLECTION & MASTER DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'fee-collection' && (
        <div className="space-y-6">
          {/* Selected Cadet Detailed View */}
          {selectedStudent ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Cadet Banner Card */}
              <div className="bg-[#0E1B2A] text-white p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-lg">
                    {selectedStudent.display_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{selectedStudent.display_name}</h2>
                    <p className="text-xs text-slate-300">
                      Roll: <span className="font-mono text-amber-300 font-bold">{selectedStudent.roll_number}</span> • Father: {selectedStudent.father_name || 'N/A'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {selectedStudent.email || 'No email registered'} • Course: {selectedStudent.course_name || 'General'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentAccounts([]);
                      setStudentPayments([]);
                      loadAllStudentsOverview();
                    }}
                    className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold rounded-lg shadow-sm transition-colors flex items-center space-x-1"
                  >
                    <span>← Back to All Cadets List</span>
                  </button>
                </div>
              </div>

              {/* Fee Accounts Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Cadet Fee Accounts & Dues
                  </h3>
                  <span className="text-[11px] text-slate-500">{studentAccounts.length} active fee accounts</span>
                </div>

                {loadingStudentData ? (
                  <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                    <span>Loading fee ledger...</span>
                  </div>
                ) : studentAccounts.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No fee accounts generated for this cadet yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">Fee Head</th>
                          <th className="py-2.5 px-3">Period</th>
                          <th className="py-2.5 px-3 text-right">Base Due</th>
                          <th className="py-2.5 px-3 text-right">Discount</th>
                          <th className="py-2.5 px-3 text-right">Fine</th>
                          <th className="py-2.5 px-3 text-right">Net Payable</th>
                          <th className="py-2.5 px-3 text-right">Paid</th>
                          <th className="py-2.5 px-3 text-right">Balance</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {studentAccounts.map((acc) => {
                          const netDue = (acc.amount_due || 0) - (acc.discount_amount || 0) + (acc.fine_amount || 0);
                          const balance = Math.max(0, netDue - (acc.amount_paid || 0));

                          return (
                            <tr key={acc.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900">{acc.fee_type}</td>
                              <td className="py-3 px-3 text-slate-600">
                                {acc.fee_month ? `${acc.fee_month}/${acc.fee_year}` : acc.fee_year || 'Session'}
                              </td>
                              <td className="py-3 px-3 text-right font-mono">{formatPKR(acc.amount_due)}</td>
                              <td className="py-3 px-3 text-right font-mono text-emerald-600">
                                {acc.discount_amount > 0 ? `-${formatPKR(acc.discount_amount)}` : '—'}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-rose-600">
                                {acc.fine_amount > 0 ? `+${formatPKR(acc.fine_amount)}` : '—'}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold">{formatPKR(netDue)}</td>
                              <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">{formatPKR(acc.amount_paid)}</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-amber-700">{formatPKR(balance)}</td>
                              <td className="py-3 px-3 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-extrabold uppercase tracking-wide border ${
                                  acc.status === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : acc.status === 'PARTIAL'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : acc.status === 'WAIVED'
                                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}>
                                  {acc.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right space-x-1">
                                {acc.status !== 'PAID' && acc.status !== 'WAIVED' && (
                                  <>
                                    <button
                                      onClick={() => setActiveAccountForPayment(acc)}
                                      className="px-2.5 py-1 bg-[#0E1B2A] text-white hover:bg-slate-800 rounded font-semibold text-[11px] shadow-sm transition-colors"
                                    >
                                      Collect
                                    </button>
                                    <button
                                      onClick={() => setActiveAccountForAdjust(acc)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-[11px] border border-slate-300 transition-colors"
                                    >
                                      Adjust
                                    </button>
                                    <button
                                      onClick={() => setActiveAccountForWaive(acc)}
                                      className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded font-medium text-[11px] border border-purple-200 transition-colors"
                                    >
                                      Waive
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => {
                                    setPrintableData({
                                      isOpen: true,
                                      account: acc,
                                      payment: studentPayments.find((p) => p.fee_account_id === acc.id) || null,
                                      student: selectedStudent,
                                    });
                                  }}
                                  className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                                  title="Print Fee Statement / Receipt"
                                >
                                  <Printer className="w-3.5 h-3.5 inline" />
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

              {/* Cadet Payment History Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Cadet Payment History & Receipts
                  </h3>
                  <span className="text-[11px] text-slate-500">{studentPayments.length} recorded payments</span>
                </div>

                {studentPayments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No payment receipts issued for this cadet yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">Receipt #</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3">Reference</th>
                          <th className="py-2.5 px-3 text-right">Amount Paid</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {studentPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-blue-800">{p.receipt_number}</td>
                            <td className="py-3 px-3 text-slate-600">{new Date(p.payment_date).toLocaleDateString()}</td>
                            <td className="py-3 px-3 uppercase text-[11px] font-semibold text-slate-700">{p.payment_method}</td>
                            <td className="py-3 px-3 font-mono text-slate-500">{p.reference_number || '—'}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">{formatPKR(p.amount)}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  const acc = studentAccounts.find((a) => a.id === p.fee_account_id) || studentAccounts[0];
                                  setPrintableData({
                                    isOpen: true,
                                    account: acc,
                                    payment: p,
                                    student: selectedStudent,
                                  });
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] inline-flex items-center space-x-1"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Receipt</span>
                              </button>
                              {p.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleVoidPayment(p)}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-semibold text-[11px] border border-rose-200"
                                >
                                  Void
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cadet Directory Search Bar & Status Filter */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Cadet Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchCadetQuery}
                    onChange={(e) => setSearchCadetQuery(e.target.value)}
                    placeholder="Search by Cadet Name, Roll No, or Father Name..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-medium text-slate-900"
                  />
                  {searchCadetQuery && (
                    <button
                      onClick={() => setSearchCadetQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Paid / Unpaid Status Filter Buttons */}
                <div className="flex items-center space-x-2 overflow-x-auto">
                  <button
                    onClick={() => setFeeStatusFilter('ALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center space-x-1.5 ${
                      feeStatusFilter === 'ALL'
                        ? 'bg-[#0E1B2A] text-white border-[#0E1B2A] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Cadets</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-700 text-white font-mono">
                      {allStudentsOverview.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setFeeStatusFilter('PAID')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center space-x-1.5 ${
                      feeStatusFilter === 'PAID'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Paid</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-700 text-white font-mono">
                      {allStudentsOverview.filter((s) => s.status === 'PAID').length}
                    </span>
                  </button>

                  <button
                    onClick={() => setFeeStatusFilter('UNPAID')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center space-x-1.5 ${
                      feeStatusFilter === 'UNPAID'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                    <span>Unpaid</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-700 text-white font-mono">
                      {allStudentsOverview.filter((s) => s.status === 'UNPAID').length}
                    </span>
                  </button>

                  {allStudentsOverview.some((s) => s.status === 'PARTIAL') && (
                    <button
                      onClick={() => setFeeStatusFilter('PARTIAL')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center space-x-1.5 ${
                        feeStatusFilter === 'PARTIAL'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                      <span>Partial</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-700 text-white font-mono">
                        {allStudentsOverview.filter((s) => s.status === 'PARTIAL').length}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={loadAllStudentsOverview}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-300"
                    title="Refresh Student Fee List"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAllStudents ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Master Cadets Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Cadet Fee Register & Status Directory
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Showing {filteredStudents.length} of {allStudentsOverview.length} cadets
                  </span>
                </div>

                {loadingAllStudents ? (
                  <div className="p-16 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                    <span className="font-semibold text-slate-600">Loading cadet fee directory...</span>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 text-xs">
                    No registered cadets match the selected status or search filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Cadet Roll & Name</th>
                          <th className="py-3 px-3">Course / Force</th>
                          <th className="py-3 px-3">Father Name</th>
                          <th className="py-3 px-3 text-right">Net Fees</th>
                          <th className="py-3 px-3 text-right">Paid</th>
                          <th className="py-3 px-3 text-right">Balance Due</th>
                          <th className="py-3 px-4 text-center">Fee Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {filteredStudents.map((student) => (
                          <tr key={student.student_id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{student.display_name}</div>
                              <div className="text-[11px] font-mono text-blue-700 font-bold">{student.roll_number}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800">{student.course_name || 'General'}</div>
                              {student.force_name && <div className="text-[10px] text-slate-500 font-medium">{student.force_name}</div>}
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-medium">
                              {student.father_name || '—'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-semibold">
                              {formatPKR(student.total_due)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                              {formatPKR(student.total_paid)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold">
                              <span className={student.balance > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-500'}>
                                {formatPKR(student.balance)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {student.status === 'PAID' ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                  <span>PAID</span>
                                </span>
                              ) : student.status === 'PARTIAL' ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                  <span>PARTIAL</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                  <span>UNPAID</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  handleSelectStudent({
                                    id: student.student_id,
                                    profile_id: '',
                                    roll_number: student.roll_number,
                                    display_name: student.display_name,
                                    father_name: student.father_name || '',
                                    email: student.email,
                                    course_id: null,
                                    course_name: student.course_name,
                                    batch_id: null,
                                    batch_name: null,
                                    force_name: student.force_name,
                                  });
                                }}
                                className="px-3 py-1.5 bg-[#0E1B2A] hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors inline-flex items-center space-x-1"
                              >
                                <span>Collect / View</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ACADEMY EXPENSES */}
      {/* ========================================================================= */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Expense Category:</span>
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="RENT">Building Rent</option>
                <option value="ELECTRICITY">Electricity (IESCO)</option>
                <option value="GAS">Sui Gas</option>
                <option value="INTERNET">Internet & IT</option>
                <option value="WATER">Water Supply</option>
                <option value="STATIONERY">Stationery & Printing</option>
                <option value="MAINTENANCE">Facility Maintenance</option>
                <option value="EQUIPMENT">Equipment & Hardware</option>
                <option value="MARKETING">Admissions & Marketing</option>
                <option value="TRANSPORT">Academy Transport</option>
                <option value="SALARY">Faculty Salaries</option>
                <option value="OTHER">Other Contingency</option>
              </select>
            </div>

            <button
              onClick={() => setIsRecordExpenseOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#0E1B2A] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Expense</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Academy Expense Register
              </h3>
              <span className="text-[11px] text-slate-500">{expenses.length} records</span>
            </div>

            {loadingExpenses ? (
              <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading expenses...</span>
              </div>
            ) : expenses.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No expense entries found for the selected category.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Title & Particulars</th>
                      <th className="py-2.5 px-3">Payee</th>
                      <th className="py-2.5 px-3">Method / Ref</th>
                      <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600">{exp.expense_date}</td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                            {exp.category_code}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{exp.title}</div>
                          {exp.description && <div className="text-[10px] text-slate-500">{exp.description}</div>}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">{exp.payee_name || '—'}</td>
                        <td className="py-3 px-3 text-slate-600">
                          <span className="font-semibold uppercase text-[10px]">{exp.payment_method}</span>
                          {exp.reference_number && <span className="block font-mono text-[10px] text-slate-400">{exp.reference_number}</span>}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                          {formatPKR(exp.amount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            exp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {exp.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {exp.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleVoidExpense(exp)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-semibold text-[11px] border border-rose-200"
                            >
                              Void
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TEACHER SALARIES */}
      {/* ========================================================================= */}
      {activeTab === 'salaries' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Payroll Month:</span>
              <select
                value={salaryMonth}
                onChange={(e) => setSalaryMonth(Number(e.target.value))}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {new Date(2026, m - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={salaryYear}
                onChange={(e) => setSalaryYear(Number(e.target.value))}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            <button
              onClick={() => setIsRecordSalaryOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#0E1B2A] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Record Salary Payment</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Teacher Payroll Register ({salaryMonth}/{salaryYear})
              </h3>
              <span className="text-[11px] text-slate-500">{salaries.length} payroll entries</span>
            </div>

            {loadingSalaries ? (
              <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading payroll records...</span>
              </div>
            ) : salaries.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No salary disbursements recorded for {salaryMonth}/{salaryYear}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Faculty Member</th>
                      <th className="py-2.5 px-3">Period</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Base Salary</th>
                      <th className="py-2.5 px-3 text-right">Bonus</th>
                      <th className="py-2.5 px-3 text-right">Deduction</th>
                      <th className="py-2.5 px-3 text-right">Net Paid</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {salaries.map((sal) => (
                      <tr key={sal.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {sal.teacher_name || 'Faculty Member'}
                          <span className="block text-[10px] font-normal text-slate-400 font-mono">
                            {sal.teacher_email}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono">
                          {sal.salary_month}/{sal.salary_year}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            sal.payment_type === 'REGULAR'
                              ? 'bg-blue-100 text-blue-800'
                              : sal.payment_type === 'BONUS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {sal.payment_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono">{formatPKR(sal.base_salary)}</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-600">
                          {sal.bonus > 0 ? `+${formatPKR(sal.bonus)}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-rose-600">
                          {sal.deduction > 0 ? `-${formatPKR(sal.deduction)}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-indigo-900">
                          {formatPKR(sal.net_paid)}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono">{sal.payment_date}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            sal.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {sal.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: MASTER FINANCIAL LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Transaction Type:</span>
              <select
                value={ledgerTypeFilter}
                onChange={(e) => setLedgerTypeFilter(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Entries (Inflow & Outflow)</option>
                <option value="INCOME">Cadet Fees (Inflow)</option>
                <option value="EXPENSE">Expenses & Salaries (Outflow)</option>
              </select>
            </div>

            <button
              onClick={handleExportLedgerCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Chronological Master Cash Ledger
              </h3>
              <span className="text-[11px] text-slate-500">{transactions.length} entries</span>
            </div>

            {loadingLedger ? (
              <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading financial ledger...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No ledger transactions found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-3">Ref / Receipt</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Party</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {transactions.map((tx) => (
                      <tr key={tx.transaction_id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600">{tx.date}</td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-800">
                          {tx.receipt_number || tx.reference_number || '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            tx.transaction_type === 'INCOME'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">{tx.category_name || tx.category}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">{tx.description}</td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{tx.party_name || '—'}</td>
                        <td className="py-3 px-3 uppercase text-[10px] text-slate-600 font-semibold">{tx.payment_method}</td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${
                          tx.transaction_type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {tx.transaction_type === 'INCOME' ? `+${formatPKR(tx.amount)}` : `-${formatPKR(tx.amount)}`}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            tx.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: COLLECT CADET PAYMENT */}
      {/* ========================================================================= */}
      {/* MODAL 1: COLLECT CADET PAYMENT */}
      {activeAccountForPayment && (
        <CollectPaymentModal
          account={activeAccountForPayment}
          student={selectedStudent!}
          onClose={() => setActiveAccountForPayment(null)}
          onSuccess={() => {
            setActiveAccountForPayment(null);
            if (selectedStudent) handleSelectStudent(selectedStudent);
            loadSummary();
            loadAllStudentsOverview();
          }}
        />
      )}

      {/* MODAL 2: ADJUST FEE (DISCOUNT & FINE) */}
      {activeAccountForAdjust && (
        <AdjustFeeModal
          account={activeAccountForAdjust}
          onClose={() => setActiveAccountForAdjust(null)}
          onSuccess={() => {
            setActiveAccountForAdjust(null);
            if (selectedStudent) handleSelectStudent(selectedStudent);
            loadSummary();
            loadAllStudentsOverview();
          }}
        />
      )}

      {/* MODAL 3: WAIVE FEE */}
      {activeAccountForWaive && (
        <WaiveFeeModal
          account={activeAccountForWaive}
          onClose={() => setActiveAccountForWaive(null)}
          onSuccess={() => {
            setActiveAccountForWaive(null);
            if (selectedStudent) handleSelectStudent(selectedStudent);
            loadSummary();
            loadAllStudentsOverview();
          }}
        />
      )}

      {/* MODAL 4: RECORD GENERAL/UTILITY/RENT EXPENSE */}
      {isRecordExpenseOpen && (
        <RecordExpenseModal
          onClose={() => setIsRecordExpenseOpen(false)}
          onSuccess={() => {
            setIsRecordExpenseOpen(false);
            loadExpenses();
            loadSummary();
          }}
        />
      )}

      {/* MODAL 5: RECORD TEACHER SALARY */}
      {isRecordSalaryOpen && (
        <RecordSalaryModal
          teachers={teachersList}
          onClose={() => setIsRecordSalaryOpen(false)}
          onSuccess={() => {
            setIsRecordSalaryOpen(false);
            loadSalaries();
            loadSummary();
          }}
        />
      )}

      {/* MODAL 6: GENERATE MONTHLY CADET FEES */}
      {isGenerateFeesOpen && (
        <GenerateFeesModal
          onClose={() => setIsGenerateFeesOpen(false)}
          onSuccess={() => {
            setIsGenerateFeesOpen(false);
            loadSummary();
            if (selectedStudent) handleSelectStudent(selectedStudent);
            loadAllStudentsOverview();
          }}
        />
      )}

      {/* MODAL 7: PRINTABLE RECEIPT */}
      <PrintableFeeReceipt
        isOpen={printableData.isOpen}
        onClose={() => setPrintableData((prev) => ({ ...prev, isOpen: false }))}
        account={printableData.account}
        payment={printableData.payment}
        student={printableData.student}
      />
    </div>
  );
};

// -----------------------------------------------------------------------------
// SUB-COMPONENT: COLLECT PAYMENT MODAL
// -----------------------------------------------------------------------------
interface CollectModalProps {
  account: StudentFeeAccount;
  student: StudentSearchResult;
  onClose: () => void;
  onSuccess: () => void;
}

const CollectPaymentModal: React.FC<CollectModalProps> = ({ account, student, onClose, onSuccess }) => {
  const netDue = (account.amount_due || 0) - (account.discount_amount || 0) + (account.fine_amount || 0);
  const maxPayable = Math.max(0, netDue - (account.amount_paid || 0));

  const [amount, setAmount] = useState<number>(maxPayable);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [refNo, setRefNo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }
    if (amount > maxPayable) {
      toast.error(`Overpayment not permitted! Maximum balance due is Rs. ${maxPayable}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await financeService.recordStudentFeePayment({
        studentId: student.id,
        feeAccountId: account.id,
        amount,
        paymentMethod: method,
        referenceNumber: refNo.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(`Payment recorded! Receipt No: ${res.receipt_number}`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Collect Cadet Fee Payment</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between font-bold text-slate-800">
              <span>Cadet:</span>
              <span>{student.display_name} ({student.roll_number})</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Fee Head:</span>
              <span>{account.fee_type}</span>
            </div>
            <div className="flex justify-between font-bold text-amber-700 pt-1 border-t border-slate-200">
              <span>Outstanding Balance:</span>
              <span>{formatPKR(maxPayable)}</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Amount to Collect (PKR) *</label>
            <input
              type="number"
              min="1"
              max={maxPayable}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Supports full or partial payment. Overpayment is strictly blocked.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Method *</label>
              <select
                value={method}
                onChange={(e: any) => setMethod(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="ONLINE">Online Portal</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Reference / Txn ID</label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="e.g. TRX-99214"
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Notes / Remarks</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid in cash at accounts counter"
              rows={2}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#0E1B2A] hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// SUB-COMPONENT: ADJUST FEE MODAL
// -----------------------------------------------------------------------------
const AdjustFeeModal: React.FC<{ account: StudentFeeAccount; onClose: () => void; onSuccess: () => void }> = ({
  account,
  onClose,
  onSuccess,
}) => {
  const [discount, setDiscount] = useState<number>(account.discount_amount || 0);
  const [fine, setFine] = useState<number>(account.fine_amount || 0);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Adjustment reason is mandatory for audit trail.');
      return;
    }
    setSubmitting(true);
    try {
      await financeService.updateFeeAdjustment({
        feeAccountId: account.id,
        discountAmount: discount,
        fineAmount: fine,
        reason: reason.trim(),
      });
      toast.success('Fee adjustment applied successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust fee');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Adjust Discount & Late Fine</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block">Base Tuition Amount:</span>
            <span className="font-mono font-bold text-sm text-slate-900">{formatPKR(account.amount_due)}</span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Scholarship / Discount (PKR)</label>
            <input
              type="number"
              min="0"
              max={account.amount_due}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Late Fine / Penalty (PKR)</label>
            <input
              type="number"
              min="0"
              value={fine}
              onChange={(e) => setFine(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Audit Reason *</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Merit scholarship approval by Principal"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#0E1B2A] text-white rounded-lg font-bold disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// SUB-COMPONENT: WAIVE FEE MODAL
// -----------------------------------------------------------------------------
const WaiveFeeModal: React.FC<{ account: StudentFeeAccount; onClose: () => void; onSuccess: () => void }> = ({
  account,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Waiver reason is strictly required.');
      return;
    }
    setSubmitting(true);
    try {
      await financeService.waiveStudentFee(account.id, reason.trim());
      toast.success('Fee account marked as WAIVED');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to waive fee');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-purple-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-purple-950">Waive Cadet Fee Account</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Are you sure you want to completely waive this fee account for <strong>{account.fee_type}</strong>? Outstanding balance will be set to zero.
          </p>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Official Waiver Reason *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Full martyr/kin financial aid approved by Board of Trustees"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold disabled:opacity-50"
            >
              {submitting ? 'Waiving...' : 'Confirm Waiver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// SUB-COMPONENT: RECORD EXPENSE MODAL
// -----------------------------------------------------------------------------
const RecordExpenseModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [category, setCategory] = useState('RENT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [refNo, setRefNo] = useState('');
  const [payee, setPayee] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error('Expense amount must be greater than zero');
      return;
    }
    if (!title.trim()) {
      toast.error('Expense title is required');
      return;
    }

    setSubmitting(true);
    try {
      await financeService.recordExpense({
        categoryCode: category,
        title: title.trim(),
        description: description.trim() || undefined,
        amount,
        expenseDate: date,
        paymentMethod: method,
        referenceNumber: refNo.trim() || undefined,
        payeeName: payee.trim() || undefined,
      });
      toast.success('Academy expense recorded successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">Record Operational Expense</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Expense Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none"
              >
                <option value="RENT">Building Rent</option>
                <option value="ELECTRICITY">Electricity (IESCO)</option>
                <option value="GAS">Sui Gas Bill</option>
                <option value="INTERNET">Internet Connection</option>
                <option value="WATER">Water Supply</option>
                <option value="STATIONERY">Stationery & Tests</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="EQUIPMENT">Equipment Purchase</option>
                <option value="MARKETING">Admissions Promotion</option>
                <option value="TRANSPORT">Academy Van / Bus</option>
                <option value="OTHER">Other Expense</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Expense Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Expense Title / Head *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Main Academy Campus Rent September 2026"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Amount (PKR) *</label>
              <input
                type="number"
                min="1"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="50000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Payee / Vendor Name</label>
              <input
                type="text"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder="e.g. Campus Landlord, IESCO"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e: any) => setMethod(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Cheque / Reference #</label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="e.g. CHQ-88192"
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description / Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Paid via online banking transaction"
              rows={2}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#0E1B2A] text-white rounded-lg font-bold disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// SUB-COMPONENT: RECORD TEACHER SALARY MODAL
// -----------------------------------------------------------------------------
const RecordSalaryModal: React.FC<{
  teachers: TeacherDropdownItem[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ teachers, onClose, onSuccess }) => {
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [paymentType, setPaymentType] = useState<SalaryPaymentType>('REGULAR');
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [deduction, setDeduction] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [refNo, setRefNo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const netSalary = Math.max(0, baseSalary + bonus - deduction);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) {
      toast.error('Please select a faculty member');
      return;
    }
    if (netSalary <= 0) {
      toast.error('Net payable salary must be greater than zero');
      return;
    }

    setSubmitting(true);
    try {
      await financeService.recordExpense({
        categoryCode: 'SALARY',
        title: `Salary - ${month}/${year}`,
        description: notes.trim() || undefined,
        amount: netSalary,
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMethod: method,
        referenceNumber: refNo.trim() || undefined,
        teacherId,
        salaryMonth: month,
        salaryYear: year,
        salaryPaymentType: paymentType,
        baseSalary,
        bonus,
        deduction,
      });
      toast.success('Teacher salary disbursed & logged in payroll!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to disburse salary');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Faculty Salary Disbursement</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Faculty Member *</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.display_name} ({t.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Month *</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Year *</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pay Type *</label>
              <select
                value={paymentType}
                onChange={(e: any) => setPaymentType(e.target.value)}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
              >
                <option value="REGULAR">Regular</option>
                <option value="BONUS">Bonus</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Base Salary</label>
              <input
                type="number"
                min="0"
                value={baseSalary || ''}
                onChange={(e) => setBaseSalary(Number(e.target.value))}
                placeholder="40000"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bonus</label>
              <input
                type="number"
                min="0"
                value={bonus || ''}
                onChange={(e) => setBonus(Number(e.target.value))}
                placeholder="0"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-emerald-700 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Deduction</label>
              <input
                type="number"
                min="0"
                value={deduction || ''}
                onChange={(e) => setDeduction(Number(e.target.value))}
                placeholder="0"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-rose-700 font-bold"
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center justify-between">
            <span className="font-bold text-indigo-950">Net Disbursed Amount:</span>
            <span className="font-mono font-black text-sm text-indigo-900">{formatPKR(netSalary)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e: any) => setMethod(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Bank Reference #</label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="e.g. SAL-99182"
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Regular monthly payroll"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#0E1B2A] text-white rounded-lg font-bold disabled:opacity-50"
            >
              {submitting ? 'Disbursing...' : 'Confirm Salary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// SUB-COMPONENT: GENERATE BULK CADET FEES MODAL
// -----------------------------------------------------------------------------
const GenerateFeesModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [amount, setAmount] = useState<number>(10000);
  const [submitting, setSubmitting] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error('Default fee amount must be greater than zero');
      return;
    }
    setSubmitting(true);
    try {
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const periodLabel = `${monthNames[month]} ${year}`;
      const res = await financeService.generateMonthlyFees({
        feeMonth: month,
        feeYear: year,
        feePeriod: periodLabel,
        amount,
      });
      toast.success(`Generated monthly fees for ${res.created_count} active cadets!`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate monthly fees');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-blue-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-700" />
            <h3 className="text-sm font-bold text-blue-950">Generate Monthly Cadet Fees</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="p-5 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            This will bulk create monthly tuition fee accounts for all active cadets who do not already have an account for this month.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Fee Month *</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Fee Year *</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Default Monthly Fee (PKR) *</label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold disabled:opacity-50"
            >
              {submitting ? 'Generating...' : 'Generate Fees'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinancePage;
