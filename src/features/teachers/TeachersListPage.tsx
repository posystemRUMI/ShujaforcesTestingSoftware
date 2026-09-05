import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  MetricCard,
  SearchInput,
  DataTable,
  ColumnDef,
  Pagination,
  EmptyState,
  StatusBadge,
  ForceBadge,
  SubjectBadge,
  Avatar,
  ConfirmDialog,
} from '@/components/ui';
import { teacherStore } from './teacherStore';
import { Teacher, TeacherRole, TeacherStatus } from './types';
import {
  Users,
  Award,
  BookOpen,
  Radio,
  Plus,
  Edit,
  Eye,
  Power,
  ShieldCheck,
} from 'lucide-react';

const ROLE_LABELS: Record<TeacherRole, string> = {
  CHIEF_EXAMINER: 'Chief Examiner',
  SENIOR_INSTRUCTOR: 'Senior Instructor',
  SUBJECT_SPECIALIST: 'Subject Specialist',
  PROCTOR_OFFICER: 'Proctor Officer',
  QUESTION_AUTHOR: 'Question Author',
};

export const TeachersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>(teacherStore.getTeachers());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    teacherId: string;
    teacherName: string;
    action: 'toggle' | 'delete';
  }>({
    isOpen: false,
    teacherId: '',
    teacherName: '',
    action: 'toggle',
  });

  useEffect(() => {
    const unsubscribe = teacherStore.subscribe(() => {
      setTeachers(teacherStore.getTeachers());
    });
    return unsubscribe;
  }, []);

  // Metrics computation
  const metrics = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter((t) => t.status === 'ACTIVE').length;
    const totalQuestions = teachers.reduce((sum, t) => sum + t.questionsCreatedCount, 0);
    const activeProctors = teachers.filter(
      (t) => t.role === 'PROCTOR_OFFICER' || t.role === 'CHIEF_EXAMINER',
    ).length;
    return { total, active, totalQuestions, activeProctors };
  }, [teachers]);

  // Filtering
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesSearch =
        t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.titleRank.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = selectedRole === 'ALL' || t.role === selectedRole;
      const matchesBranch = selectedBranch === 'ALL' || t.branchAffiliation === selectedBranch;
      const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;

      return matchesSearch && matchesRole && matchesBranch && matchesStatus;
    });
  }, [teachers, searchQuery, selectedRole, selectedBranch, selectedStatus]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / pageSize));
  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTeachers.slice(start, start + pageSize);
  }, [filteredTeachers, currentPage, pageSize]);

  const handleToggleStatus = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      teacherId: id,
      teacherName: name,
      action: 'toggle',
    });
  };

  const executeConfirmAction = () => {
    if (confirmDialog.action === 'toggle') {
      teacherStore.toggleStatus(confirmDialog.teacherId);
    }
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const columns: ColumnDef<Teacher>[] = [
    {
      id: 'faculty',
      header: 'Faculty Officer',
      cell: (teacher) => (
        <div className="flex items-center space-x-3">
          <Avatar
            name={`${teacher.titleRank} ${teacher.fullName}`}
            size="md"
            className="border border-[#CBD5E1]"
          />
          <div>
            <div className="font-bold text-[#0E1B2A] flex items-center space-x-1.5">
              <span className="text-[#C6A75E]">{teacher.titleRank}</span>
              <span>{teacher.fullName}</span>
            </div>
            <div className="text-[11px] font-mono text-[#64748B] tracking-tight">
              {teacher.employeeId} · {teacher.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Duty Role',
      cell: (teacher) => (
        <div className="flex flex-col space-y-1">
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#1C2E42]/10 text-[#0E1B2A] border border-[#1C2E42]/20 w-fit">
            <ShieldCheck className="w-3 h-3 text-[#C6A75E]" />
            <span>{ROLE_LABELS[teacher.role]}</span>
          </span>
          <span className="text-[10px] text-[#64748B]">
            {teacher.activeTestsManaged} active batteries
          </span>
        </div>
      ),
    },
    {
      id: 'branch',
      header: 'Affiliation',
      cell: (teacher) =>
        teacher.branchAffiliation === 'TRI_SERVICE' ? (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-300 border border-amber-400/30">
            Tri-Service
          </span>
        ) : (
          <ForceBadge branch={teacher.branchAffiliation} />
        ),
    },
    {
      id: 'subjects',
      header: 'Assigned Subjects',
      cell: (teacher) => (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {teacher.assignedSubjects.map((sub) => (
            <SubjectBadge key={sub} subject={sub} />
          ))}
        </div>
      ),
    },
    {
      id: 'questions',
      header: 'Authored Questions',
      cell: (teacher) => (
        <div className="font-mono text-xs">
          <span className="font-bold text-[#0E1B2A]">{teacher.questionsCreatedCount}</span>
          <span className="text-[10px] text-[#64748B] ml-1">items</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (teacher) => {
        const statusMap: Record<TeacherStatus, 'active' | 'archived' | 'on_leave'> = {
          ACTIVE: 'active',
          ON_LEAVE: 'on_leave',
          INACTIVE: 'archived',
        };
        return <StatusBadge status={statusMap[teacher.status]} />;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (teacher) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            type="button"
            title="Inspect Dossier"
            onClick={() => navigate(`/admin/teachers/${teacher.id}`)}
            className="p-1.5 text-[#475569] hover:text-[#0E1B2A] hover:bg-[#EDF1F5] rounded transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Edit Details"
            onClick={() => navigate(`/admin/teachers/${teacher.id}/edit`)}
            className="p-1.5 text-[#475569] hover:text-[#0E1B2A] hover:bg-[#EDF1F5] rounded transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            type="button"
            title={teacher.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            onClick={() =>
              handleToggleStatus(teacher.id, `${teacher.titleRank} ${teacher.fullName}`)
            }
            className={`p-1.5 rounded transition-colors ${
              teacher.status === 'ACTIVE'
                ? 'text-red-600 hover:bg-red-50'
                : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <PageHeader
        title="FACULTY & INSTRUCTORS"
        subtitle="Academic faculty, psychometric evaluators, question authors, and proctoring supervisors"
        breadcrumbs={[
          { label: 'Command Console', href: '/admin/dashboard' },
          { label: 'Faculty & Instructors' },
        ]}
        action={{
          label: 'Enrol Faculty Member',
          icon: Plus,
          onClick: () => navigate('/admin/teachers/new'),
        }}
      />

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Faculty Officers"
          value={metrics.total.toString()}
          subtitle="Accredited examiners"
          icon={<Users className="w-5 h-5 text-[#0E1B2A]" />}
        />
        <MetricCard
          title="Active on Duty"
          value={metrics.active.toString()}
          subtitle="Operational clearance"
          icon={<Award className="w-5 h-5 text-emerald-600" />}
          badge={{ text: 'Ready', variant: 'success' }}
        />
        <MetricCard
          title="Authored Questions"
          value={metrics.totalQuestions.toLocaleString()}
          subtitle="Validated in active item bank"
          icon={<BookOpen className="w-5 h-5 text-[#C6A75E]" />}
        />
        <MetricCard
          title="Supervisors & Proctors"
          value={metrics.activeProctors.toString()}
          subtitle="Cleared for exam radar duty"
          icon={<Radio className="w-5 h-5 text-sky-600" />}
        />
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 border border-[#E2E8F0] rounded-md shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-80">
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setCurrentPage(1);
              }}
              placeholder="Search by rank, name, code, or email..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-3 py-1.5 font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
            >
              <option value="ALL">All Roles</option>
              <option value="CHIEF_EXAMINER">Chief Examiner</option>
              <option value="SENIOR_INSTRUCTOR">Senior Instructor</option>
              <option value="SUBJECT_SPECIALIST">Subject Specialist</option>
              <option value="PROCTOR_OFFICER">Proctor Officer</option>
              <option value="QUESTION_AUTHOR">Question Author</option>
            </select>

            {/* Branch Filter */}
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-3 py-1.5 font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
            >
              <option value="ALL">All Service Branches</option>
              <option value="PAKISTAN_ARMY">Pakistan Army</option>
              <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option>
              <option value="PAKISTAN_NAVY">Pakistan Navy</option>
              <option value="TRI_SERVICE">Tri-Service Joint</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-3 py-1.5 font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Faculty Table */}
      {filteredTeachers.length === 0 ? (
        <EmptyState
          title="No Faculty Members Found"
          description="No instructors or examiners match the specified search query or duty filter parameters."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setSearchQuery('');
              setSelectedRole('ALL');
              setSelectedBranch('ALL');
              setSelectedStatus('ALL');
            },
          }}
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            data={paginatedTeachers}
            columns={columns}
            keyExtractor={(item) => item.id}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTeachers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Status Toggle Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={executeConfirmAction}
        title="Confirm Operational Status Change"
        description={`Are you sure you wish to toggle the operational status for ${confirmDialog.teacherName}? If deactivated, they will temporarily lose test creation and live proctoring privileges.`}
        confirmLabel="Confirm Status Update"
        variant="warning"
      />
    </div>
  );
};

export default TeachersListPage;
