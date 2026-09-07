import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  PageHeader,
  ForceBadge,
  StatusBadge,
  ScoreBadge,
  Avatar,
  ProgressBar,
  MetricCard,
  Tabs,
  EmptyState,
} from '@/components/ui';
import { batchStore } from './batchStore';
import {
  Users,
  Award,
  Calendar,
  ArrowLeft,
  FileCheck,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

export const BatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');

  const batch = id ? batchStore.getBatchById(id) : undefined;
  const students = id ? batchStore.getBatchStudents(id) : [];
  const tests = id ? batchStore.getBatchTests(id) : [];

  if (!batch) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="BATCH NOT FOUND"
          breadcrumbs={[
            { label: 'Command Console', href: '/admin/dashboard' },
            { label: 'Wing Batches', href: '/admin/batches' },
            { label: 'Not Found' },
          ]}
        />
        <EmptyState
          title="Batch Record Not Found"
          description="The requested batch does not exist or has been archived."
          action={{
            label: 'Return to Batches',
            onClick: () => navigate('/admin/batches'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl">
      {/* Top Page Header */}
      <PageHeader
        title={`CONSOLE: ${batch.name}`}
        subtitle={`Cadet Cohort Code: ${batch.code} · ${batch.wing}`}
        breadcrumbs={[
          { label: 'Command Console', href: '/admin/dashboard' },
          { label: 'Wing Batches', href: '/admin/batches' },
          { label: batch.name },
        ]}
        action={{
          label: 'Back to Batches',
          icon: ArrowLeft,
          variant: 'outline',
          onClick: () => navigate('/admin/batches'),
        }}
      />

      {/* Main Cohort Overview Banner */}
      <div className="bg-white border border-[#CBD5E1] rounded-md p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4 border-b border-[#E2E8F0]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <ForceBadge branch={batch.branch} />
              <StatusBadge status={batch.status === 'ACTIVE' ? 'active' : batch.status === 'COMPLETED' ? 'completed' : 'upcoming'} />
              <span className="font-sans font-semibold text-xs text-[#0E1B2A] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#CBD5E1]">
                {batch.targetCourse}
              </span>
            </div>

            <h1 className="text-xl font-bold text-[#0E1B2A]">{batch.name}</h1>
            <p className="text-xs text-[#64748B] flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>
                Cohort Active Window: <strong className="text-[#0E1B2A]">{batch.startDate}</strong> to{' '}
                <strong className="text-[#0E1B2A]">{batch.endDate}</strong>
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to={`/admin/students/new?batch=${batch.id}`}
              className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#0E1B2A] rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#C6A75E]" />
              <span>Enrol Cadet</span>
            </Link>
            <Link
              to="/admin/test-builder"
              className="inline-flex items-center space-x-1 px-4 py-2 text-xs font-semibold bg-[#0E1B2A] text-white hover:bg-[#1A2C42] rounded transition-colors shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5 text-[#C6A75E]" />
              <span>Assign New Test</span>
            </Link>
          </div>
        </div>

        {/* 4 Telemetry Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
          <MetricCard
            title="Enrolled Strength"
            value={`${batch.cadetCount} Cadets`}
            subtitle="Full roster active"
            icon={<Users className="w-5 h-5 text-[#0E1B2A]" />}
          />
          <MetricCard
            title="Mean Aggregate"
            value={`${batch.meanAggregate}%`}
            subtitle="Current cohort average"
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          />
          <MetricCard
            title="Benchmark Pass Rate"
            value={`${batch.benchmarkPassRate}%`}
            subtitle="ISSB 75% standard"
            icon={<Award className="w-5 h-5 text-[#C6A75E]" />}
          />
          <MetricCard
            title="Assigned Tests"
            value={tests.length.toString()}
            subtitle="Diagnostic batteries"
            icon={<FileCheck className="w-5 h-5 text-sky-600" />}
          />
        </div>
      </div>

      {/* Detail Tabs (Students, Tests, Performance) */}
      <div className="bg-white border border-[#CBD5E1] rounded-md shadow-xs overflow-hidden">
        <Tabs
          tabs={[
            { id: 'students', label: `Cadet Roster (${students.length})` },
            { id: 'tests', label: `Assigned Tests & Drills (${tests.length})` },
            { id: 'performance', label: 'Cohort Performance & Merit Ranking' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="p-6">
          {/* TAB 1: STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A]">
                  Active Cadets Roster
                </span>
                <span className="text-xs text-[#64748B]">
                  Showing {students.length} candidates in {batch.name}
                </span>
              </div>

              <div className="border border-[#CBD5E1] rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EDF1F5] text-[#0E1B2A] font-bold text-[11px] uppercase border-b border-[#CBD5E1]">
                    <tr>
                      <th className="py-3 px-4">Cadet Information</th>
                      <th className="py-3 px-4">Mocks Completed</th>
                      <th className="py-3 px-4">Latest Score</th>
                      <th className="py-3 px-4">Domain Breakdown (V / NV / Acad)</th>
                      <th className="py-3 px-4">Merit Rank</th>
                      <th className="py-3 px-4">ISSB Readiness</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {students.map((cdt) => (
                      <tr key={cdt.cadetId} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <Avatar name={cdt.fullName} size="sm" />
                            <div>
                              <div className="font-bold text-[#0E1B2A]">{cdt.fullName}</div>
                              <div className="text-[11px] text-[#64748B]">
                                <span className="font-mono font-semibold">{cdt.rollNumber}</span> · <span>S/O {cdt.fatherName}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-sans tabular-nums font-semibold text-[#0E1B2A]">
                          {cdt.mocksCompleted} Mocks
                        </td>
                        <td className="py-3 px-4">
                          <ScoreBadge score={cdt.latestScore} />
                        </td>
                        <td className="py-3 px-4 font-sans tabular-nums text-[11px] text-[#475569]">
                          <span className="font-semibold text-emerald-700">{cdt.verbalScore}%</span> /{' '}
                          <span className="font-semibold text-[#0E1B2A]">{cdt.nonVerbalScore}%</span> /{' '}
                          <span className="font-semibold text-amber-700">{cdt.academicScore}%</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-sans tabular-nums font-bold bg-[#0E1B2A] text-white">
                            Rank #{cdt.meritRank ?? 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                              cdt.readiness === 'RECOMMENDED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : cdt.readiness === 'ON_TRACK'
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {cdt.readiness.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/admin/students/${cdt.cadetId}`}
                            className="inline-flex items-center space-x-1 text-xs font-semibold text-[#0E1B2A] hover:underline"
                          >
                            <span>Dossier</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TESTS */}
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A]">
                  Scheduled & Administered Test Batteries
                </span>
                <Link
                  to="/admin/test-builder"
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-[#0E1B2A] bg-[#F1F5F9] px-3 py-1.5 rounded border border-[#CBD5E1] hover:bg-[#E2E8F0]"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C6A75E]" />
                  <span>Build New Battery</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-[#F8FAFC] border border-[#CBD5E1] rounded p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#64748B]">{test.testCode}</span>
                        <h4 className="font-bold text-xs text-[#0E1B2A] leading-tight">
                          {test.testTitle}
                        </h4>
                      </div>
                      <StatusBadge
                        status={
                          test.status === 'COMPLETED'
                            ? 'active'
                            : test.status === 'SCHEDULED'
                            ? 'upcoming'
                            : 'archived'
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#64748B] bg-white p-2.5 rounded border border-[#E2E8F0]">
                      <div>
                        <span>Duration:</span>{' '}
                        <strong className="text-[#0E1B2A]">{test.durationMinutes} mins</strong>
                      </div>
                      <div>
                        <span>Questions:</span>{' '}
                        <strong className="text-[#0E1B2A]">{test.totalQuestions} items</strong>
                      </div>
                      <div>
                        <span>Cut-off:</span>{' '}
                        <strong className="text-[#0E1B2A]">{test.passingScorePercent}%</strong>
                      </div>
                      <div>
                        <span>Attempted:</span>{' '}
                        <strong className="text-emerald-700">{test.candidatesAttempted} Cadets</strong>
                      </div>
                    </div>

                    {test.status === 'COMPLETED' && (
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[#64748B]">Batch Average:</span>
                        <span className="font-sans tabular-nums font-bold text-emerald-700">
                          {test.averageScorePercent}%
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
                      <span className="font-sans tabular-nums text-[#64748B]">{test.date}</span>
                      <Link
                        to="/admin/results"
                        className="text-xs font-semibold text-[#0E1B2A] hover:underline flex items-center space-x-1"
                      >
                        <span>View Results</span>
                        <ArrowUpRight className="w-3 h-3 text-[#C6A75E]" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PERFORMANCE */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Domain Mastery Progression */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] mb-3">
                  Cognitive Domain Mastery Telemetry
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Verbal Reasoning</span>
                      <span className="font-sans tabular-nums text-emerald-700 font-bold">
                        {batch.verbalMastery}%
                      </span>
                    </div>
                    <ProgressBar value={batch.verbalMastery} variant="success" size="md" />
                    <span className="text-[11px] text-[#64748B]">
                      ISSB Benchmark: 70% · Strong Aptitude
                    </span>
                  </div>

                  <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Non-Verbal Spatial</span>
                      <span className="font-sans tabular-nums text-[#0E1B2A] font-bold">
                        {batch.nonVerbalMastery}%
                      </span>
                    </div>
                    <ProgressBar value={batch.nonVerbalMastery} variant="default" size="md" />
                    <span className="text-[11px] text-[#64748B]">
                      ISSB Benchmark: 70% · Steady
                    </span>
                  </div>

                  <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Academic Core</span>
                      <span className="font-sans tabular-nums text-amber-700 font-bold">
                        {batch.academicMastery}%
                      </span>
                    </div>
                    <ProgressBar value={batch.academicMastery} variant="warning" size="md" />
                    <span className="text-[11px] text-amber-700 font-semibold">
                      Remediation drills recommended
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Decile Distribution */}
              <div className="pt-4 border-t border-[#E2E8F0]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] mb-3">
                  Score Decile Performance Distribution
                </h3>
                <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded p-5 space-y-3">
                  <div className="grid grid-cols-9 gap-2 text-center text-xs">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((decile) => {
                      const count =
                        decile === 8 ? 14 : decile === 7 ? 12 : decile === 6 ? 8 : decile === 9 ? 4 : 2;
                      const isHigh = decile >= 7;
                      return (
                        <div key={decile} className="space-y-1">
                          <div
                            className={`w-full rounded-t transition-all ${
                              isHigh ? 'bg-emerald-600' : decile >= 5 ? 'bg-[#0E1B2A]' : 'bg-amber-500'
                            }`}
                            style={{ height: `${Math.max(20, count * 8)}px` }}
                          />
                          <div className="font-bold text-[#0E1B2A]">D-{decile}</div>
                          <div className="text-[10px] text-[#64748B] font-sans tabular-nums">{count} Cdt</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[11px] text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                    <span>Remediation Band (Deciles 1-3)</span>
                    <span>Standard Performance (Deciles 4-6)</span>
                    <span className="font-semibold text-emerald-700">
                      Top Merit Band (Deciles 7-9: 71.4%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchDetailPage;
