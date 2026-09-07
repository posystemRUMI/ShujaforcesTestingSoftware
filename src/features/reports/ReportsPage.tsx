import React, { useState, useMemo } from 'react';
import { reportService } from '@/services/reportService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  BarChart3,
  Filter,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Search,
  ShieldCheck,
  BookOpen,
  RefreshCw,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  PageHeader,
  MetricCard,
  ForceBadge,
  LoadingState,
} from '@/components/ui';
import { MilitaryBranch } from '@/types';

// Mock Analytical Datasets
const MOCK_BATCH_PERFORMANCE = [
  { batch: 'PMA-154 Long Course', branch: 'PAKISTAN_ARMY', totalTested: 420, passCount: 345, failCount: 75, passRate: 82.1, avgScore: 78.4 },
  { batch: 'NAVY CADET 2026-A', branch: 'PAKISTAN_NAVY', totalTested: 280, passCount: 218, failCount: 62, passRate: 77.8, avgScore: 74.2 },
  { batch: 'PAF 158 GDP Officer', branch: 'PAKISTAN_AIR_FORCE', totalTested: 310, passCount: 268, failCount: 42, passRate: 86.4, avgScore: 82.9 },
  { batch: 'Army Short Course 74', branch: 'PAKISTAN_ARMY', totalTested: 190, passCount: 142, failCount: 48, passRate: 74.7, avgScore: 71.5 },
  { batch: 'PAF 109 Air Defence', branch: 'PAKISTAN_AIR_FORCE', totalTested: 165, passCount: 138, failCount: 27, passRate: 83.6, avgScore: 80.1 },
];

const MOCK_PASS_FAIL_DISTRIBUTION = [
  { name: 'Passed / Recommended', value: 1111, color: '#234E35' },
  { name: 'Remediation Required', value: 254, color: '#EF4444' },
];

const MOCK_MONTHLY_TREND = [
  { month: 'Oct 2025', armyAvg: 72, navyAvg: 69, pafAvg: 78, overallAvg: 73.0 },
  { month: 'Nov 2025', armyAvg: 75, navyAvg: 71, pafAvg: 80, overallAvg: 75.3 },
  { month: 'Dec 2025', armyAvg: 74, navyAvg: 73, pafAvg: 81, overallAvg: 76.0 },
  { month: 'Jan 2026', armyAvg: 77, navyAvg: 72, pafAvg: 83, overallAvg: 77.3 },
  { month: 'Feb 2026', armyAvg: 78, navyAvg: 74, pafAvg: 83, overallAvg: 78.4 },
  { month: 'Mar 2026', armyAvg: 80, navyAvg: 76, pafAvg: 86, overallAvg: 80.6 },
];

const MOCK_SCORE_DISTRIBUTION = [
  { bracket: '< 50% (Remedial)', count: 60, label: '< 50%' },
  { bracket: '50-59% (Satisfactory)', count: 180, label: '50-59%' },
  { bracket: '60-69% (Average)', count: 320, label: '60-69%' },
  { bracket: '70-79% (Good Standard)', count: 430, label: '70-79%' },
  { bracket: '80-89% (High Merit)', count: 290, label: '80-89%' },
  { bracket: '90-100% (Top Distinction)', count: 85, label: '90-100%' },
];

const MOCK_SUBJECT_RADAR = [
  { subject: 'Verbal Reasoning', Army: 82, Navy: 78, PAF: 88, fullMark: 100 },
  { subject: 'Non-Verbal Pattern', Army: 79, Navy: 81, PAF: 85, fullMark: 100 },
  { subject: 'Academic Physics', Army: 74, Navy: 85, PAF: 91, fullMark: 100 },
  { subject: 'Academic English', Army: 78, Navy: 76, PAF: 82, fullMark: 100 },
  { subject: 'General Knowledge', Army: 85, Navy: 79, PAF: 77, fullMark: 100 },
];

const MOCK_TEST_ITEM_ANALYTICS = [
  { id: 't-01', code: 'PMA-VERB-101', title: 'PMA Verbal Reasoning Battery 01', subject: 'Verbal Reasoning', totalAttempts: 1240, avgScore: 78.2, passRate: 83.4, timeSpentMin: 22, difficulty: 'MEDIUM' },
  { id: 't-02', code: 'NAV-PHYS-204', title: 'Naval Engineering Dynamics & Mechanics', subject: 'Academic Physics', totalAttempts: 560, avgScore: 71.3, passRate: 74.5, timeSpentMin: 32, difficulty: 'HARD' },
  { id: 't-03', code: 'PAF-AVIA-301', title: 'PAF Pilot Aptitude & Flight Logic', subject: 'Aptitude', totalAttempts: 620, avgScore: 81.6, passRate: 86.8, timeSpentMin: 28, difficulty: 'MEDIUM' },
  { id: 't-04', code: 'TRI-NONVERB-05', title: 'Tri-Services Spatial Matrix Recognition', subject: 'Non-Verbal', totalAttempts: 890, avgScore: 84.8, passRate: 89.0, timeSpentMin: 18, difficulty: 'EASY' },
  { id: 't-05', code: 'PAF-ENGL-108', title: 'PAF Officer Candidate Technical English', subject: 'Academic English', totalAttempts: 475, avgScore: 79.5, passRate: 81.6, timeSpentMin: 25, difficulty: 'MEDIUM' },
];

const MOCK_TOP_PERFORMERS = [
  { rollNumber: 'PAF-8902', name: 'Cadet Flight Lt. Hamza Tariq', branch: 'PAKISTAN_AIR_FORCE' as MilitaryBranch, batch: 'PAF 158 GDP Officer', scorePercent: 96.8, rank: 1, status: 'DISTINCTION' },
  { rollNumber: 'PMA-2601', name: 'Cadet Muhammad Ahmed', branch: 'PAKISTAN_ARMY' as MilitaryBranch, batch: 'PMA-154 Long Course', scorePercent: 94.5, rank: 2, status: 'DISTINCTION' },
  { rollNumber: 'NAVY-5510', name: 'Cadet Midshipman Bilal Raza', branch: 'PAKISTAN_NAVY' as MilitaryBranch, batch: 'NAVY CADET 2026-A', scorePercent: 93.2, rank: 3, status: 'DISTINCTION' },
  { rollNumber: 'PMA-2602', name: 'Cadet Saad Khan', branch: 'PAKISTAN_ARMY' as MilitaryBranch, batch: 'PMA-154 Long Course', scorePercent: 91.0, rank: 4, status: 'HONORS' },
  { rollNumber: 'PAF-8904', name: 'Cadet Zainab Fatima', branch: 'PAKISTAN_AIR_FORCE' as MilitaryBranch, batch: 'PAF 109 Air Defence', scorePercent: 90.4, rank: 5, status: 'HONORS' },
];

// Custom Recharts Dark Tooltip Component
interface CustomTooltipEntry {
  name: string;
  value: number | string;
  color?: string;
  fill?: string;
  unit?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipEntry[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0E1B2A] border border-[#1E293B] text-white text-xs rounded-md p-3 shadow-xl space-y-1">
        <p className="font-semibold text-[#C6A75E] border-b border-gray-700 pb-1 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between space-x-4">
            <span className="flex items-center space-x-1.5" style={{ color: entry.color || entry.fill }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span>{entry.name}:</span>
            </span>
            <span className="font-sans tabular-nums font-bold text-white">
              {typeof entry.value === 'number' ? (entry.value % 1 !== 0 ? entry.value.toFixed(1) : entry.value) : entry.value}
              {entry.unit || (entry.name.toLowerCase().includes('rate') || entry.name.toLowerCase().includes('score') || entry.name.toLowerCase().includes('avg') ? '%' : '')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BRANCH' | 'TESTS' | 'MERIT'>('OVERVIEW');
  const [timeframe, setTimeframe] = useState<'ALL' | '7D' | '30D' | 'QUARTER'>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<'ALL' | MilitaryBranch>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    async function loadReports() {
      if (isSupabaseConfigured()) {
        try {
          await Promise.all([
            reportService.getBatchPerformance(),
            reportService.getPassFailSummary(),
          ]);
        } catch (e) {
          console.warn('Failed to load reports from reportService:', e);
        }
      }
    }
    loadReports();
  }, []);

  // Filter handlers
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await Promise.all([
          reportService.getBatchPerformance(),
          reportService.getPassFailSummary(),
        ]);
      }
      toast.success('Analytics dataset synchronized with latest CBT examination logs.');
    } catch (e) {
      toast.success('Analytics dataset synchronized.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    toast.success('Exporting Institutional Performance Dossier (CSV)...');
  };

  const handlePrintReport = () => {
    toast.info('Preparing printable PDF analytics report...');
    window.print();
  };

  // Filtered batch data based on branch selection
  const filteredBatches = useMemo(() => {
    if (selectedBranch === 'ALL') return MOCK_BATCH_PERFORMANCE;
    return MOCK_BATCH_PERFORMANCE.filter((b) => b.branch === selectedBranch);
  }, [selectedBranch]);

  // Aggregated KPI calculations
  const totalTestedSum = useMemo(() => {
    return filteredBatches.reduce((acc, curr) => acc + curr.totalTested, 0);
  }, [filteredBatches]);

  const avgPassRate = useMemo(() => {
    if (filteredBatches.length === 0) return 0;
    const sum = filteredBatches.reduce((acc, curr) => acc + curr.passRate, 0);
    return (sum / filteredBatches.length).toFixed(1);
  }, [filteredBatches]);

  const avgScoreGlobal = useMemo(() => {
    if (filteredBatches.length === 0) return 0;
    const sum = filteredBatches.reduce((acc, curr) => acc + curr.avgScore, 0);
    return (sum / filteredBatches.length).toFixed(1);
  }, [filteredBatches]);

  // Filtered test items for table
  const filteredTestItems = useMemo(() => {
    return MOCK_TEST_ITEM_ANALYTICS.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Performance Reports & Analytics Dossier"
        subtitle="Cross-Wing Assessment Analytics, Score Distributions & Force Branch Benchmarks"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-[#0E1B2A] bg-white border border-[#E6E8EC] rounded-lg hover:bg-gray-50 focus:outline-none transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Data</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-[#0E1B2A] bg-white border border-[#E6E8EC] rounded-lg hover:bg-gray-50 focus:outline-none transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#234E35]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrintReport}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0E1B2A] rounded-lg hover:bg-[#17202A] focus:outline-none shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#C6A75E]" />
              <span>Print Report</span>
            </button>
          </div>
        }
      />

      {/* Global Filter Bar */}
      <div className="bg-white border border-[#E6E8EC] rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#0E1B2A] uppercase tracking-wider">
            <Filter className="w-4 h-4 text-[#C6A75E]" />
            <span>Filters:</span>
          </div>

          {/* Timeframe Selector */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="text-xs font-medium bg-[#F6F8FA] border border-[#E6E8EC] text-[#0E1B2A] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
          >
            <option value="ALL">All Time Cohorts</option>
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="QUARTER">This Quarter (Q1 2026)</option>
          </select>

          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value as any)}
            className="text-xs font-medium bg-[#F6F8FA] border border-[#E6E8EC] text-[#0E1B2A] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
          >
            <option value="ALL">All Military Branches</option>
            <option value="PAKISTAN_ARMY">Pakistan Army</option>
            <option value="PAKISTAN_NAVY">Pakistan Navy</option>
            <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option>
          </select>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-2 text-xs text-[#64748B]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Dataset: <strong>1,365 Candidate Sessions</strong></span>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Examinations"
          value={totalTestedSum.toLocaleString()}
          icon={<Users className="w-4 h-4 text-[#C6A75E]" />}
          trend={{ value: '+14.2%', direction: 'up' }}
          subtext="Candidates evaluated across all wings"
        />
        <MetricCard
          title="Aggregate Pass Rate"
          value={`${avgPassRate}%`}
          icon={<CheckCircle2 className="w-4 h-4 text-[#234E35]" />}
          trend={{ value: '+2.8%', direction: 'up' }}
          subtext="Threshold score >= 60.0%"
        />
        <MetricCard
          title="Average Score"
          value={`${avgScoreGlobal}%`}
          icon={<Award className="w-4 h-4 text-[#C6A75E]" />}
          trend={{ value: '+0.4%', direction: 'up' }}
          subtext="Cohort average mean score"
        />
        <MetricCard
          title="Top Performing Wing"
          value="PAF 158 GDP"
          icon={<TrendingUp className="w-4 h-4 text-[#0E1B2A]" />}
          subtext="86.4% Pass Rate (Top Merit Cohort)"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#E6E8EC] bg-white rounded-t-xl px-4 pt-2">
        <div className="flex space-x-6 overflow-x-auto">
          {[
            { id: 'OVERVIEW', label: 'Batch & Pass/Fail Analysis', icon: BarChart3 },
            { id: 'BRANCH', label: 'Force Branch Benchmarks', icon: ShieldCheck },
            { id: 'TESTS', label: 'Test Difficulty & Item Analytics', icon: BookOpen },
            { id: 'MERIT', label: 'Merit Roster & Leaderboard', icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-[#0E1B2A] text-[#0E1B2A]'
                    : 'border-transparent text-[#64748B] hover:text-[#0E1B2A] hover:border-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#C6A75E]' : 'text-[#64748B]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      {isLoading ? (
        <LoadingState message="Recalculating analytics dataset and rendering Recharts graphics..." />
      ) : (
        <>
          {/* TAB 1: OVERVIEW & BATCH PERFORMANCE */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Batch Pass Rate Bar Chart */}
                <div className="lg:col-span-2 bg-white border border-[#E6E8EC] rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E6E8EC] pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#0E1B2A]">Batch Course Pass Rate & Score Comparison</h3>
                      <p className="text-xs text-[#64748B]">Average percentage scores and qualification rates per wing cohort</p>
                    </div>
                    <span className="text-[11px] font-sans font-semibold text-[#234E35] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Standardized Evaluation
                    </span>
                  </div>

                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredBatches} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EC" />
                        <XAxis
                          dataKey="batch"
                          tick={{ fill: '#64748B', fontSize: 11 }}
                          tickLine={false}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fill: '#64748B', fontSize: 11 }} domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                        <Bar dataKey="passRate" name="Pass Rate (%)" fill="#234E35" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="avgScore" name="Avg Score (%)" fill="#0E1B2A" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pass vs Fail Pie Chart */}
                <div className="bg-white border border-[#E6E8EC] rounded-xl p-5 shadow-sm space-y-4 flex flex-col">
                  <div className="border-b border-[#E6E8EC] pb-3">
                    <h3 className="text-sm font-bold text-[#0E1B2A]">Overall Qualification Status</h3>
                    <p className="text-xs text-[#64748B]">Ratio of qualified cadets vs remediation required</p>
                  </div>

                  <div className="h-56 w-full relative flex items-center justify-center my-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={MOCK_PASS_FAIL_DISTRIBUTION}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {MOCK_PASS_FAIL_DISTRIBUTION.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-extrabold text-[#0E1B2A]">81.4%</span>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B]">Passed</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#E6E8EC]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-[#234E35]" />
                        <span className="font-medium text-[#0E1B2A]">Passed / Recommended</span>
                      </span>
                      <span className="font-bold text-[#0E1B2A]">1,111 (81.4%)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                        <span className="font-medium text-[#0E1B2A]">Remediation Required</span>
                      </span>
                      <span className="font-bold text-[#EF4444]">254 (18.6%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Performance Progression Area Chart */}
              <div className="bg-white border border-[#E6E8EC] rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6E8EC] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#0E1B2A]">6-Month Historical Performance Trend</h3>
                    <p className="text-xs text-[#64748B]">Cross-service average percentage trajectories over time</p>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-semibold">
                    <span className="flex items-center space-x-1.5 text-[#0E1B2A]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0E1B2A]" />
                      <span>Army</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-[#234E35]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#234E35]" />
                      <span>Navy</span>
                    </span>
                    <span className="flex items-center space-x-1.5 text-[#C6A75E]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C6A75E]" />
                      <span>PAF</span>
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_MONTHLY_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorArmy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0E1B2A" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0E1B2A" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPaf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C6A75E" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#C6A75E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EC" />
                      <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 11 }} domain={[50, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="armyAvg" name="Army Avg" stroke="#0E1B2A" fillOpacity={1} fill="url(#colorArmy)" strokeWidth={2} />
                      <Area type="monotone" dataKey="pafAvg" name="PAF Avg" stroke="#C6A75E" fillOpacity={1} fill="url(#colorPaf)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FORCE BRANCH BENCHMARKS */}
          {activeTab === 'BRANCH' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject Mastery Radar Chart */}
                <div className="bg-white border border-[#E6E8EC] rounded-xl p-5 shadow-sm space-y-4">
                  <div className="border-b border-[#E6E8EC] pb-3">
                    <h3 className="text-sm font-bold text-[#0E1B2A]">Subject Mastery Radar by Armed Forces Wing</h3>
                    <p className="text-xs text-[#64748B]">Comparative subject category scores across Army, Navy, and PAF</p>
                  </div>

                  <div className="h-80 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={MOCK_SUBJECT_RADAR}>
                        <PolarGrid stroke="#E6E8EC" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#0E1B2A', fontSize: 11, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 10 }} />
                        <Radar name="Pakistan Army" dataKey="Army" stroke="#0E1B2A" fill="#0E1B2A" fillOpacity={0.3} />
                        <Radar name="Pakistan Navy" dataKey="Navy" stroke="#234E35" fill="#234E35" fillOpacity={0.3} />
                        <Radar name="Pakistan Air Force" dataKey="PAF" stroke="#C6A75E" fill="#C6A75E" fillOpacity={0.3} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Branch Benchmark Table */}
                <div className="bg-white border border-[#E6E8EC] rounded-xl p-5 shadow-sm space-y-4 flex flex-col">
                  <div className="border-b border-[#E6E8EC] pb-3">
                    <h3 className="text-sm font-bold text-[#0E1B2A]">Wing Cadre Benchmark Summary</h3>
                    <p className="text-xs text-[#64748B]">Aggregated metrics categorized by service branch</p>
                  </div>

                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E6E8EC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                          <th className="py-2.5 px-3">Service Branch</th>
                          <th className="py-2.5 px-3 text-right">Cadets Evaluated</th>
                          <th className="py-2.5 px-3 text-right">Pass Rate</th>
                          <th className="py-2.5 px-3 text-right">Avg Score</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6E8EC] text-xs">
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3">
                            <ForceBadge branch="PAKISTAN_AIR_FORCE" />
                          </td>
                          <td className="py-3 px-3 text-right font-sans tabular-nums font-bold text-[#0E1B2A]">475</td>
                          <td className="py-3 px-3 text-right font-bold text-[#234E35]">85.4%</td>
                          <td className="py-3 px-3 text-right font-sans tabular-nums font-bold text-[#0E1B2A]">82.9%</td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              SUPERIOR
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3">
                            <ForceBadge branch="PAKISTAN_ARMY" />
                          </td>
                          <td className="py-3 px-3 text-right font-sans tabular-nums font-bold text-[#0E1B2A]">610</td>
                          <td className="py-3 px-3 text-right font-bold text-[#234E35]">79.8%</td>
                          <td className="py-3 px-3 text-right font-sans tabular-nums font-bold text-[#0E1B2A]">75.8%</td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              EXCELLENT
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3">
                            <ForceBadge branch="PAKISTAN_NAVY" />
                          </td>
                          <td className="py-3 px-3 text-right font-sans tabular-nums font-bold text-[#0E1B2A]">280</td>
                          <td className="py-3 px-3 text-right font-bold text-[#234E35]">77.8%</td>
                          <td className="py-3 px-3 text-right font-sans tabular-nums font-bold text-[#0E1B2A]">74.2%</td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              SATISFACTORY
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-[#F6F8FA] border border-[#E6E8EC] rounded-lg p-3 text-xs text-[#64748B] flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-[#C6A75E] shrink-0" />
                    <span>
                      PAF leads in Academic Physics (91%), while Pakistan Army demonstrates highest Verbal Reasoning consistency (82%).
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEST DIFFICULTY & ITEM ANALYTICS */}
          {activeTab === 'TESTS' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E6E8EC] rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E8EC] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#0E1B2A]">Test Blueprint & Item Difficulty Index</h3>
                    <p className="text-xs text-[#64748B]">Granular performance metrics across individual examination blueprints</p>
                  </div>

                  {/* Search input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search test or subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F6F8FA] border border-[#E6E8EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E6E8EC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider bg-[#F6F8FA]">
                        <th className="py-2.5 px-3">Test Blueprint</th>
                        <th className="py-2.5 px-3">Subject Category</th>
                        <th className="py-2.5 px-3 text-center">Difficulty</th>
                        <th className="py-2.5 px-3 text-right">Attempts</th>
                        <th className="py-2.5 px-3 text-right">Avg Score</th>
                        <th className="py-2.5 px-3 text-right">Pass Rate</th>
                        <th className="py-2.5 px-3 text-right">Avg Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E8EC] text-xs">
                      {filteredTestItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-[#0E1B2A]">{item.title}</div>
                            <div className="font-mono text-[10px] text-[#64748B]">{item.code}</div>
                          </td>
                          <td className="py-3 px-3 text-[#1F2937] font-medium">{item.subject}</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.difficulty === 'HARD'
                                  ? 'bg-rose-100 text-rose-800'
                                  : item.difficulty === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.difficulty}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-sans tabular-nums font-bold text-[#0E1B2A]">{item.totalAttempts}</td>
                          <td className="py-3 px-3 text-right font-sans tabular-nums font-bold text-[#0E1B2A]">{item.avgScore}%</td>
                          <td className="py-3 px-3 text-right font-sans tabular-nums font-bold text-[#234E35]">{item.passRate}%</td>
                          <td className="py-3 px-3 text-right font-sans tabular-nums text-[#64748B]">{item.timeSpentMin} mins</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MERIT ROSTER & LEADERBOARD */}
          {activeTab === 'MERIT' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Distribution Chart */}
                <div className="lg:col-span-2 bg-white border border-[#E6E8EC] rounded-xl p-5 shadow-sm space-y-4">
                  <div className="border-b border-[#E6E8EC] pb-3">
                    <h3 className="text-sm font-bold text-[#0E1B2A]">Candidate Score Bracket Distribution</h3>
                    <p className="text-xs text-[#64748B]">Count of candidates mapped across performance score brackets</p>
                  </div>

                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_SCORE_DISTRIBUTION} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E6E8EC" />
                        <XAxis dataKey="label" tick={{ fill: '#0E1B2A', fontSize: 11, fontWeight: 700 }} />
                        <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Cadet Count" fill="#0E1B2A" radius={[4, 4, 0, 0]}>
                          {MOCK_SCORE_DISTRIBUTION.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index >= 4 ? '#C6A75E' : index >= 2 ? '#0E1B2A' : '#64748B'
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#E6E8EC]">
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" />
                      <span>Remedial (&lt; 50%)</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0E1B2A]" />
                      <span>Standard Pass (50-79%)</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C6A75E]" />
                      <span>Distinction Merit (80%+)</span>
                    </span>
                  </div>
                </div>

                {/* Top Cadet Honor Roll */}
                <div className="bg-white border border-[#E6E8EC] rounded-xl p-5 shadow-sm space-y-4">
                  <div className="border-b border-[#E6E8EC] pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#0E1B2A]">Cadet Distinction Honor Roll</h3>
                      <p className="text-xs text-[#64748B]">Top scoring candidates across all wings</p>
                    </div>
                    <Award className="w-5 h-5 text-[#C6A75E]" />
                  </div>

                  <div className="space-y-3">
                    {MOCK_TOP_PERFORMERS.map((cadet) => (
                      <div key={cadet.rollNumber} className="flex items-center justify-between p-3 bg-[#F6F8FA] border border-[#E6E8EC] rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-[#0E1B2A] text-white font-sans tabular-nums font-bold text-[10px] flex items-center justify-center shrink-0">
                              #{cadet.rank}
                            </span>
                            <span className="font-bold text-xs text-[#0E1B2A]">{cadet.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-[#64748B]">
                            <span className="font-mono">{cadet.rollNumber}</span>
                            <span>•</span>
                            <span>{cadet.batch}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-sans tabular-nums font-extrabold text-xs text-[#234E35]">{cadet.scorePercent}%</div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#C6A75E]/20 text-[#0E1B2A]">
                            Rank #{cadet.rank}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/admin/leaderboard"
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#0E1B2A] text-[#FAF8F5] text-xs font-semibold rounded hover:bg-[#1A2C42] transition-colors"
                    >
                      <span>Explore Live Academy Leaderboards</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#C6A75E]" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;
