import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentStore } from './studentStore';
import {
  PageHeader,
  Tabs,
  Avatar,
  ForceBadge,
  StatusBadge,
  MetricCard,
  DataTable,
  ColumnDef,
} from '@/components/ui';
import {
  Edit2,
  Phone,
  Calendar,
  FileQuestion,
  TrendingUp,
  Award,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';

interface AttemptRecord {
  id: string;
  testTitle: string;
  attemptNumber: number;
  date: string;
  scorePercent: number;
  meritRank?: number;
  passed: boolean;
  timeSpentMinutes: number;
}

const MOCK_ATTEMPTS: AttemptRecord[] = [
  {
    id: 'att-1',
    testTitle: '154 PMA Long Course Initial Mock 04',
    attemptNumber: 1,
    date: '2026-03-01',
    scorePercent: 92,
    meritRank: 2,
    passed: true,
    timeSpentMinutes: 52,
  },
  {
    id: 'att-2',
    testTitle: 'Verbal Intelligence Diagnostic Battery',
    attemptNumber: 2,
    date: '2026-02-25',
    scorePercent: 88,
    meritRank: 3,
    passed: true,
    timeSpentMinutes: 28,
  },
  {
    id: 'att-3',
    testTitle: 'Non-Verbal Spatial Relations Assessment',
    attemptNumber: 1,
    date: '2026-02-20',
    scorePercent: 94,
    meritRank: 1,
    passed: true,
    timeSpentMinutes: 30,
  },
];

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState<any>(() => (id ? studentStore.getById(id) : undefined));
  const [loading, setLoading] = useState(!student);

  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!id) return;
      try {
        const { studentService } = await import('@/services/studentService');
        const s = await studentService.getStudentById(id);
        if (isMounted && s) setStudent(s);
      } catch (e) {
        console.warn('Failed to load student detail from service:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [id]);

  if (!student && !loading) {
    return (
      <div className="p-8 text-center bg-white border border-[#D4D9DF] rounded space-y-3">
        <h3 className="text-sm font-bold text-[#0E1B2A] uppercase">Cadet Record Not Located</h3>
        <p className="text-xs text-[#64748B]">The requested cadet docket ID does not exist in the active registry.</p>
        <button
          type="button"
          onClick={() => navigate('/admin/students')}
          className="px-3 py-1.5 bg-[#0E1B2A] text-white rounded text-xs font-semibold"
        >
          Return to Cadets Roster
        </button>
      </div>
    );
  }

  const attemptColumns: ColumnDef<AttemptRecord>[] = [
    {
      header: 'Examination Title',
      cell: (row) => (
        <div>
          <span className="font-bold text-[#0E1B2A]">{row.testTitle}</span>
          <span className="block text-[10px] text-[#64748B] font-sans tabular-nums">Attempt #{row.attemptNumber}</span>
        </div>
      ),
    },
    {
      header: 'Date Attempted',
      accessorKey: 'date',
      className: 'font-sans tabular-nums text-[#64748B]',
    },
    {
      header: 'Time Spent',
      cell: (row) => (
        <span className="font-sans tabular-nums text-xs text-[#0E1B2A]">{row.timeSpentMinutes} mins</span>
      ),
    },
    {
      header: 'Score %',
      cell: (row) => (
        <span className={`font-sans tabular-nums font-bold text-xs ${row.passed ? 'text-[#234E35]' : 'text-[#782525]'}`}>
          {row.scorePercent}%
        </span>
      ),
    },
    {
      header: 'Merit Rank',
      cell: (row) => (
        <span className="px-1.5 py-0.5 rounded-xs font-sans tabular-nums text-[10px] font-bold bg-[#0E1B2A] text-[#C6A75E]">
          Rank #{row.meritRank ?? 1}
        </span>
      ),
    },
    {
      header: 'Result',
      cell: (row) => (
        <StatusBadge status={row.passed ? 'pass' : 'fail'} label={row.passed ? 'QUALIFIED' : 'FAILED'} />
      ),
    },
    {
      header: 'Action',
      align: 'right',
      cell: () => (
        <button
          type="button"
          onClick={() => toast.info('Opening official answer key transcript')}
          className="px-2 py-1 text-[11px] font-semibold bg-[#EDF1F5] hover:bg-[#E2E6EB] text-[#0E1B2A] rounded border border-[#D4D9DF]"
        >
          Inspect Sheet
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      <PageHeader
        title={student.fullName}
        subtitle={`Candidate Docket: ${student.rollNumber} | CNIC: ${student.cnic} | Branch: ${student.branch}`}
        breadcrumbs={[
          { label: 'Cadets Roster', href: '/admin/students' },
          { label: student.rollNumber },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => toast.info(`Printing candidate portfolio: ${student.rollNumber}`)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-[#D4D9DF] hover:bg-[#EDF1F5] text-[#0E1B2A] rounded text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Docket</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/admin/students/${student.id}/edit`)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#0E1B2A] hover:bg-[#1A2C42] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Modify Docket</span>
            </button>
          </div>
        }
      />

      {/* Identity Card Header */}
      <div className="bg-white border-2 border-[#0E1B2A] rounded p-6 shadow-[0_4px_0_0_rgba(14,27,42,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <Avatar
            size="lg"
            src={student.avatarUrl}
            fallbackText={student.fullName}
            className="w-16 h-16 text-lg border-2 border-[#0E1B2A]"
          />
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-bold text-[#0E1B2A] font-display">{student.fullName}</h2>
              <StatusBadge
                status={student.status === 'RETAKE_REQUIRED' ? 'retake' : student.status === 'GRADUATED' ? 'completed' : 'active'}
                label={student.status.replace('_', ' ')}
              />
            </div>
            <p className="text-xs text-[#64748B]">Son of {student.fatherName}</p>
            <div className="flex items-center space-x-3 pt-1 text-xs">
              <ForceBadge branch={student.branch} />
              <span className="font-sans text-[#0E1B2A] font-semibold">{student.targetCourse}</span>
              <span className="text-[#64748B] font-sans">Cohort: <span className="font-mono font-medium">{student.batchCode}</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-[#EDF1F5] pt-4 md:pt-0 md:pl-6 text-xs text-[#64748B] font-sans tabular-nums">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0E1B2A]" />
              <span>Enrolled: {student.enrolledAt}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-[#0E1B2A]" />
              <span>Phone: {student.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Total Attempts"
          value={student.totalAttempts || 6}
          icon={<FileQuestion className="w-4 h-4" />}
          subtext="across full mock syllabus"
        />
        <MetricCard
          title="Average Score"
          value={`${student.academicScoreAverage || 88.5}%`}
          icon={<TrendingUp className="w-4 h-4 text-[#234E35]" />}
          subtext="composite battery average"
        />
        <MetricCard
          title="Highest Score"
          value={`${student.highestScore || 94}%`}
          icon={<Award className="w-4 h-4 text-[#C6A75E]" />}
          subtext="PMA Mock 04 Screening"
        />
        <MetricCard
          title="Pass Rate"
          value={`${student.passRate || 100}%`}
          icon={<CheckCircle2 className="w-4 h-4 text-[#234E35]" />}
          subtext="qualified attempts ratio"
        />
      </div>

      {/* Detail Tabs */}
      <div className="space-y-4">
        <Tabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { id: 'overview', label: 'Candidate Overview' },
            { id: 'results', label: 'Evaluation Results', badge: 3 },
            { id: 'attempts', label: 'Attempt History', badge: 3 },
            { id: 'assigned', label: 'Assigned Test Modules', badge: 2 },
          ]}
        />

        {activeTab === 'overview' && (
          <div className="bg-white border border-[#D4D9DF] rounded p-6 shadow-sm space-y-4 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] font-display border-b border-[#EDF1F5] pb-2">
              Academy Performance Profile & Invigilation Standing
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-1.5">
                <span className="font-semibold text-[#0E1B2A]">Intelligence Battery Quotient</span>
                <p className="text-[#64748B]">
                  Verbal and Non-verbal intelligence scores maintain consistent superiority (&gt;90% accuracy). Cleared for advanced flight and tactical selection battery.
                </p>
              </div>
              <div className="p-3.5 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-1.5">
                <span className="font-semibold text-[#0E1B2A]">Academic Foundations Standing</span>
                <p className="text-[#64748B]">
                  Proficiency verified across Higher Secondary Physics, Calculus, and English. Zero remedial sessions mandated to date.
                </p>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'results' || activeTab === 'attempts') && (
          <DataTable
            columns={attemptColumns}
            data={MOCK_ATTEMPTS}
            keyExtractor={(item) => item.id}
          />
        )}

        {activeTab === 'assigned' && (
          <div className="bg-white border border-[#D4D9DF] rounded p-6 shadow-sm space-y-3 text-xs">
            <div className="p-3 bg-[#F6F8FA] border border-[#E2E6EB] rounded flex items-center justify-between">
              <div>
                <span className="font-bold text-[#0E1B2A] block">154 PMA Long Course Comprehensive Mock 07</span>
                <span className="text-[#64748B] font-sans tabular-nums text-[11px]">100 Items • 65 Minutes • Scheduled 2026-03-10</span>
              </div>
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#EDF1F5] text-[#0E1B2A]">SCHEDULED</span>
            </div>
            <div className="p-3 bg-[#F6F8FA] border border-[#E2E6EB] rounded flex items-center justify-between">
              <div>
                <span className="font-bold text-[#0E1B2A] block">Aviation Aptitude & Spatial Matrix Battery</span>
                <span className="text-[#64748B] font-sans tabular-nums text-[11px]">60 Items • 40 Minutes • Unlocked Practice</span>
              </div>
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#EDF6F0] text-[#234E35]">ACTIVE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetailPage;
