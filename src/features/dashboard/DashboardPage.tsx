import React, { useState } from 'react';
import {
  Users,
  FileQuestion,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  RefreshCw,
  Printer,
  BookOpen,
  Download,
} from 'lucide-react';
import {
  MetricCard,
  StatusBadge,
  ForceBadge,
  Avatar,
  PageHeader,
} from '@/components/ui';
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

const RECENT_SUBMISSIONS: RecentSubmission[] = [
  {
    id: 'sub-1',
    cadetName: 'Ahmed Khan',
    avatarText: 'AK',
    center: 'Batch 154 · Islamabad Center',
    rollNumber: 'PMA-2026-0145',
    testTitle: 'PMA Long Course Mock 06',
    subTitle: 'Verbal & Non-Verbal + Academic',
    branch: 'PAKISTAN_ARMY',
    scorePercent: 88.5,
    scoreText: '177 / 200',
    passed: true,
    timestamp: '11:42 AM',
    relativeTime: '8 mins ago',
  },
  {
    id: 'sub-2',
    cadetName: 'Hassan Ali',
    avatarText: 'HA',
    center: 'Batch 154 · Lahore Flight Wing',
    rollNumber: 'PAF-2026-0089',
    testTitle: 'GD(P) Academic Practice',
    subTitle: 'Physics & Advanced Mathematics',
    branch: 'PAKISTAN_AIR_FORCE',
    scorePercent: 68.0,
    scoreText: '102 / 150',
    passed: true,
    timestamp: '11:36 AM',
    relativeTime: '14 mins ago',
  },
  {
    id: 'sub-3',
    cadetName: 'Bilal Khan',
    avatarText: 'BK',
    center: 'Rawalpindi Sector',
    rollNumber: 'PN-2026-0312',
    testTitle: 'PN Cadet Intelligence Battery',
    subTitle: 'Mechanical Comprehension & Matrix',
    branch: 'PAKISTAN_NAVY',
    scorePercent: 34.5,
    scoreText: '69 / 200',
    passed: false,
    timestamp: '11:24 AM',
    relativeTime: 'Flagged',
    critical: true,
  },
  {
    id: 'sub-4',
    cadetName: 'Saad Iqbal',
    avatarText: 'SI',
    center: 'Batch 153 · Peshawar Base',
    rollNumber: 'PMA-2026-0298',
    testTitle: 'PMA Long Course Mock 06',
    subTitle: 'General Knowledge & Pakistan Studies',
    branch: 'PAKISTAN_ARMY',
    scorePercent: 76.0,
    scoreText: '152 / 200',
    passed: true,
    timestamp: '11:15 AM',
    relativeTime: '35 mins ago',
  },
  {
    id: 'sub-5',
    cadetName: 'Muhammad Farooq',
    avatarText: 'MF',
    center: 'Batch 154 · Multan Satellite',
    rollNumber: 'PAF-2026-0112',
    testTitle: 'PAF Aeronautical Eng Initial',
    subTitle: 'Calculus & Basic Electronics',
    branch: 'PAKISTAN_AIR_FORCE',
    scorePercent: 91.5,
    scoreText: '183 / 200',
    passed: true,
    timestamp: '10:58 AM',
    relativeTime: '45 mins ago',
  },
];

export const DashboardPage: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');

  const filteredSubmissions = RECENT_SUBMISSIONS.filter((s) => {
    if (selectedBranch === 'ALL') return true;
    return s.branch === selectedBranch;
  });

  const handleSyncFeed = () => {
    toast.success('Feed refreshed successfully');
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
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        }
      />

      {/* 5-Column Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <MetricCard
          title="Enrolled Students"
          value={428}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: '+18', direction: 'up' }}
          subtext="85.6% of capacity"
        />
        <MetricCard
          title="Active Tests"
          value="06"
          icon={<FileQuestion className="w-5 h-5 text-[#C6A75E]" />}
          subtext="4 proctored · 2 open"
          highlight
        />
        <MetricCard
          title="Completed Today"
          value={24}
          icon={<CheckCircle2 className="w-5 h-5 text-[#234E35]" />}
          trend={{ value: '100%', direction: 'up' }}
          subtext="auto-graded"
        />
        <MetricCard
          title="Average Score"
          value="71.4%"
          icon={<TrendingUp className="w-5 h-5 text-[#234E35]" />}
          trend={{ value: '+2.1%', direction: 'up' }}
          subtext="vs 60-day baseline"
        />
        <MetricCard
          title="Pending Retakes"
          value="08"
          icon={<RotateCcw className="w-5 h-5 text-[#7A5312]" />}
          subtext="5 technical · 3 medical"
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

              {/* Shaded Area */}
              <path
                d="M 0,135 Q 70,120 130,130 T 260,95 T 390,110 T 520,65 T 650,55 T 760,42 L 760,210 L 0,210 Z"
                fill="url(#areaGradient)"
              />

              {/* Spline */}
              <path
                d="M 0,135 Q 70,120 130,130 T 260,95 T 390,110 T 520,65 T 650,55 T 760,42"
                fill="none"
                stroke="#0E1B2A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="130" cy="130" r="4" fill="#FFFFFF" stroke="#0E1B2A" strokeWidth="2" />
              <circle cx="260" cy="95" r="4" fill="#FFFFFF" stroke="#0E1B2A" strokeWidth="2" />
              <circle cx="390" cy="110" r="4" fill="#FFFFFF" stroke="#0E1B2A" strokeWidth="2" />
              <circle cx="520" cy="65" r="4" fill="#FFFFFF" stroke="#0E1B2A" strokeWidth="2" />
              <circle cx="650" cy="55" r="4" fill="#FFFFFF" stroke="#0E1B2A" strokeWidth="2" />
              <circle cx="760" cy="42" r="5" fill="#455D4A" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between items-center text-[#94A3B8] font-sans tabular-nums text-[12px] pt-2">
              <span>Apr 12</span>
              <span>Apr 19</span>
              <span>Apr 26</span>
              <span>May 3</span>
              <span>May 10</span>
              <span className="text-[#234E35] font-semibold">Today (71.4%)</span>
            </div>
          </div>

          {/* Footer Micro-Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#F1F5F9] bg-[#F8FAFC] p-4 rounded-lg">
            <div>
              <span className="text-[12px] text-[#64748B]">Monthly peak</span>
              <div className="text-[14px] font-bold text-[#0E1B2A] font-display mt-0.5">
                76.8% <span className="font-normal text-[12px] text-[#64748B]">(Day 24)</span>
              </div>
            </div>
            <div>
              <span className="text-[12px] text-[#64748B]">Fail rate</span>
              <div className="text-[14px] font-bold text-[#782525] font-display mt-0.5">
                8.2% <span className="font-normal text-[12px] text-[#64748B]">(&lt;40%)</span>
              </div>
            </div>
            <div>
              <span className="text-[12px] text-[#64748B]">Score variance</span>
              <div className="text-[14px] font-bold text-[#234E35] font-display mt-0.5">
                ±3.4% <span className="font-normal text-[12px] text-[#64748B]">(stable)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Pass Rates by Branch */}
        <div className="lg:col-span-4 bg-white border border-[#E2E6EB] rounded-lg p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col justify-between space-y-4">
          <div className="border-b border-[#F1F5F9] pb-4">
            <h3 className="text-[15px] font-semibold text-[#0E1B2A] font-display">
              Pass Rates by Branch
            </h3>
            <p className="text-[13px] text-[#64748B] mt-0.5">Current intake aggregate</p>
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
                    <span className="text-[12px] text-[#64748B] block tabular-nums">210 students</span>
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <span className="text-[18px] font-bold text-[#234E35]">74%</span>
                  <span className="text-[11px] text-[#64748B] block">pass rate</span>
                </div>
              </div>
              <div className="w-full h-2 bg-[#EDF1F5] rounded-full overflow-hidden">
                <div className="h-full bg-[#455D4A] rounded-full transition-all" style={{ width: '74%' }} />
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
                    <span className="text-[12px] text-[#64748B] block tabular-nums">142 students</span>
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <span className="text-[18px] font-bold text-[#0E1B2A]">69%</span>
                  <span className="text-[11px] text-[#64748B] block">pass rate</span>
                </div>
              </div>
              <div className="w-full h-2 bg-[#EDF1F5] rounded-full overflow-hidden">
                <div className="h-full bg-[#0E1B2A] rounded-full transition-all" style={{ width: '69%' }} />
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
                    <span className="text-[12px] text-[#64748B] block tabular-nums">76 students</span>
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <span className="text-[18px] font-bold text-[#234E35]">72%</span>
                  <span className="text-[11px] text-[#64748B] block">pass rate</span>
                </div>
              </div>
              <div className="w-full h-2 bg-[#EDF1F5] rounded-full overflow-hidden">
                <div className="h-full bg-[#455D4A] rounded-full transition-all" style={{ width: '72%' }} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toast.info('Exporting branch comparison report')}
            className="w-full h-10 bg-[#F4F6F9] hover:bg-[#EAECF0] text-[#0E1B2A] rounded-lg text-[13.5px] font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Branch Breakdown</span>
          </button>
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
              {filteredSubmissions.map((row) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
