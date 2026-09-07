import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader, ForceBadge, StatusBadge, MetricCard, EmptyState } from '@/components/ui';
import { configStore } from './configStore';
import {
  ArrowLeft,
  Building,
  MapPin,
  BookOpen,
  Users,
  FileQuestion,
  Radio,
  ExternalLink,
} from 'lucide-react';

export const ForceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const force = id ? configStore.getForceById(id) : undefined;
  const courses = force ? configStore.getCoursesByForce(force.branch) : [];

  if (!force) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="FORCE BRANCH NOT FOUND"
          breadcrumbs={[
            { label: 'Command Console', href: '/admin/dashboard' },
            { label: 'Forces', href: '/admin/forces' },
            { label: 'Not Found' },
          ]}
        />
        <EmptyState
          title="Branch Not Found"
          description="The requested defense service branch is not cataloged in the system."
          action={{
            label: 'Return to Forces Overview',
            onClick: () => navigate('/admin/forces'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      <PageHeader
        title={force.name}
        subtitle={`Service Command: ${force.headquarters}`}
        breadcrumbs={[
          { label: 'Command Console', href: '/admin/dashboard' },
          { label: 'Armed Forces Branches', href: '/admin/forces' },
          { label: force.name },
        ]}
        action={{
          label: 'Back to Forces',
          icon: ArrowLeft,
          variant: 'outline',
          onClick: () => navigate('/admin/forces'),
        }}
      />

      {/* Main Banner Card */}
      <div className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div className="space-y-2">
            <ForceBadge branch={force.branch} />
            <h1 className="text-2xl font-bold text-[#0E1B2A]">{force.name}</h1>
            <div className="bg-[#F8FAFC] border-l-3 border-[#C6A75E] px-3 py-2 rounded-r">
              <p className="text-xs italic font-bold text-[#0E1B2A]">"{force.motto}"</p>
              <p className="text-[11px] text-[#64748B]">{force.mottoTranslation}</p>
            </div>
          </div>

          <div className="text-right space-y-1 text-xs text-[#64748B]">
            <div className="flex items-center space-x-1.5 md:justify-end">
              <Building className="w-3.5 h-3.5 text-[#94A3B8]" />
              <strong className="text-[#0E1B2A]">{force.headquarters}</strong>
            </div>
            <div className="flex items-center space-x-1.5 md:justify-end">
              <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>{force.inductionCenter}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#334155] leading-relaxed">{force.description}</p>

        {/* 4 Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3">
          <MetricCard
            title="Commissioning Courses"
            value={courses.length.toString()}
            subtitle="Officer programs"
            icon={<BookOpen className="w-5 h-5 text-[#0E1B2A]" />}
          />
          <MetricCard
            title="Enrolled Cadets"
            value={force.enrolledCadetsCount.toString()}
            subtitle="Under active preparation"
            icon={<Users className="w-5 h-5 text-emerald-600" />}
          />
          <MetricCard
            title="Item Bank Coverage"
            value={force.totalQuestionsCount.toLocaleString()}
            subtitle="Categorized items"
            icon={<FileQuestion className="w-5 h-5 text-[#C6A75E]" />}
          />
          <MetricCard
            title="Active Batteries"
            value={force.activeTestsCount.toString()}
            subtitle="Online mock tests"
            icon={<Radio className="w-5 h-5 text-sky-600" />}
          />
        </div>
      </div>

      {/* Associated Courses */}
      <div className="bg-white border border-[#CBD5E1] rounded-lg shadow-xs overflow-hidden space-y-3 p-6">
        <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0E1B2A]">
              Accredited Commissioning Courses ({courses.length})
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Specific entrance and induction qualifications for {force.name}
            </p>
          </div>
          <Link
            to="/admin/courses"
            className="text-xs font-semibold text-[#0E1B2A] hover:underline flex items-center space-x-1"
          >
            <span>Manage All Courses</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="border border-[#CBD5E1] rounded overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EDF1F5] text-[#0E1B2A] font-bold text-[11px] uppercase border-b border-[#CBD5E1]">
              <tr>
                <th className="py-3 px-4">Course Designation</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Age Bracket</th>
                <th className="py-3 px-4">Academic Prerequisite</th>
                <th className="py-3 px-4">Cut-off</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#0E1B2A]">{course.name}</div>
                    <div className="text-[11px] font-mono text-[#64748B]">{course.code}</div>
                  </td>
                  <td className="py-3 px-4 font-sans tabular-nums font-medium text-[#0E1B2A]">{course.durationMonths} Months</td>
                  <td className="py-3 px-4 font-sans tabular-nums text-[#64748B]">{course.minAge}–{course.maxAge} Years</td>
                  <td className="py-3 px-4 max-w-xs text-[#475569]">{course.educationRequirement}</td>
                  <td className="py-3 px-4 font-sans tabular-nums font-bold text-emerald-700">{course.passingMarksPercent}%</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={course.status === 'ACTIVE' ? 'active' : 'inactive'} />
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

export default ForceDetailPage;
