import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, SubjectBadge } from '@/components/ui';
import { teacherService } from '@/services/teacherService';
import { Teacher } from './types';
import { Edit } from 'lucide-react';
export const TeacherDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();const navigate = useNavigate();
  const [teacher, setTeacher] = useState<Teacher>();const [loading, setLoading] = useState(true);const [error, setError] = useState('');
  useEffect(() => { let live = true;
    if (id) teacherService.getTeacherById(id).then(t => { if (live) setTeacher(t); }).catch(e => { if (live) setError(e.message); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [id]);
  return <div className="staff-page staff-teacher-detail space-y-6 max-w-4xl">
    <PageHeader title={teacher ? teacher.titleRank+' '+teacher.fullName : 'FACULTY RECORD'} breadcrumbs={[{ label: 'Faculty', href: '/admin/teachers' }]}
      action={teacher ? { label: 'Edit Faculty', icon: Edit, onClick: () => navigate('/admin/teachers/'+teacher.id+'/edit') } : undefined} />
    {loading ? <p>Loading faculty?</p> : error ? <p role="alert">Could not load faculty: {error}</p> : !teacher ? <p>Faculty member not found.</p> : <>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border rounded p-5 text-sm">
        {Object.entries({ 'Faculty Code': teacher.employeeId, 'Title / Rank': teacher.titleRank, Name: teacher.fullName, Email: teacher.email, Phone: teacher.phone, Affiliation: teacher.branchAffiliation.replace(/_/g,' '), Joined: teacher.joinedAt }).map(([label,value]) =>
          <div key={label} className="min-w-0"><dt className="font-semibold">{label}</dt><dd className="break-words">{value}</dd></div>)}
      </dl>
      <section className="space-y-3"><h2 className="font-semibold">Assigned Subjects</h2><div className="flex flex-wrap gap-2">{teacher.assignedSubjects.map(s => <SubjectBadge key={s} subject={s} />)}</div></section>
    </>}
  </div>;
};
export default TeacherDetailPage;
