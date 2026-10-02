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

const MOCK_ATTEMPTS: AttemptRecord[] = [];

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const { studentService } = await import('@/services/studentService');
        const s = await studentService.getStudentById(id);
        if (isMounted && s) {
          setStudent(s);
        } else if (isMounted) {
          setStudent(studentStore.getById(id) || null);
        }
      } catch (e) {
        console.warn('Failed to load student detail from service:', e);
        if (isMounted) setStudent(studentStore.getById(id) || null);
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
          value={student.totalAttempts || 0}
          icon={<FileQuestion className="w-4 h-4" />}
          subtext="across completed test batteries"
        />
        <MetricCard
          title="Average Score"
          value={`${student.academicScoreAverage || 0}%`}
          icon={<TrendingUp className="w-4 h-4 text-[#234E35]" />}
          subtext="composite battery average"
        />
        <MetricCard
          title="Highest Score"
          value={`${student.highestScore || 0}%`}
          icon={<Award className="w-4 h-4 text-[#C6A75E]" />}
          subtext="highest achieved score"
        />
        <MetricCard
          title="Pass Rate"
          value={`${student.passRate || 0}%`}
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
            { id: 'results', label: 'Evaluation Results', badge: MOCK_ATTEMPTS.length },
            { id: 'attempts', label: 'Attempt History', badge: MOCK_ATTEMPTS.length },
            { id: 'assigned', label: 'Assigned Test Modules', badge: 0 },
          ]}
        />

        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Candidate Registration Particulars */}
            <div className="bg-white border border-[#D4D9DF] rounded p-6 shadow-sm space-y-4 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] font-display border-b border-[#EDF1F5] pb-2">
                Candidate Registration Particulars
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Father's Name</span>
                  <span className="font-semibold text-sm text-[#0E1B2A] block">{student.fatherName || '—'}</span>
                </div>
                <div className="p-3 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Primary Mobile Phone</span>
                  <span className="font-mono font-semibold text-sm text-[#0E1B2A] block">{student.phone || '—'}</span>
                </div>
                <div className="p-3 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">National CNIC / B-Form</span>
                  <span className="font-mono font-semibold text-sm text-[#0E1B2A] block">{student.cnic || '—'}</span>
                </div>
                <div className="p-3 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Alternate / Emergency Contact</span>
                  <span className="font-mono text-xs text-[#0E1B2A] block">{student.alternatePhone || 'None specified'}</span>
                </div>
                <div className="p-3 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Guardian & Relationship</span>
                  <span className="text-xs text-[#0E1B2A] block font-medium">
                    {student.guardianName ? `${student.guardianName} (${student.guardianRelationship || 'Guardian'})` : '—'}
                  </span>
                  {student.guardianPhone && (
                    <span className="text-[11px] font-mono text-[#64748B] block">Phone: {student.guardianPhone}</span>
                  )}
                </div>
                <div className="p-3 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Education Qualification</span>
                  <span className="text-xs text-[#0E1B2A] block font-medium">{student.education || '—'}</span>
                  {student.educationDetails && (
                    <span className="text-[11px] text-[#64748B] block">{student.educationDetails}</span>
                  )}
                </div>
                <div className="p-3 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Gender / Date of Birth</span>
                  <span className="text-xs text-[#0E1B2A] block font-medium">
                    {student.gender || 'Male'} {student.dateOfBirth ? `• ${student.dateOfBirth}` : ''}
                  </span>
                </div>
                <div className="p-3 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-1 sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">Residential Address</span>
                  <span className="text-xs text-[#0E1B2A] block font-medium">{student.address || '—'}</span>
                </div>
              </div>
            </div>

            {/* Performance Profile */}
            <div className="bg-white border border-[#D4D9DF] rounded p-6 shadow-sm space-y-4 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] font-display border-b border-[#EDF1F5] pb-2">
                Academy Performance Profile & Invigilation Standing
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-1.5">
                  <span className="font-semibold text-[#0E1B2A]">Intelligence Battery Quotient</span>
                  <p className="text-[#64748B]">
                    Evaluation standing based on completed official CBT examination modules.
                  </p>
                </div>
                <div className="p-3.5 bg-[#F6F8FA] border border-[#E2E6EB] rounded space-y-1.5">
                  <span className="font-semibold text-[#0E1B2A]">Academic Foundations Standing</span>
                  <p className="text-[#64748B]">
                    Academic proficiency verified per official forces syllabus standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'results' || activeTab === 'attempts') && (
          MOCK_ATTEMPTS.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#64748B] border border-[#D4D9DF] rounded bg-white">
              No examination attempt records found for this candidate.
            </div>
          ) : (
            <DataTable
              columns={attemptColumns}
              data={MOCK_ATTEMPTS}
              keyExtractor={(item) => item.id}
            />
          )
        )}

        {activeTab === 'assigned' && (
          <div className="py-8 text-center text-xs text-[#64748B] border border-[#D4D9DF] rounded bg-white">
            No assigned test modules found.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetailPage;
