import React, { useState, useEffect, useMemo } from 'react';
import {
  PageHeader,
  SearchInput,
  StatusBadge,
  MetricCard,
  EmptyState,
} from '@/components/ui';
import { configStore } from './configStore';
import { SubjectConfig } from './types';
import { toast } from 'sonner';
import {
  BookOpen,
  Brain,
  GraduationCap,
  Globe,
  Plus,
  Edit,
  Power,
  X,
  FileQuestion,
  Radio,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  INTELLIGENCE: Brain,
  ACADEMIC: GraduationCap,
  GENERAL: Globe,
};

export const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectConfig[]>(() => configStore.getSubjects());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    category: 'INTELLIGENCE' | 'ACADEMIC' | 'GENERAL';
    description: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    code: '',
    name: '',
    category: 'ACADEMIC',
    description: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchSubjects() {
      try {
        const { configurationService } = await import('@/services/configurationService');
        const data = await configurationService.getSubjects();
        if (isMounted && data && data.length > 0) {
          setSubjects(data);
        }
      } catch (e) {
        console.warn('Failed to fetch subjects:', e);
      }
    }
    fetchSubjects();

    const unsub = configStore.subscribe(() => {
      setSubjects(configStore.getSubjects());
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const totalQuestions = subjects.reduce((sum, s) => sum + s.questionCount, 0);
  const activeCount = subjects.filter((s) => s.status === 'ACTIVE').length;

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
      const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [subjects, searchQuery, selectedCategory, selectedStatus]);

  const handleOpenCreateModal = () => {
    setEditingSubjectId(null);
    setFormData({
      code: '',
      name: '',
      category: 'ACADEMIC',
      description: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (subject: SubjectConfig) => {
    setEditingSubjectId(subject.id);
    setFormData({
      code: subject.code,
      name: subject.name,
      category: subject.category,
      description: subject.description,
      status: subject.status,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (id: string, name: string) => {
    configStore.toggleSubjectStatus(id);
    toast.success(`Operational status updated for ${name}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.description) {
      toast.error('Please complete all mandatory subject fields');
      return;
    }

    try {
      if (editingSubjectId) {
        configStore.updateSubject(editingSubjectId, formData);
        toast.success(`Subject ${formData.name} updated successfully`);
      } else {
        configStore.addSubject(formData);
        toast.success(`New subject discipline ${formData.name} added`);
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Failed to save subject discipline');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      <PageHeader
        title="SUBJECT DISCIPLINES & SYLLABI"
        subtitle="Catalog of psychometric intelligence modules, academic disciplines, and general awareness taxonomies"
        breadcrumbs={[
          { label: 'Command Console', href: '/admin/dashboard' },
          { label: 'Configuration' },
          { label: 'Subjects' },
        ]}
        action={{
          label: 'Add Subject Discipline',
          icon: Plus,
          onClick: handleOpenCreateModal,
        }}
      />

      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Disciplines"
          value={subjects.length.toString()}
          subtitle="Accredited subjects"
          icon={<BookOpen className="w-5 h-5 text-[#0E1B2A]" />}
        />
        <MetricCard
          title="Active in Testing"
          value={activeCount.toString()}
          subtitle="Operational syllabi"
          icon={<Brain className="w-5 h-5 text-emerald-600" />}
        />
        <MetricCard
          title="Item Bank Coverage"
          value={totalQuestions.toLocaleString()}
          subtitle="Verified question items"
          icon={<FileQuestion className="w-5 h-5 text-[#C6A75E]" />}
        />
        <MetricCard
          title="Active Batteries"
          value="24"
          subtitle="Tests using catalog"
          icon={<Radio className="w-5 h-5 text-sky-600" />}
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 border border-[#CBD5E1] rounded-md shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-80">
            <SearchInput
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              placeholder="Search subject by title, code, or topic..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded px-3 py-1.5 font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
            >
              <option value="ALL">All Categories</option>
              <option value="INTELLIGENCE">Intelligence (Verbal / Non-Verbal)</option>
              <option value="ACADEMIC">Academic Disciplines</option>
              <option value="GENERAL">General Knowledge & Studies</option>
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

      {/* Subjects Table */}
      {filteredSubjects.length === 0 ? (
        <EmptyState
          title="No Subjects Found"
          description="No subject disciplines match the specified query parameters."
          action={{
            label: 'Clear Filters',
            onClick: () => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedStatus('ALL');
            },
          }}
        />
      ) : (
        <div className="bg-white border border-[#CBD5E1] rounded-md overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EDF1F5] text-[#0E1B2A] font-bold text-[11px] uppercase border-b border-[#CBD5E1]">
              <tr>
                <th className="py-3 px-4">Subject Name & Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description / Syllabus Scope</th>
                <th className="py-3 px-4">Question Bank Items</th>
                <th className="py-3 px-4">Active Tests</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredSubjects.map((sub) => {
                const CatIcon = CATEGORY_ICONS[sub.category] || BookOpen;
                return (
                  <tr key={sub.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0E1B2A]">{sub.name}</div>
                      <div className="text-[11px] font-mono text-[#64748B]">{sub.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F1F5F9] text-[#0E1B2A] border border-[#CBD5E1]">
                        <CatIcon className="w-3 h-3 text-[#C6A75E]" />
                        <span>{sub.category}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#475569] max-w-sm">
                      {sub.description}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#0E1B2A]">
                      {sub.questionCount} Items
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                      {sub.activeTestsCount} Tests
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={sub.status === 'ACTIVE' ? 'active' : 'inactive'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          title="Edit Discipline"
                          onClick={() => handleOpenEditModal(sub)}
                          className="p-1.5 text-[#475569] hover:text-[#0E1B2A] hover:bg-[#EDF1F5] rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title={sub.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggleStatus(sub.id, sub.name)}
                          className={`p-1.5 rounded transition-colors ${
                            sub.status === 'ACTIVE'
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#CBD5E1] rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-[#0E1B2A] text-white">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#C6A75E]" />
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  {editingSubjectId ? 'Edit Subject Discipline' : 'Add Subject Discipline'}
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
                  Subject Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verbal Intelligence, Physics, etc."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Subject Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUBJ-VERB"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full text-xs font-mono uppercase px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                    Taxonomy Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as 'INTELLIGENCE' | 'ACADEMIC' | 'GENERAL',
                      })
                    }
                    className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                  >
                    <option value="INTELLIGENCE">Intelligence (Verbal / Non-Verbal)</option>
                    <option value="ACADEMIC">Academic Disciplines</option>
                    <option value="GENERAL">General Knowledge & Studies</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                  Syllabus Description & Scope <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Outline key topics, chapters, and question types included in this subject..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                  Operational Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
                  }
                  className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
                >
                  <option value="ACTIVE">Active in Testing</option>
                  <option value="INACTIVE">Inactive (Dormant)</option>
                </select>
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
                  {editingSubjectId ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsPage;
