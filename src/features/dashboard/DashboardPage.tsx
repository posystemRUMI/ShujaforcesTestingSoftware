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
  Shield,
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
    center: 'Batch 154 • Islamabad Center',
    rollNumber: 'PMA-2026-0145',
    testTitle: 'PMA Long Course Mock 06',
    subTitle: 'Verbal & Non-Verbal + Academic',
    branch: 'PAKISTAN_ARMY',
    scorePercent: 88.5,
    scoreText: '177 / 200 PTS',
    passed: true,
    timestamp: '11:42:18 AM',
    relativeTime: '08 MINS AGO',
  },
  {
    id: 'sub-2',
    cadetName: 'Hassan Ali',
    avatarText: 'HA',
    center: 'Batch 154 • Lahore Flight Wing',
    rollNumber: 'PAF-2026-0089',
    testTitle: 'GD(P) Academic Practice',
    subTitle: 'Physics & Advanced Mathematics',
    branch: 'PAKISTAN_AIR_FORCE',
    scorePercent: 68.0,
    scoreText: '102 / 150 PTS',
    passed: true,
    timestamp: '11:36:04 AM',
    relativeTime: '14 MINS AGO',
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
    scoreText: '69 / 200 PTS',
    passed: false,
    timestamp: '11:24:50 AM',
    relativeTime: 'FLAGGED',
    critical: true,
  },
  {
    id: 'sub-4',
    cadetName: 'Saad Iqbal',
    avatarText: 'SI',
    center: 'Batch 153 • Peshawar Base',
    rollNumber: 'PMA-2026-0298',
    testTitle: 'PMA Long Course Mock 06',
    subTitle: 'General Knowledge & Pakistan Studies',
    branch: 'PAKISTAN_ARMY',
    scorePercent: 76.0,
    scoreText: '152 / 200 PTS',
    passed: true,
    timestamp: '11:15:32 AM',
    relativeTime: '35 MINS AGO',
  },
  {
    id: 'sub-5',
    cadetName: 'Muhammad Farooq',
    avatarText: 'MF',
    center: 'Batch 154 • Multan Satellite',
    rollNumber: 'PAF-2026-0112',
    testTitle: 'PAF Aeronautical Eng Initial',
    subTitle: 'Calculus & Basic Electronics',
    branch: 'PAKISTAN_AIR_FORCE',
    scorePercent: 91.5,
    scoreText: '183 / 200 PTS',
    passed: true,
    timestamp: '10:58:20 AM',
    relativeTime: '45 MINS AGO',
  },
];

export const DashboardPage: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');

  const filteredSubmissions = RECENT_SUBMISSIONS.filter((s) => {
    if (selectedBranch === 'ALL') return true;
    return s.branch === selectedBranch;
  });

  const handleSyncFeed = () => {
    toast.success('Live examination feed re-synchronized across all workstations');
  };

  const handleAuditKeys = () => {
    toast.info('Accessing released answer keys and derivation rationales');
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="Academy Command Console"
        subtitle="Forces Academy Computerized Testing & Evaluation Protocol — Unified Telemetry"
        breadcrumbs={[{ label: 'Command Console' }]}
        badge={
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-medium bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B]">
            <span className="w-2 h-2 rounded-full bg-[#234E35] mr-1.5 animate-pulse" />
            LIVE TELEMETRY ACTIVE
          </span>
        }
        actions={
          <button
            type="button"
            onClick={handleSyncFeed}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#0E1B2A] text-white rounded text-xs font-semibold hover:bg-[#1A2C42] transition-colors focus:outline-none focus:ring-1 focus:ring-[#C6A75E]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll Workstations</span>
          </button>
        }
      />

      {/* Command Overview Alert Banner */}
      <div className="w-full bg-[#0E1B2A] text-white border-2 border-[#0E1B2A] rounded p-5 shadow-[0_4px_0_0_rgba(14,27,42,0.08)] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="z-10 max-w-2xl space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded-xs font-mono text-[10px] font-bold uppercase bg-[#C6A75E] text-[#0E1B2A]">
              AUTONOMOUS EVALUATION
            </span>
            <h2 className="text-sm font-bold text-white font-display">
              Recent Test Submissions · Post-Exam Review & Rationale Hub
            </h2>
          </div>
          <p className="text-xs text-[#A0AEC0] leading-relaxed">
            All candidate computerized testing attempts are instantaneously evaluated upon completion. Cryptographically sealed response sheets and verified item rationales are immediately dispatched to invigilation terminals.
          </p>
        </div>

        <div className="flex items-center space-x-2 z-10 flex-shrink-0">
          <button
            type="button"
            onClick={handleAuditKeys}
            className="px-3.5 py-2 bg-white text-[#0E1B2A] hover:bg-[#EDF1F5] rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            Audit Released Keys (24)
          </button>
          <button
            type="button"
            onClick={() => toast.warning('Investigating flagged candidate deficit profiles')}
            className="px-3.5 py-2 bg-[#782525] text-white hover:bg-[#8F2E2E] rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            Investigate Deficits
          </button>
        </div>

        {/* Subtle Watermark Insignia in Backdrop */}
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none text-white">
          <Shield className="w-44 h-44 stroke-[1]" />
        </div>
      </div>

      {/* Operational Core 5-Column Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Enrolled Cadets"
          value={428}
          icon={<Users className="w-4 h-4" />}
          trend={{ value: '+18', direction: 'up' }}
          subtext="cycle intake (85.6% capacity)"
        />
        <MetricCard
          title="Active Modules"
          value="06"
          icon={<FileQuestion className="w-4 h-4 text-[#C6A75E]" />}
          subtext="in execution (4 proctored, 2 unmonitored)"
          highlight
        />
        <MetricCard
          title="Completed Today"
          value={24}
          icon={<CheckCircle2 className="w-4 h-4 text-[#234E35]" />}
          trend={{ value: '100%', direction: 'up' }}
          subtext="auto-graded with keys ready"
        />
        <MetricCard
          title="Academy Avg Score"
          value="71.4%"
          icon={<TrendingUp className="w-4 h-4 text-[#234E35]" />}
          trend={{ value: '+2.1%', direction: 'up' }}
          subtext="vs 60-day baseline benchmark"
        />
        <MetricCard
          title="Pending Retakes"
          value="08"
          icon={<RotateCcw className="w-4 h-4 text-[#7A5312]" />}
          subtext="5 technical • 3 medical (avg 4.2h)"
        />
      </div>

      {/* Analytics: 30-Day Trend Chart + Wing Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Performance Telemetry Chart */}
        <div className="lg:col-span-8 bg-white border border-[#D4D9DF] rounded p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EDF1F5] pb-3 gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] font-display">
                Cadet Cohort Score Telemetry (30-Day Spline)
              </h3>
              <p className="text-[11px] text-[#64748B]">Continuous computerized testing progression vs institutional benchmark</p>
            </div>
            <span className="px-2 py-0.5 rounded-xs font-mono text-[10px] font-bold bg-[#EDF6F0] text-[#234E35] border border-[#88BE9B]">
              STANDARD CUTOFF: 60.0%
            </span>
          </div>

          {/* High-Fidelity SVG Vector Telemetry Spline */}
          <div className="relative w-full h-56 select-none">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 760 220">
              <defs>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#455D4A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#455D4A" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line stroke="#EDF1F5" strokeWidth="1" x1="0" x2="760" y1="30" y2="30" />
              <line stroke="#EDF1F5" strokeWidth="1" x1="0" x2="760" y1="80" y2="80" />
              <line stroke="#EDF1F5" strokeWidth="1" x1="0" x2="760" y1="130" y2="130" />
              <line stroke="#EDF1F5" strokeWidth="1" x1="0" x2="760" y1="180" y2="180" />

              {/* Standard Benchmark Line (60%) */}
              <line stroke="#C6A75E" strokeDasharray="4,4" strokeWidth="1.5" x1="0" x2="760" y1="140" y2="140" />
              <text className="font-mono text-[10px] uppercase font-bold" fill="#7A5312" x="10" y="135">
                Standard Induction Benchmark (60%)
              </text>

              {/* Shaded Area Under Curve */}
              <path
                d="M 0,135 Q 70,120 130,130 T 260,95 T 390,110 T 520,65 T 650,55 T 760,42 L 760,210 L 0,210 Z"
                fill="url(#areaGradient)"
              />

              {/* Spline Path */}
              <path
                d="M 0,135 Q 70,120 130,130 T 260,95 T 390,110 T 520,65 T 650,55 T 760,42"
                fill="none"
                stroke="#0E1B2A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Discrete Data Points */}
              <circle cx="130" cy="130" r="4" fill="#FFFFFF" stroke="#0E1B2A" strokeWidth="2" />
              <circle cx="260" cy="95" r="4" fill="#FFFFFF" stroke="#0E1B2A" strokeWidth="2" />
              <circle cx="390" cy="110" r="4" fill="#FFFFFF" stroke="#0E1B2A" strokeWidth="2" />
              <circle cx="520" cy="65" r="4" fill="#FFFFFF" stroke="#0E1B2A" strokeWidth="2" />
              <circle cx="650" cy="55" r="4" fill="#FFFFFF" stroke="#0E1B2A" strokeWidth="2" />
              <circle cx="760" cy="42" r="5" fill="#455D4A" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between items-center text-[#64748B] font-mono text-[11px] pt-2">
              <span>DAY 01 (APR 12)</span>
              <span>DAY 07</span>
              <span>DAY 14</span>
              <span>DAY 21</span>
              <span>DAY 28</span>
              <span className="text-[#234E35] font-bold">TODAY (71.4%)</span>
            </div>
          </div>

          {/* Micro Metrics Footer */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#EDF1F5] bg-[#F6F8FA] p-3 rounded">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#64748B]">Monthly Peak</span>
              <div className="text-xs font-bold text-[#0E1B2A] font-display">
                76.8% <span className="font-normal text-[10px] text-[#64748B]">(Day 24)</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#64748B]">Failure Margin</span>
              <div className="text-xs font-bold text-[#782525] font-display">
                8.2% <span className="font-normal text-[10px] text-[#64748B]">(&lt;40% rate)</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#64748B]">Cognitive Variance</span>
              <div className="text-xs font-bold text-[#234E35] font-display">
                ±3.4% <span className="font-normal text-[10px] text-[#64748B]">(disciplined)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Strategic Force Comparison */}
        <div className="lg:col-span-4 bg-white border border-[#D4D9DF] rounded p-5 shadow-sm flex flex-col justify-between space-y-4">
          <div className="border-b border-[#EDF1F5] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] font-display">
              Target Force Pass Rates
            </h3>
            <p className="text-[11px] text-[#64748B]">Real-time wing aggregate benchmark</p>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-center">
            {/* Army */}
            <div className="p-3 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-[#0E1B2A] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                    PA
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0E1B2A]">Pakistan Army</span>
                    <span className="text-[10px] text-[#64748B] block font-mono">210 Candidates</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-[#234E35]">74%</span>
                  <span className="text-[9px] text-[#64748B] block uppercase">PASS RATE</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-[#EDF1F5] rounded overflow-hidden">
                <div className="h-full bg-[#455D4A] rounded" style={{ width: '74%' }} />
              </div>
            </div>

            {/* PAF */}
            <div className="p-3 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-[#153250] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                    PAF
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0E1B2A]">Pakistan Air Force</span>
                    <span className="text-[10px] text-[#64748B] block font-mono">142 Candidates</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-[#0E1B2A]">69%</span>
                  <span className="text-[9px] text-[#64748B] block uppercase">PASS RATE</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-[#EDF1F5] rounded overflow-hidden">
                <div className="h-full bg-[#0E1B2A] rounded" style={{ width: '69%' }} />
              </div>
            </div>

            {/* Navy */}
            <div className="p-3 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-[#0A2540] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                    PN
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0E1B2A]">Pakistan Navy</span>
                    <span className="text-[10px] text-[#64748B] block font-mono">76 Candidates</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-[#234E35]">72%</span>
                  <span className="text-[9px] text-[#64748B] block uppercase">PASS RATE</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-[#EDF1F5] rounded overflow-hidden">
                <div className="h-full bg-[#455D4A] rounded" style={{ width: '72%' }} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toast.info('Exporting service branch comparative ledger')}
            className="w-full h-9 bg-[#EDF1F5] hover:bg-[#E2E6EB] text-[#0E1B2A] rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Wing Breakdown</span>
          </button>
        </div>
      </div>

      {/* Recent Submissions Console & Tactical Ledger Table */}
      <div className="bg-white border border-[#D4D9DF] rounded shadow-sm overflow-hidden space-y-3">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#D4D9DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] font-display">
              Recent Submissions & Automated Key Evaluations
            </h3>
            <p className="text-[11px] text-[#64748B]">Live candidate test dockets released within the current cycle</p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs bg-white border border-[#D4D9DF] rounded px-3 py-1.5 font-mono text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
            >
              <option value="ALL">All Services (Army, PAF, Navy)</option>
              <option value="PAKISTAN_ARMY">Pakistan Army</option>
              <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option>
              <option value="PAKISTAN_NAVY">Pakistan Navy</option>
            </select>
          </div>
        </div>

        {/* Dense Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EDF1F5] text-[#0E1B2A] uppercase font-bold tracking-wider text-[11px] border-b border-[#D4D9DF]">
              <tr>
                <th className="py-3 px-4">Cadet Details</th>
                <th className="py-3 px-3">Roll ID</th>
                <th className="py-3 px-3">Module Title</th>
                <th className="py-3 px-3">Wing Target</th>
                <th className="py-3 px-3 text-right">Score</th>
                <th className="py-3 px-3 text-center">Outcome</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-4 text-right">Review & Keys</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E6EB]">
              {filteredSubmissions.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-[#F8FAFC] transition-colors ${
                    row.critical ? 'bg-[#FDF2F2]/50' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2.5">
                      <Avatar size="sm" fallbackText={row.avatarText} />
                      <div>
                        <div className="font-semibold text-[#0E1B2A]">{row.cadetName}</div>
                        <div className="text-[10px] text-[#64748B]">{row.center}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#0E1B2A]">
                    {row.rollNumber}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-[#0E1B2A]">{row.testTitle}</div>
                    <div className="text-[10px] text-[#64748B]">{row.subTitle}</div>
                  </td>
                  <td className="py-3 px-3">
                    <ForceBadge branch={row.branch} compact />
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    <span
                      className={`font-bold ${
                        row.passed ? 'text-[#234E35]' : 'text-[#782525]'
                      }`}
                    >
                      {row.scorePercent}%
                    </span>
                    <span className="block text-[10px] text-[#64748B]">{row.scoreText}</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge status={row.passed ? 'pass' : 'fail'} />
                  </td>
                  <td className="py-3 px-3 font-mono text-[#64748B]">
                    <div>{row.timestamp}</div>
                    <span className="text-[9px] text-[#94A3B8]">{row.relativeTime}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => toast.info(`Viewing solution key for ${row.cadetName}`)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-[#EDF1F5] hover:bg-[#E2E6EB] text-[#0E1B2A] border border-[#D4D9DF]"
                        title="View key & explanations"
                      >
                        <BookOpen className="w-3 h-3 text-[#234E35]" />
                        <span>View Key</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toast.info(`Dossier queued for printing: ${row.rollNumber}`)}
                        className="p-1 rounded text-[#64748B] hover:text-[#0E1B2A] hover:bg-[#EDF1F5]"
                        title="Print Official Transcript"
                      >
                        <Printer className="w-3.5 h-3.5" />
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
