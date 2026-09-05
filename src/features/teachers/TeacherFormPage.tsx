import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader, FormSection } from '@/components/ui';
import { teacherSchema, TeacherFormData } from './teacherSchema';
import { teacherStore } from './teacherStore';
import { SubjectCategory } from '@/types';
import { toast } from 'sonner';
import { Save, ArrowLeft } from 'lucide-react';

const ALL_SUBJECTS: { id: SubjectCategory; label: string }[] = [
  { id: 'INTELLIGENCE_VERBAL', label: 'Verbal Intelligence' },
  { id: 'INTELLIGENCE_NON_VERBAL', label: 'Non-Verbal Intelligence' },
  { id: 'ACADEMIC_PHYSICS', label: 'Academic Physics' },
  { id: 'ACADEMIC_MATH', label: 'Academic Mathematics' },
  { id: 'ACADEMIC_ENGLISH', label: 'Academic English' },
  { id: 'GENERAL_KNOWLEDGE', label: 'General Knowledge & Pak Studies' },
];

export const TeacherFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const existingTeacher = id ? teacherStore.getTeacherById(id) : undefined;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      fullName: '',
      titleRank: 'Maj.',
      employeeId: '',
      email: '',
      phone: '',
      branchAffiliation: 'PAKISTAN_ARMY',
      role: 'SENIOR_INSTRUCTOR',
      status: 'ACTIVE',
      assignedSubjects: ['INTELLIGENCE_VERBAL'],
      bio: '',
    },
  });

  useEffect(() => {
    if (isEdit) {
      if (!existingTeacher) {
        toast.error('Faculty member record not found');
        navigate('/admin/teachers');
        return;
      }
      reset({
        fullName: existingTeacher.fullName,
        titleRank: existingTeacher.titleRank,
        employeeId: existingTeacher.employeeId,
        email: existingTeacher.email,
        phone: existingTeacher.phone,
        branchAffiliation: existingTeacher.branchAffiliation,
        role: existingTeacher.role,
        status: existingTeacher.status,
        assignedSubjects: existingTeacher.assignedSubjects,
        bio: existingTeacher.bio || '',
      });
    }
  }, [isEdit, existingTeacher, reset, navigate]);

  const selectedSubjects = watch('assignedSubjects') || [];

  const toggleSubject = (sub: SubjectCategory) => {
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length === 1) {
        toast.warning('At least one subject must remain assigned');
        return;
      }
      setValue(
        'assignedSubjects',
        selectedSubjects.filter((s) => s !== sub),
        { shouldValidate: true },
      );
    } else {
      setValue('assignedSubjects', [...selectedSubjects, sub], { shouldValidate: true });
    }
  };

  const onSubmit = (data: TeacherFormData) => {
    try {
      if (isEdit && id) {
        teacherStore.updateTeacher(id, data);
        toast.success('Faculty profile updated successfully');
      } else {
        teacherStore.addTeacher(data);
        toast.success('New faculty officer enrolled successfully');
      }
      navigate('/admin/teachers');
    } catch {
      toast.error('An unexpected error occurred while saving the record');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <PageHeader
        title={isEdit ? 'EDIT FACULTY RECORD' : 'ENROL FACULTY OFFICER'}
        subtitle={
          isEdit
            ? `Updating credentials and duties for ${existingTeacher?.titleRank} ${existingTeacher?.fullName}`
            : 'Register an instructor, examiner, or proctor with academic and testing clearance'
        }
        breadcrumbs={[
          { label: 'Command Console', href: '/admin/dashboard' },
          { label: 'Faculty & Instructors', href: '/admin/teachers' },
          { label: isEdit ? 'Edit Record' : 'Enrol Faculty' },
        ]}
        action={{
          label: 'Back to Faculty',
          icon: ArrowLeft,
          variant: 'outline',
          onClick: () => navigate('/admin/teachers'),
        }}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Officer Identification */}
        <FormSection
          title="Identity & Service Branch"
          description="Institutional ranking, full legal name, employee code, and branch clearance"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                Title / Rank <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('titleRank')}
                placeholder="e.g. Maj., Lt. Cdr, Dr., Engr."
                className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              />
              {errors.titleRank && (
                <p className="text-[11px] text-red-500 mt-1">{errors.titleRank.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('fullName')}
                placeholder="e.g. Tariq Mehmood"
                className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              />
              {errors.fullName && (
                <p className="text-[11px] text-red-500 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                Faculty Code (ID) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('employeeId')}
                placeholder="e.g. FAC-2024-08"
                className="w-full text-xs font-mono uppercase px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              />
              {errors.employeeId && (
                <p className="text-[11px] text-red-500 mt-1">{errors.employeeId.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                Service Branch Affiliation <span className="text-red-500">*</span>
              </label>
              <select
                {...register('branchAffiliation')}
                className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              >
                <option value="PAKISTAN_ARMY">Pakistan Army</option>
                <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option>
                <option value="PAKISTAN_NAVY">Pakistan Navy</option>
                <option value="TRI_SERVICE">Tri-Service Joint Headquarters</option>
              </select>
              {errors.branchAffiliation && (
                <p className="text-[11px] text-red-500 mt-1">{errors.branchAffiliation.message}</p>
              )}
            </div>
          </div>
        </FormSection>

        {/* Section 2: Contact & Official Communications */}
        <FormSection
          title="Communications & Clearance"
          description="Official academy email and emergency telephone docket"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                Academic Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="officer.name@forcesacademy.edu.pk"
                className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              />
              {errors.email && (
                <p className="text-[11px] text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('phone')}
                placeholder="+92 300 0000000"
                className="w-full text-xs font-mono px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              />
              {errors.phone && (
                <p className="text-[11px] text-red-500 mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>
        </FormSection>

        {/* Section 3: Duty Designation & Status */}
        <FormSection
          title="Faculty Role & Operational Status"
          description="Define exam-management permissions and administrative standing"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                Assigned Duty Role <span className="text-red-500">*</span>
              </label>
              <select
                {...register('role')}
                className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              >
                <option value="CHIEF_EXAMINER">Chief Examiner (Curriculum & Blueprint Clearance)</option>
                <option value="SENIOR_INSTRUCTOR">Senior Instructor (Question Review & Cadets)</option>
                <option value="SUBJECT_SPECIALIST">Subject Specialist (Item Bank Authoring)</option>
                <option value="PROCTOR_OFFICER">Proctor Officer (Live Radar Monitoring)</option>
                <option value="QUESTION_AUTHOR">Question Author (Content Drafts)</option>
              </select>
              {errors.role && (
                <p className="text-[11px] text-red-500 mt-1">{errors.role.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] mb-1">
                Operational Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register('status')}
                className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              >
                <option value="ACTIVE">Active Duty (Full System Access)</option>
                <option value="ON_LEAVE">On Leave (Temporary Inactive)</option>
                <option value="INACTIVE">Inactive (Suspended Credentials)</option>
              </select>
              {errors.status && (
                <p className="text-[11px] text-red-500 mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>
        </FormSection>

        {/* Section 4: Assigned Subject Specialties */}
        <FormSection
          title="Assigned Subject Domains"
          description="Disciplines for question generation, evaluation, and syllabus management"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ALL_SUBJECTS.map((subj) => {
                const isSelected = selectedSubjects.includes(subj.id);
                return (
                  <button
                    key={subj.id}
                    type="button"
                    onClick={() => toggleSubject(subj.id)}
                    className={`flex items-center justify-between p-3 rounded text-xs border text-left transition-all ${
                      isSelected
                        ? 'bg-[#0E1B2A] text-white border-[#0E1B2A] shadow-xs'
                        : 'bg-[#F8FAFC] text-[#334155] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    <span className="font-semibold">{subj.label}</span>
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'bg-[#C6A75E] text-[#0E1B2A]' : 'bg-[#E2E8F0] text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.assignedSubjects && (
              <p className="text-[11px] text-red-500">{errors.assignedSubjects.message}</p>
            )}
          </div>
        </FormSection>

        {/* Section 5: Dossier / Professional Biography */}
        <FormSection
          title="Service Record & Professional Bio"
          description="Academic credentials, past military appointments, or specialty certifications"
        >
          <div>
            <textarea
              {...register('bio')}
              rows={4}
              placeholder="e.g. Former ISSB Psychometric Evaluator with 14 years instructional service in intelligence testing..."
              className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
            />
            {errors.bio && (
              <p className="text-[11px] text-red-500 mt-1">{errors.bio.message}</p>
            )}
          </div>
        </FormSection>

        {/* Action Controls */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => navigate('/admin/teachers')}
            className="px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-[#EDF1F5] rounded border border-[#CBD5E1] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-semibold bg-[#0E1B2A] text-white rounded hover:bg-[#1A2C42] focus:outline-none focus:ring-2 focus:ring-[#C6A75E] disabled:opacity-50 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4 text-[#C6A75E]" />
            <span>{isEdit ? 'Save Changes' : 'Enrol Faculty Member'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherFormPage;
