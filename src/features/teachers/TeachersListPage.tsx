import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, DataTable, ColumnDef, SubjectBadge, ForceBadge } from '@/components/ui';
import { teacherService } from '@/services/teacherService';
import { Teacher } from './types';
import { Plus, Eye, Edit } from 'lucide-react';
export const TeachersListPage: React.FC = () => {
  const navigate = useNavigate();const [teachers, setTeachers] = useState<Teacher[]>([]);const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');const [search, setSearch] = useState('');const [branch, setBranch] = useState('ALL');const [page, setPage] = useState(1);
  useEffect(() => { let live = true;
    teacherService.getTeachers().then(t => { if (live) setTeachers(t); }).catch(e => { if (live) setError(e.message); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);
  const filtered = teachers.filter(t => (branch === 'ALL' || t.branchAffiliation === branch) && [t.fullName,t.titleRank,t.employeeId,t.email].join(' ').toLowerCase().includes(search.toLowerCase()));
  const columns: ColumnDef<Teacher>[] = [
    { header: 'Faculty Code', accessorKey: 'employeeId' },{ header: 'Faculty Member', cell: t => <span>{t.titleRank} {t.fullName}</span> },
    { header: 'Email', accessorKey: 'email' },{ header: 'Phone', accessorKey: 'phone' },
    { header: 'Affiliation', cell: t => t.branchAffiliation === 'TRI_SERVICE' ? 'Tri-Service' : <ForceBadge branch={t.branchAffiliation} /> },
    { header: 'Assigned Subjects', cell: t => <div className="flex flex-wrap gap-1">{t.assignedSubjects.map(s => <SubjectBadge key={s} subject={s} />)}</div> },
    { header: 'Actions', cell: t => <div className="flex gap-2">
      <button type="button" title="View Faculty" onClick={() => navigate('/admin/teachers/'+t.id)}><Eye className="w-4 h-4" /></button>
      <button type="button" title="Edit Faculty" onClick={() => navigate('/admin/teachers/'+t.id+'/edit')}><Edit className="w-4 h-4" /></button>
    </div> },
  ];
  return <div className="space-y-6">
    <PageHeader title="FACULTY & INSTRUCTORS" action={{ label: 'Enrol Faculty Member', icon: Plus, onClick: () => navigate('/admin/teachers/new') }} />
    <div className="font-semibold text-sm">Total Faculty: {teachers.length}</div>
    <div className="flex flex-col sm:flex-row gap-3">
      <input aria-label="Search faculty" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search faculty" className="border rounded px-3 py-2 text-sm flex-1 min-w-0" />
      <select aria-label="Faculty branch" value={branch} onChange={e => { setBranch(e.target.value); setPage(1); }} className="border rounded px-3 py-2 text-sm">
        <option value="ALL">All Branches</option><option value="PAKISTAN_ARMY">Pakistan Army</option><option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option><option value="PAKISTAN_NAVY">Pakistan Navy</option><option value="TRI_SERVICE">Tri-Service</option>
      </select>
    </div>
    {error ? <p role="alert" className="text-red-700">Could not load faculty: {error}</p> :
      <DataTable data={filtered.slice((page-1)*10,page*10)} columns={columns} keyExtractor={t => t.id} isLoading={loading} emptyTitle="No Faculty Members" emptyDescription=""
        pagination={{ currentPage: page, totalPages: Math.max(1,Math.ceil(filtered.length/10)), totalRecords: filtered.length, pageSize: 10, onPageChange: setPage }} />}
  </div>;
};
export default TeachersListPage;
