import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentFormSchema, StudentFormValues } from './studentSchema';
import { studentStore } from './studentStore';
import { PageHeader, FormSection, ImageUploader } from '@/components/ui';
import { Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const StudentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      fullName: '',
      fatherName: '',
      cnic: '',
      phone: '',
      rollNumber: '',
      temporaryCredential: '',
      branch: 'PAKISTAN_ARMY',
      batchId: 'batch-001',
      targetCourse: '154 PMA Long Course',
      status: 'ACTIVE',
      avatarUrl: '',
    },
  });

  useEffect(() => {
    let isMounted = true;
    async function loadRecord() {
      if (!isEditMode || !id) return;
      try {
        const { studentService } = await import('@/services/studentService');
        const existingRecord = await studentService.getStudentById(id);
        if (isMounted && existingRecord) {
          reset({
            fullName: existingRecord.fullName,
            fatherName: existingRecord.fatherName,
            cnic: existingRecord.cnic,
            phone: existingRecord.phone,
            rollNumber: existingRecord.rollNumber,
            temporaryCredential: '••••••••',
            branch: existingRecord.branch,
            batchId: existingRecord.batchId,
            targetCourse: existingRecord.targetCourse,
            status: existingRecord.status,
            avatarUrl: existingRecord.avatarUrl || '',
          });
        }
      } catch (err) {
        console.warn('Failed to load student for edit:', err);
      }
    }
    loadRecord();
    return () => {
      isMounted = false;
    };
  }, [isEditMode, id, reset]);

  const avatarUrl = watch('avatarUrl');
  const currentFullName = watch('fullName');

  const onSubmit = async (data: StudentFormValues) => {
    try {
      const { studentService } = await import('@/services/studentService');
      if (isEditMode && id) {
        await studentService.updateStudent(id, {
          fullName: data.fullName,
          fatherName: data.fatherName,
          cnic: data.cnic,
          phone: data.phone,
          rollNumber: data.rollNumber,
          branch: data.branch,
          batchId: data.batchId,
          targetCourse: data.targetCourse,
          status: data.status,
          avatarUrl: data.avatarUrl,
        });
        toast.success(`Cadet docket ${data.rollNumber} successfully updated.`);
      } else {
        studentStore.create({
          fullName: data.fullName,
          fatherName: data.fatherName,
          cnic: data.cnic,
          phone: data.phone,
          rollNumber: data.rollNumber,
          branch: data.branch,
          batchId: data.batchId,
          batchCode: data.branch === 'PAKISTAN_ARMY' ? '154-PMA-LC' : data.branch === 'PAKISTAN_AIR_FORCE' ? '158-GDP-PAF' : 'PNC-2026-A',
          targetCourse: data.targetCourse,
          status: data.status,
          avatarUrl: data.avatarUrl,
        });
        toast.success(`Cadet ${data.fullName} enrolled with Roll Number ${data.rollNumber}.`);
      }

      navigate('/admin/students');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save student record');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      <PageHeader
        title={isEditMode ? 'Modify Cadet Docket' : 'New Cadet Induction Enrollment'}
        subtitle={
          isEditMode
            ? `Editing military credentials and training cadre for ${currentFullName || id}`
            : 'Register candidate personal dossier, service branch, and initial security clearance'
        }
        breadcrumbs={[
          { label: 'Cadets Roster', href: '/admin/students' },
          { label: isEditMode ? 'Edit Docket' : 'Enrollment Form' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-[#D4D9DF] hover:bg-[#EDF1F5] text-[#0E1B2A] rounded text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Roster</span>
          </button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Candidate Personal Dossier */}
        <FormSection
          stepNumber={1}
          title="Candidate Personal Identification"
          subtitle="Biometric identity, national registration, and communication details"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <ImageUploader
                value={avatarUrl}
                onChange={(url) => setValue('avatarUrl', url)}
                label="Passport Photo Docket"
                hint="Formal cadet portrait (neutral military background)"
              />
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('fullName')}
                    placeholder="e.g., Hamza Tariq"
                    className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
                  />
                  {errors.fullName && (
                    <p className="text-[11px] text-[#782525] mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                    Father's Name *
                  </label>
                  <input
                    type="text"
                    {...register('fatherName')}
                    placeholder="e.g., Tariq Mehmood"
                    className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
                  />
                  {errors.fatherName && (
                    <p className="text-[11px] text-[#782525] mt-1">{errors.fatherName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                    CNIC / B-Form Number *
                  </label>
                  <input
                    type="text"
                    {...register('cnic')}
                    placeholder="37405-1234567-1"
                    className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded font-mono text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
                  />
                  {errors.cnic && (
                    <p className="text-[11px] text-[#782525] mt-1">{errors.cnic.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                    Emergency Mobile Phone *
                  </label>
                  <input
                    type="text"
                    {...register('phone')}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded font-sans tabular-nums text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-[#782525] mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Section 2: Academy Induction & Military Standing */}
        <FormSection
          stepNumber={2}
          title="Academy Training & Service Cadre"
          subtitle="Target force allocation, cohort batch assignment, and security clearance"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Cadet Roll Number *
              </label>
              <input
                type="text"
                {...register('rollNumber')}
                placeholder="e.g., PMA-2601"
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded font-mono font-bold text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
              />
              {errors.rollNumber && (
                <p className="text-[11px] text-[#782525] mt-1">{errors.rollNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Initial Passcode / Secret *
              </label>
              <input
                type="text"
                {...register('temporaryCredential')}
                placeholder="Passcode123!"
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded font-mono text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
              />
              {errors.temporaryCredential && (
                <p className="text-[11px] text-[#782525] mt-1">{errors.temporaryCredential.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Service Branch *
              </label>
              <select
                {...register('branch')}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-medium focus:outline-none focus:border-[#0E1B2A]"
              >
                <option value="PAKISTAN_ARMY">Pakistan Army (PA)</option>
                <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force (PAF)</option>
                <option value="PAKISTAN_NAVY">Pakistan Navy (PN)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Assigned Batch Cohort *
              </label>
              <select
                {...register('batchId')}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-sans font-medium focus:outline-none focus:border-[#0E1B2A]"
              >
                <option value="batch-001">154-PMA-LC (Army Long Course)</option>
                <option value="batch-002">158-GDP-PAF (Air Force Flight)</option>
                <option value="batch-003">PNC-2026-A (Navy Cadet Term)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Target Induction Course *
              </label>
              <input
                type="text"
                {...register('targetCourse')}
                placeholder="e.g., 154 PMA Long Course"
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
              />
              {errors.targetCourse && (
                <p className="text-[11px] text-[#782525] mt-1">{errors.targetCourse.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Enrollment Status *
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-medium focus:outline-none focus:border-[#0E1B2A]"
              >
                <option value="ACTIVE">ACTIVE (Testing Permitted)</option>
                <option value="RETAKE_REQUIRED">RETAKE REQUIRED</option>
                <option value="GRADUATED">GRADUATED</option>
                <option value="DISQUALIFIED">DISQUALIFIED</option>
              </select>
            </div>
          </div>
        </FormSection>

        {/* Form Action Controls */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#D4D9DF]">
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="px-4 py-2 border border-[#D4D9DF] hover:bg-[#EDF1F5] text-[#0E1B2A] rounded text-xs font-semibold transition-colors"
          >
            Cancel & Return
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-[#0E1B2A] hover:bg-[#1A2C42] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isEditMode ? 'Save Dossier Changes' : 'Commit Enrollment Record'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentFormPage;
