import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  MetricCard,
  SearchInput,
  ForceBadge,
  StatusBadge,
  ProgressBar,
  EmptyState,
} from '@/components/ui';
import { batchStore } from './batchStore';
import { BatchItem } from './types';
import { MilitaryBranch } from '@/types';
import { toast } from 'sonner';
import {
  Users,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  School,
  Calendar,
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  TrendingUp,
  X,
  FileCheck,
} from 'lucide-react';

export const BatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<BatchItem[]>(() => batchStore.getBatches());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New batch form state
  const [newBatch, setNewBatch] = useState({
    name: '',
    code: '',
    wing: '',
    targetCourse: '',
    branch: 'PAKISTAN_ARMY' as MilitaryBranch,
    cadetCount: 30,
    startDate: '2026-03-01',
    endDate: '2026-08-31',
    status: 'ACTIVE' as const,
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchBatches() {
      try {
        const { batchService } = await import('@/services/batchService');
        const data = await batchService.getBatches();
        if (isMounted && data && data.length > 0) {
          setBatches(data);
        }
      } catch (e) {
        console.warn('Failed to fetch batches:', e);
      }
    }
    fetchBatches();

    const unsub = batchStore.subscribe(() => {
      setBatches(batchStore.getBatches());
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Compute metrics
  const totalCadets = useMemo(
    () => batches.reduce((sum, b) => sum + b.cadetCount, 0),
    [batches],
  );
  const avgPassRate = useMemo(() => {
    if (batches.length === 0) return 0;
    const sum = batches.reduce((acc, b) => acc + b.benchmarkPassRate, 0);
    return (sum / batches.length).toFixed(1);
  }, [batches]);

  // Flagship batch
  const flagshipBatch = useMemo(
    () => batches.find((b) => b.isFlagship) || batches[0],
    [batches],
  );

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.targetCourse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.wing.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBranch = selectedBranch === 'ALL' || b.branch === selectedBranch;
      const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;

      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [batches, searchQuery, selectedBranch, selectedStatus]);

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.name || !newBatch.code || !newBatch.targetCourse) {
      toast.error('Please fill in all mandatory batch identifiers');
      return;
    }

    try {
      batchStore.addBatch(newBatch);
      toast.success(`Wing Batch ${newBatch.code} registered successfully`);
      setIsCreateModalOpen(false);
      setNewBatch({
        name: '',
        code: '',
        wing: '',
        targetCourse: '',
        branch: 'PAKISTAN_ARMY',
        cadetCount: 30,
        startDate: '2026-03-01',
        endDate: '2026-08-31',
        status: 'ACTIVE',
      });
    } catch {
      toast.error('Failed to create batch');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <PageHeader
        title="WING BATCHES & CADRES"
        subtitle="Tactical cadet cohorts, induction training courses, and performance telemetry consoles"
        breadcrumbs={[
          { label: 'Command Console', href: '/admin/dashboard' },
          { label: 'Wing Batches' },
        ]}
        action={{
          label: 'Register New Batch',
          icon: Plus,
          onClick: () => setIsCreateModalOpen(true),
        }}
      />

      {/* 4 Top KPI Cards (from Stitch UI-002) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Enrolled Cadets"
          value={totalCadets.toString()}
          subtitle="6 Active training wings"
          icon={<Users className="w-5 h-5 text-[#0E1B2A]" />}
          trend={{ value: '+24', direction: 'up' }}
        />
        <MetricCard
          title="Benchmark Pass Rate"
          value={`${avgPassRate}%`}
          subtitle="Institutional 75% goal"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          badge={{ text: '+3.8% Cycle', variant: 'success' }}
        />
        <MetricCard
          title="Auto-Graded Submissions"
          value="1,894"
          subtitle="100% instant resolution"
          icon={<Zap className="w-5 h-5 text-[#C6A75E]" />}
          badge={{ text: 'Zero Latency', variant: 'neutral' }}
        />
        <MetricCard
          title="Pending Retake Requests"
          value="14"
          subtitle="Action required by Senior Proctor"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          badge={{ text: 'Defcon 2', variant: 'warning' }}
        />
      </div>

      {/* Flagship Batch Spotlight Card (Stitch UI-002 Focus Section) */}
      {flagshipBatch && (
        <div className="bg-white border border-[#CBD5E1] rounded-md p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-[#E2E8F0]">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0E1B2A] text-white">
                  Flagship Batch Focus
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>ISSB Recommended Cadre</span>
                </span>
                <ForceBadge branch={flagshipBatch.branch} />
              </div>

              <h2 className="text-xl font-bold text-[#0E1B2A] flex items-center space-x-2">
                <span>Batch: {flagshipBatch.name}</span>
                <span className="text-xs font-sans font-normal text-[#64748B]">
                  ({flagshipBatch.wing})
                </span>
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B] pt-0.5">
                <span className="flex items-center space-x-1 text-[#0E1B2A] font-semibold">
                  <School className="w-3.5 h-3.5 text-[#C6A75E]" />
                  <span className="tabular-nums">{flagshipBatch.cadetCount} Cadets Enrolled</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="tabular-nums">6 Full Mocks Administered</span>
                </span>
                <span>•</span>
                <span>
                  Mean Aggregate:{' '}
                  <strong className="text-[#0E1B2A] font-sans tabular-nums font-bold">{flagshipBatch.meanAggregate}%</strong>
                </span>
                <span>•</span>
                <span className="text-amber-700 font-medium">
                  Next Mock: {flagshipBatch.nextMockDate || 'TBD'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate(`/admin/batches/${flagshipBatch.id}`)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-[#0E1B2A] text-white rounded hover:bg-[#1A2C42] transition-colors shadow-xs"
              >
                <span>Console Drilldown</span>
                <ArrowUpRight className="w-4 h-4 text-[#C6A75E]" />
              </button>
            </div>
          </div>

          {/* Mastery Progression Bars Grid (Stitch UI-002) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
            {/* Domain 1 */}
            <div className="p-3.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#0E1B2A]">Verbal Intelligence & Speed</span>
                <span className="font-sans tabular-nums text-emerald-700 font-bold">
                  {flagshipBatch.verbalMastery}%
                </span>
              </div>
              <ProgressBar value={flagshipBatch.verbalMastery} variant="success" size="sm" />
              <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                <span>High Proficiency (ISSB Cut: 70%)</span>
                <span className="text-emerald-700 font-bold">Class Rank 1</span>
              </div>
            </div>

            {/* Domain 2 */}
            <div className="p-3.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#0E1B2A]">Non-Verbal & Matrix Reasoning</span>
                <span className="font-sans tabular-nums text-[#0E1B2A] font-bold">
                  {flagshipBatch.nonVerbalMastery}%
                </span>
              </div>
              <ProgressBar value={flagshipBatch.nonVerbalMastery} variant="default" size="sm" />
              <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                <span>Target Metric Standard Met</span>
                <span className="text-[#0E1B2A] font-semibold">Median Steady</span>
              </div>
            </div>

            {/* Domain 3 */}
            <div className="p-3.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#0E1B2A]">Academic Core (Phy / Math / Eng)</span>
                <span className="font-sans tabular-nums text-amber-700 font-bold">
                  {flagshipBatch.academicMastery}%
                </span>
              </div>
              <ProgressBar value={flagshipBatch.academicMastery} variant="warning" size="sm" />
              <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                <span className="text-amber-700 font-semibold">Remediation Focus Required</span>
                <span>Below 70% Cut-off</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-4 border border-[#CBD5E1] rounded-md shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-80">
            <SearchInput
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              placeholder="Search by cohort name, code, or wing..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Branch Filter */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-3 py-1.5 font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
            >
              <option value="ALL">All Service Branches</option>
              <option value="PAKISTAN_ARMY">Pakistan Army</option>
              <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option>
              <option value="PAKISTAN_NAVY">Pakistan Navy</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-3 py-1.5 font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="UPCOMING">Upcoming</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center border border-[#CBD5E1] rounded p-0.5 bg-[#F8FAFC]">
              <button
                type="button"
                title="Grid View"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#0E1B2A] text-white'
                    : 'text-[#64748B] hover:text-[#0E1B2A]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Table View"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#0E1B2A] text-white'
                    : 'text-[#64748B] hover:text-[#0E1B2A]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batches Display */}
      {filteredBatches.length === 0 ? (
        <EmptyState
          title="No Batches Found"
          description="No cadet cadres match the specified filter or query terms."
          action={{
            label: 'Reset Filters',
            onClick: () => {
              setSearchQuery('');
              setSelectedBranch('ALL');
              setSelectedStatus('ALL');
            },
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBatches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white border border-[#CBD5E1] hover:border-[#0E1B2A] rounded-md p-5 shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                      {batch.code}
                    </span>
                    <h3 className="text-base font-bold text-[#0E1B2A] leading-tight">
                      {batch.name}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">{batch.wing}</p>
                  </div>
                  <StatusBadge status={batch.status === 'ACTIVE' ? 'active' : batch.status === 'COMPLETED' ? 'completed' : 'upcoming'} />
                </div>

                <div className="flex items-center space-x-2">
                  <ForceBadge branch={batch.branch} />
                  <span className="text-[11px] font-semibold text-[#475569]">
                    {batch.targetCourse}
                  </span>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded text-xs space-y-2">
                  <div className="flex items-center justify-between text-[#475569]">
                    <span className="flex items-center space-x-1.5">
                      <School className="w-3.5 h-3.5 text-[#C6A75E]" />
                      <span>Cadet Strength:</span>
                    </span>
                    <strong className="font-sans tabular-nums text-[#0E1B2A]">{batch.cadetCount} Candidates</strong>
                  </div>

                  <div className="flex items-center justify-between text-[#475569]">
                    <span className="flex items-center space-x-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mean Aggregate:</span>
                    </span>
                    <strong className="font-sans tabular-nums text-emerald-700">{batch.meanAggregate}%</strong>
                  </div>

                  <div className="pt-1.5 border-t border-[#E2E8F0] space-y-1">
                    <div className="flex justify-between text-[11px] text-[#64748B]">
                      <span>Benchmark Mastery</span>
                      <span className="font-sans tabular-nums font-semibold text-[#0E1B2A]">
                        {batch.benchmarkPassRate}%
                      </span>
                    </div>
                    <ProgressBar value={batch.benchmarkPassRate} variant="gold" size="sm" />
                  </div>
                </div>

                <div className="flex items-center text-[11px] text-[#64748B] space-x-1 font-sans tabular-nums">
                  <Calendar className="w-3 h-3 text-[#94A3B8]" />
                  <span>
                    {batch.startDate} to {batch.endDate}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/students?batch=${batch.id}`)}
                  className="text-xs font-semibold text-[#475569] hover:text-[#0E1B2A] transition-colors"
                >
                  View Cadets ({batch.cadetCount})
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/batches/${batch.id}`)}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold bg-[#0E1B2A] text-white hover:bg-[#1A2C42] rounded transition-colors shadow-xs"
                >
                  <span>Inspect Console</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C6A75E]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#CBD5E1] rounded overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EDF1F5] text-[#0E1B2A] font-bold text-[11px] uppercase border-b border-[#CBD5E1]">
              <tr>
                <th className="py-3 px-4">Batch / Wing</th>
                <th className="py-3 px-4">Force Branch</th>
                <th className="py-3 px-4">Target Course</th>
                <th className="py-3 px-4">Strength</th>
                <th className="py-3 px-4">Aggregate</th>
                <th className="py-3 px-4">Pass Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredBatches.map((batch) => (
                <tr key={batch.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#0E1B2A]">{batch.name}</div>
                    <div className="text-[11px] text-[#64748B]">
                      <span className="font-mono">{batch.code}</span> · <span>{batch.wing}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <ForceBadge branch={batch.branch} />
                  </td>
                  <td className="py-3 px-4 font-medium text-[#334155]">{batch.targetCourse}</td>
                  <td className="py-3 px-4 font-sans tabular-nums font-bold text-[#0E1B2A]">{batch.cadetCount}</td>
                  <td className="py-3 px-4 font-sans tabular-nums font-semibold text-emerald-700">{batch.meanAggregate}%</td>
                  <td className="py-3 px-4 font-sans tabular-nums font-semibold text-[#0E1B2A]">{batch.benchmarkPassRate}%</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={batch.status === 'ACTIVE' ? 'active' : batch.status === 'COMPLETED' ? 'completed' : 'upcoming'} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/batches/${batch.id}`)}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#0E1B2A] text-white hover:bg-[#1A2C42] rounded transition-colors"
                    >
                      Console
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register New Batch Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#CBD5E1] rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-[#0E1B2A] text-white">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-[#C6A75E]" />
                <h3 className="text-sm font-bold tracking-wide uppercase">Register New Wing Cadre</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                  Batch Designation Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 155 PMA Long Course"
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Cohort Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BATCH-2026-PMA155"
                    value={newBatch.code}
                    onChange={(e) => setNewBatch({ ...newBatch, code: e.target.value.toUpperCase() })}
                    className="w-full text-xs font-mono uppercase px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Service Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newBatch.branch}
                    onChange={(e) =>
                      setNewBatch({ ...newBatch, branch: e.target.value as MilitaryBranch })
                    }
                    className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  >
                    <option value="PAKISTAN_ARMY">Pakistan Army</option>
                    <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option>
                    <option value="PAKISTAN_NAVY">Pakistan Navy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                  Target Induction Course <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 155 PMA Long Course (Regular Commission)"
                  value={newBatch.targetCourse}
                  onChange={(e) => setNewBatch({ ...newBatch, targetCourse: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Training Wing / Sector
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bravo Wing (Kakul Sector)"
                    value={newBatch.wing}
                    onChange={(e) => setNewBatch({ ...newBatch, wing: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Initial Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={newBatch.cadetCount}
                    onChange={(e) =>
                      setNewBatch({ ...newBatch, cadetCount: parseInt(e.target.value) || 30 })
                    }
                    className="w-full text-xs font-sans tabular-nums px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Commencement Date
                  </label>
                  <input
                    type="date"
                    value={newBatch.startDate}
                    onChange={(e) => setNewBatch({ ...newBatch, startDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Passing Out Date
                  </label>
                  <input
                    type="date"
                    value={newBatch.endDate}
                    onChange={(e) => setNewBatch({ ...newBatch, endDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] rounded border border-[#CBD5E1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-[#0E1B2A] text-white hover:bg-[#1A2C42] rounded shadow-xs"
                >
                  Save & Register Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchesPage;
