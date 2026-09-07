import React, { useState, useEffect, useMemo } from 'react';
import {
  PageHeader,
  SearchInput,
  ForceBadge,
  StatusBadge,
  MetricCard,
  EmptyState,
} from '@/components/ui';
import { configStore } from './configStore';
import { CourseConfig } from './types';
import { MilitaryBranch } from '@/types';
import { toast } from 'sonner';
import {
  BookOpen,
  Plus,
  Edit,
  Power,
  X,
  GraduationCap,
} from 'lucide-react';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseConfig[]>(() => configStore.getCourses());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    branch: MilitaryBranch;
    durationMonths: number;
    minAge: number;
    maxAge: number;
    educationRequirement: string;
    passingMarksPercent: number;
    status: 'ACTIVE' | 'INACTIVE';
    description: string;
  }>({
    code: '',
    name: '',
    branch: 'PAKISTAN_ARMY',
    durationMonths: 24,
    minAge: 17,
    maxAge: 22,
    educationRequirement: '',
    passingMarksPercent: 60,
    status: 'ACTIVE',
    description: '',
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchCourses() {
      try {
        const { configurationService } = await import('@/services/configurationService');
        const data = await configurationService.getCourses();
        if (isMounted && data && data.length > 0) {
          setCourses(data);
        }
      } catch (e) {
        console.warn('Failed to fetch courses:', e);
      }
    }
    fetchCourses();

    const unsub = configStore.subscribe(() => {
      setCourses(configStore.getCourses());
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.educationRequirement.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBranch = selectedBranch === 'ALL' || c.branch === selectedBranch;
      const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;

      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [courses, searchQuery, selectedBranch, selectedStatus]);

  const handleOpenCreateModal = () => {
    setEditingCourseId(null);
    setFormData({
      code: '',
      name: '',
      branch: 'PAKISTAN_ARMY',
      durationMonths: 24,
      minAge: 17,
      maxAge: 22,
      educationRequirement: '',
      passingMarksPercent: 60,
      status: 'ACTIVE',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: CourseConfig) => {
    setEditingCourseId(course.id);
    setFormData({
      code: course.code,
      name: course.name,
      branch: course.branch,
      durationMonths: course.durationMonths,
      minAge: course.minAge,
      maxAge: course.maxAge,
      educationRequirement: course.educationRequirement,
      passingMarksPercent: course.passingMarksPercent,
      status: course.status,
      description: course.description || '',
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (id: string, name: string) => {
    configStore.toggleCourseStatus(id);
    toast.success(`Operational status updated for ${name}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.educationRequirement) {
      toast.error('Please fill in all mandatory course parameters');
      return;
    }

    try {
      if (editingCourseId) {
        configStore.updateCourse(editingCourseId, formData);
        toast.success(`Course ${formData.code} updated successfully`);
      } else {
        configStore.addCourse(formData);
        toast.success(`New course ${formData.code} registered successfully`);
      }
      setIsModalOpen(false);
    } catch {
      toast.error('An error occurred while saving course configuration');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      <PageHeader
        title="COMMISSIONING COURSES"
        subtitle="Accredited officer induction streams, prerequisite criteria, and minimum merit benchmarks"
        breadcrumbs={[
          { label: 'Command Console', href: '/admin/dashboard' },
          { label: 'Configuration' },
          { label: 'Courses' },
        ]}
        action={{
          label: 'Register New Course',
          icon: Plus,
          onClick: handleOpenCreateModal,
        }}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Inductions"
          value={courses.length.toString()}
          subtitle="All service academies"
          icon={<BookOpen className="w-5 h-5 text-[#0E1B2A]" />}
        />
        <MetricCard
          title="Army Programs"
          value={courses.filter((c) => c.branch === 'PAKISTAN_ARMY').length.toString()}
          subtitle="PMA / TCC / LCC"
          icon={<GraduationCap className="w-5 h-5 text-emerald-600" />}
        />
        <MetricCard
          title="PAF Streams"
          value={courses.filter((c) => c.branch === 'PAKISTAN_AIR_FORCE').length.toString()}
          subtitle="GDP & Engineering"
          icon={<GraduationCap className="w-5 h-5 text-sky-600" />}
        />
        <MetricCard
          title="Navy Branches"
          value={courses.filter((c) => c.branch === 'PAKISTAN_NAVY').length.toString()}
          subtitle="PN Cadet Executive"
          icon={<GraduationCap className="w-5 h-5 text-[#C6A75E]" />}
        />
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 border border-[#CBD5E1] rounded-md shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-80">
            <SearchInput
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              placeholder="Search course by name, code, or criteria..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-3 py-1.5 font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          title="No Courses Found"
          description="No officer commissioning courses match your query parameters."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setSearchQuery('');
              setSelectedBranch('ALL');
              setSelectedStatus('ALL');
            },
          }}
        />
      ) : (
        <div className="bg-white border border-[#CBD5E1] rounded-md overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EDF1F5] text-[#0E1B2A] font-bold text-[11px] uppercase border-b border-[#CBD5E1]">
              <tr>
                <th className="py-3 px-4">Course Name & Code</th>
                <th className="py-3 px-4">Service Branch</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Age Bracket</th>
                <th className="py-3 px-4">Education Prerequisite</th>
                <th className="py-3 px-4">Pass Cut-off</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#0E1B2A]">{course.name}</div>
                    <div className="text-[11px] font-mono text-[#64748B]">{course.code}</div>
                  </td>
                  <td className="py-3 px-4">
                    <ForceBadge branch={course.branch} />
                  </td>
                  <td className="py-3 px-4 font-sans tabular-nums font-medium text-[#0E1B2A]">
                    {course.durationMonths} Mos
                  </td>
                  <td className="py-3 px-4 font-sans tabular-nums text-[#64748B]">
                    {course.minAge}–{course.maxAge} Yrs
                  </td>
                  <td className="py-3 px-4 text-[#334155] max-w-xs">
                    {course.educationRequirement}
                  </td>
                  <td className="py-3 px-4 font-sans tabular-nums font-bold text-emerald-700">
                    {course.passingMarksPercent}%
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={course.status === 'ACTIVE' ? 'active' : 'inactive'} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        type="button"
                        title="Edit Course"
                        onClick={() => handleOpenEditModal(course)}
                        className="p-1.5 text-[#475569] hover:text-[#0E1B2A] hover:bg-[#EDF1F5] rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title={course.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggleStatus(course.id, course.name)}
                        className={`p-1.5 rounded transition-colors ${
                          course.status === 'ACTIVE'
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#CBD5E1] rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-[#0E1B2A] text-white">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#C6A75E]" />
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  {editingCourseId ? 'Edit Commissioning Course' : 'Register Commissioning Course'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 155 PMA Long Course"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 155-PMA-LC"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full text-xs font-mono uppercase px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Service Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({ ...formData, branch: e.target.value as MilitaryBranch })
                    }
                    className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  >
                    <option value="PAKISTAN_ARMY">Pakistan Army</option>
                    <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option>
                    <option value="PAKISTAN_NAVY">Pakistan Navy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Duration (Mos)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={formData.durationMonths}
                    onChange={(e) =>
                      setFormData({ ...formData, durationMonths: parseInt(e.target.value) || 24 })
                    }
                    className="w-full text-xs font-sans tabular-nums px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Min Age
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={35}
                    value={formData.minAge}
                    onChange={(e) =>
                      setFormData({ ...formData, minAge: parseInt(e.target.value) || 17 })
                    }
                    className="w-full text-xs font-sans tabular-nums px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Max Age
                  </label>
                  <input
                    type="number"
                    min={16}
                    max={40}
                    value={formData.maxAge}
                    onChange={(e) =>
                      setFormData({ ...formData, maxAge: parseInt(e.target.value) || 22 })
                    }
                    className="w-full text-xs font-sans tabular-nums px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                  Academic Prerequisite Criteria <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. F.Sc Pre-Engineering / ICS (Minimum 60% Marks)"
                  value={formData.educationRequirement}
                  onChange={(e) => setFormData({ ...formData, educationRequirement: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Passing Cut-off (%)
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={100}
                    value={formData.passingMarksPercent}
                    onChange={(e) =>
                      setFormData({ ...formData, passingMarksPercent: parseInt(e.target.value) || 60 })
                    }
                    className="w-full text-xs font-sans tabular-nums px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
                    }
                    className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] rounded border border-[#CBD5E1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-[#0E1B2A] text-white hover:bg-[#1A2C42] rounded shadow-xs"
                >
                  {editingCourseId ? 'Save Changes' : 'Register Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
