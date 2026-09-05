import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Phone,
} from 'lucide-react';
import {
  PageHeader,
  FilterBar,
  SearchInput,
  DataTable,
  Avatar,
  ForceBadge,
  StatusBadge,
  ScoreBadge,
  ConfirmDialog,
  ColumnDef,
} from '@/components/ui';
import { studentStore } from './studentStore';
import { StudentRecord } from './types';
import { toast } from 'sonner';

export const StudentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRecord[]>(studentStore.getAll());
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<StudentRecord | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.cnic.includes(search) ||
      s.fatherName.toLowerCase().includes(search.toLowerCase());

    const matchBranch = branchFilter === 'ALL' || s.branch === branchFilter;
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchSearch && matchBranch && matchStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedData = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    studentStore.delete(deleteTarget.id);
    setStudents(studentStore.getAll());
    toast.success(`Cadet record ${deleteTarget.rollNumber} successfully archived`);
    setDeleteTarget(null);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudentIds(next);
  };

  const columns: ColumnDef<StudentRecord>[] = [
    {
      header: '',
      width: '40px',
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedStudentIds.has(row.id)}
          onChange={() => toggleSelectOne(row.id)}
          className="w-4 h-4 rounded text-[#0E1B2A] border-[#D4D9DF] focus:ring-[#C6A75E]"
        />
      ),
    },
    {
      header: 'Cadet Identity',
      cell: (row) => (
        <div className="flex items-center space-x-2.5">
          <Avatar size="sm" fallbackText={row.fullName} />
          <div>
            <span
              onClick={() => navigate(`/admin/students/${row.id}`)}
              className="font-bold text-[#0E1B2A] hover:underline cursor-pointer block"
            >
              {row.fullName}
            </span>
            <span className="text-[10px] text-[#64748B]">S/O {row.fatherName}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Roll ID',
      accessorKey: 'rollNumber',
      className: 'font-mono font-bold text-[#0E1B2A]',
    },
    {
      header: 'Branch',
      cell: (row) => <ForceBadge branch={row.branch} compact />,
    },
    {
      header: 'Batch / Target',
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-semibold text-[#0E1B2A] block">{row.batchCode}</span>
          <span className="text-[10px] text-[#64748B]">{row.targetCourse}</span>
        </div>
      ),
    },
    {
      header: 'Contact / CNIC',
      cell: (row) => (
        <div className="font-mono text-[11px] text-[#64748B]">
          <div>{row.cnic}</div>
          <div className="flex items-center space-x-1 text-[10px]">
            <Phone className="w-2.5 h-2.5" />
            <span>{row.phone}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Readiness Avg',
      align: 'right',
      cell: (row) => (
        <ScoreBadge
          score={row.intelligenceScoreAverage}
          percentage={row.intelligenceScoreAverage}
          passed={row.intelligenceScoreAverage >= 60}
        />
      ),
    },
    {
      header: 'Status',
      align: 'center',
      cell: (row) => (
        <StatusBadge
          status={row.status === 'RETAKE_REQUIRED' ? 'retake' : row.status === 'GRADUATED' ? 'completed' : 'active'}
          label={row.status.replace('_', ' ')}
        />
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            type="button"
            onClick={() => navigate(`/admin/students/${row.id}`)}
            className="p-1 rounded text-[#0E1B2A] hover:bg-[#EDF1F5] transition-colors"
            title="Inspect Dossier"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/admin/students/${row.id}/edit`)}
            className="p-1 rounded text-[#0E1B2A] hover:bg-[#EDF1F5] transition-colors"
            title="Edit Cadet Record"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="p-1 rounded text-[#782525] hover:bg-[#FDF2F2] transition-colors"
            title="Archive Record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 select-none">
      <PageHeader
        title="Cadet Identification Dockets"
        subtitle="Pakistan Armed Forces Induction Registrations, Biometric Credentials & Academic Standings"
        breadcrumbs={[{ label: 'Cadets Roster' }]}
        actions={
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => navigate('/admin/students/import')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-[#D4D9DF] hover:bg-[#EDF1F5] text-[#0E1B2A] rounded text-xs font-semibold transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Bulk Roster Import</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/students/new')}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#0E1B2A] hover:bg-[#1A2C42] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enrol New Cadet</span>
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <FilterBar
        searchSlot={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, roll ID, CNIC, or father name..."
          />
        }
        filterSlots={
          <>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-10 px-3 bg-white border border-[#D4D9DF] rounded text-xs text-[#0E1B2A] font-mono focus:outline-none focus:border-[#0E1B2A]"
            >
              <option value="ALL">All Branches</option>
              <option value="PAKISTAN_ARMY">Pakistan Army</option>
              <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option>
              <option value="PAKISTAN_NAVY">Pakistan Navy</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 bg-white border border-[#D4D9DF] rounded text-xs text-[#0E1B2A] font-mono focus:outline-none focus:border-[#0E1B2A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="RETAKE_REQUIRED">Retake Required</option>
              <option value="GRADUATED">Graduated</option>
              <option value="DISQUALIFIED">Disqualified</option>
            </select>
          </>
        }
        activeCount={
          (search ? 1 : 0) +
          (branchFilter !== 'ALL' ? 1 : 0) +
          (statusFilter !== 'ALL' ? 1 : 0)
        }
        onResetFilters={() => {
          setSearch('');
          setBranchFilter('ALL');
          setStatusFilter('ALL');
        }}
      />

      {/* Table Master View */}
      <DataTable
        columns={columns}
        data={paginatedData}
        keyExtractor={(item) => item.id}
        emptyTitle="No Cadet Records Found"
        emptyDescription="No cadet dossiers match your current filter parameters."
        pagination={{
          currentPage,
          totalPages,
          totalRecords: filteredStudents.length,
          pageSize,
          onPageChange: setCurrentPage,
          onPageSizeChange: (newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          },
        }}
      />

      {/* Confirmation Dialog for Record Deletion */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Archive Candidate Docket"
        description={`Are you sure you want to archive the official docket for ${deleteTarget?.fullName} (${deleteTarget?.rollNumber})? This will suspend active test permissions.`}
        confirmLabel="Archive Record"
        variant="danger"
      />
    </div>
  );
};

export default StudentsListPage;
