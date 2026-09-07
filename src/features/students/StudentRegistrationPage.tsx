import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Upload,
  Trash2,
  User,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, FormSection } from '@/components/ui';
import { studentRegistrationService } from '@/services/studentRegistrationService';
import {
  ForceOption,
  CourseOption,
  BatchOption,
} from '@/types/registration.types';

// Strict Zod Validation Schema
const registrationFormSchema = z.object({
  fullName: z.string().min(3, 'Candidate full name must be at least 3 characters').max(100),
  fatherName: z.string().min(3, 'Father name must be at least 3 characters').max(100),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female']),
  cnic: z
    .string()
    .min(13, 'CNIC must be at least 13 digits')
    .max(15, 'CNIC format invalid')
    .regex(/^\d{5}-\d{7}-\d{1}$|^\d{13}$/, 'CNIC must be in format XXXXX-XXXXXXX-X'),
  phone: z
    .string()
    .min(10, 'Valid phone number required')
    .max(16, 'Phone number too long'),
  alternatePhone: z.string().max(16).optional().or(z.literal('')),
  education: z.string().optional().or(z.literal('')),
  educationDetails: z.string().max(250).optional().or(z.literal('')),
  targetForceId: z.string().min(1, 'Target force branch selection is required'),
  targetCourseId: z.string().min(1, 'Target course selection is required'),
  batchId: z.string().optional().or(z.literal('')),
  rollNumber: z
    .string()
    .min(3, 'Roll number must be at least 3 characters')
    .max(30, 'Roll number too long')
    .regex(/^[A-Za-z0-9-_]+$/, 'Roll number must contain only letters, numbers, hyphens or underscores'),
  email: z.string().email('Valid institutional or personal email is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DISQUALIFIED']),
  guardianName: z.string().max(100).optional().or(z.literal('')),
  guardianRelationship: z.enum(['Father', 'Mother', 'Brother', 'Uncle', 'Guardian']).optional(),
  guardianPhone: z.string().max(16).optional().or(z.literal('')),
  address: z.string().max(250).optional().or(z.literal('')),
  photoUrl: z.string().optional().or(z.literal('')),
  admissionDate: z.string().min(1, 'Admission date is required'),
  notes: z.string().max(500).optional().or(z.literal('')),
});

type RegistrationFormData = z.infer<typeof registrationFormSchema>;

export const StudentRegistrationPage: React.FC = () => {
  const navigate = useNavigate();

  // Dynamic dropdown state
  const [forces, setForces] = useState<ForceOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loadingForces, setLoadingForces] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Security controls state
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingRoll, setIsCheckingRoll] = useState(false);
  const [rollAvailable, setRollAvailable] = useState<boolean | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      fullName: '',
      fatherName: '',
      dateOfBirth: '2005-01-01',
      gender: 'Male',
      cnic: '',
      phone: '',
      alternatePhone: '',
      education: 'FSc (Pre-Engineering)',
      educationDetails: '',
      targetForceId: '',
      targetCourseId: '',
      batchId: '',
      rollNumber: '',
      email: '',
      password: '1234',
      status: 'ACTIVE',
      guardianName: '',
      guardianRelationship: 'Father',
      guardianPhone: '',
      address: '',
      photoUrl: '',
      admissionDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const selectedForceId = watch('targetForceId');
  const selectedCourseId = watch('targetCourseId');
  const watchRollNumber = watch('rollNumber');

  // Load initial forces
  useEffect(() => {
    let isMounted = true;
    async function loadForces() {
      try {
        setLoadingForces(true);
        const data = await studentRegistrationService.getActiveForces();
        if (isMounted && data.length > 0) {
          setForces(data);
          const army = data.find((f) => f.code === 'PAKISTAN_ARMY') || data[0];
          setValue('targetForceId', army.id);
        }
      } catch (err) {
        console.error('Error loading forces:', err);
      } finally {
        if (isMounted) setLoadingForces(false);
      }
    }
    loadForces();
    return () => {
      isMounted = false;
    };
  }, [setValue]);

  // Load courses when force changes
  useEffect(() => {
    let isMounted = true;
    async function loadCourses() {
      if (!selectedForceId) {
        setCourses([]);
        setValue('targetCourseId', '');
        return;
      }
      try {
        setLoadingCourses(true);
        const data = await studentRegistrationService.getCoursesForForce(selectedForceId);
        if (isMounted) {
          setCourses(data);
          if (data.length > 0) {
            setValue('targetCourseId', data[0].id);
          } else {
            setValue('targetCourseId', '');
          }
        }
      } catch (err) {
        console.error('Error loading courses:', err);
      } finally {
        if (isMounted) setLoadingCourses(false);
      }
    }
    loadCourses();
    return () => {
      isMounted = false;
    };
  }, [selectedForceId, setValue]);

  // Load batches when course changes
  useEffect(() => {
    let isMounted = true;
    async function loadBatches() {
      if (!selectedCourseId) {
        setBatches([]);
        setValue('batchId', '');
        return;
      }
      try {
        setLoadingBatches(true);
        const data = await studentRegistrationService.getBatchesForCourse(selectedCourseId);
        if (isMounted) {
          setBatches(data);
          if (data.length > 0) {
            setValue('batchId', data[0].id);
          } else {
            setValue('batchId', '');
          }
        }
      } catch (err) {
        console.error('Error loading batches:', err);
      } finally {
        if (isMounted) setLoadingBatches(false);
      }
    }
    loadBatches();
    return () => {
      isMounted = false;
    };
  }, [selectedCourseId, setValue]);

  // Auto-format CNIC as user types
  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 13) val = val.substring(0, 13);
    let formatted = val;
    if (val.length > 5 && val.length <= 12) {
      formatted = `${val.substring(0, 5)}-${val.substring(5)}`;
    } else if (val.length > 12) {
      formatted = `${val.substring(0, 5)}-${val.substring(5, 12)}-${val.substring(12, 13)}`;
    }
    setValue('cnic', formatted, { shouldValidate: true });
  };

  // Auto-suggest Roll Number & Email
  const generateRollNumber = () => {
    const selectedForce = forces.find((f) => f.id === selectedForceId);
    let prefix = 'SFA';
    if (selectedForce?.code === 'PAKISTAN_ARMY') prefix = 'SFA-PMA';
    else if (selectedForce?.code === 'PAKISTAN_AIR_FORCE') prefix = 'SFA-PAF';
    else if (selectedForce?.code === 'PAKISTAN_NAVY') prefix = 'SFA-NAVY';

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear().toString().slice(-2);
    const newRoll = `${prefix}-${year}${randNum.toString().slice(-2)}`;
    setValue('rollNumber', newRoll, { shouldValidate: true });

    // Suggest institutional email
    const cleanRoll = newRoll.toLowerCase().replace(/[^a-z0-9]/g, '.');
    setValue('email', `${cleanRoll}@shujaforces.com`, { shouldValidate: true });
  };

  // Generate Strong Password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('password', pass, { shouldValidate: true });
    setShowPassword(true);
    toast.info(`Generated password: ${pass}`);
  };

  // Verify Roll Number on blur
  const checkRollAvailability = async () => {
    if (!watchRollNumber || watchRollNumber.trim().length < 3) {
      setRollAvailable(null);
      return;
    }
    setIsCheckingRoll(true);
    try {
      const exists = await studentRegistrationService.checkRollNumberExists(watchRollNumber);
      setRollAvailable(!exists);
    } catch (err) {
      setRollAvailable(null);
    } finally {
      setIsCheckingRoll(false);
    }
  };

  // Photo Upload Handler
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size exceeds 5 MB limit.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const url = await studentRegistrationService.uploadStudentPhoto(file);
      setPhotoPreview(url);
      setValue('photoUrl', url);
      toast.success('Passport photo uploaded successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Form submission handler
  const onSubmit = async (data: RegistrationFormData) => {
    try {
      let cleanCnic = data.cnic.trim();
      if (cleanCnic.length === 13 && !cleanCnic.includes('-')) {
        cleanCnic = `${cleanCnic.slice(0, 5)}-${cleanCnic.slice(5, 12)}-${cleanCnic.slice(12)}`;
      }

      const result = await studentRegistrationService.registerStudent({
        fullName: data.fullName,
        fatherName: data.fatherName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        cnic: cleanCnic,
        phone: data.phone,
        alternatePhone: data.alternatePhone,
        education: data.education,
        educationDetails: data.educationDetails,
        targetForceId: data.targetForceId,
        targetCourseId: data.targetCourseId,
        batchId: data.batchId || undefined,
        rollNumber: data.rollNumber,
        email: data.email,
        password: data.password,
        status: data.status,
        guardianName: data.guardianName,
        guardianRelationship: data.guardianRelationship,
        guardianPhone: data.guardianPhone,
        address: data.address,
        photoUrl: data.photoUrl,
        admissionDate: data.admissionDate,
        notes: data.notes,
      });

      toast.success(
        `Cadet ${result.displayName} (${result.rollNumber}) registered successfully!`
      );

      navigate('/admin/students');
    } catch (err: any) {
      console.error('Registration failed:', err);
      toast.error(err.message || 'Cadet registration failed. Please review inputs.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 select-none pb-12">
      {/* Page Header */}
      <PageHeader
        title="Cadet Induction & Registration"
        subtitle="Comprehensive Biometric Dossier, Service Branch Assignment, and Institutional Authentication"
        breadcrumbs={[
          { label: 'Cadets Roster', href: '/admin/students' },
          { label: 'New Cadet Registration' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-[#D4D9DF] hover:bg-[#EDF1F5] text-[#0E1B2A] rounded text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Roster</span>
          </button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Candidate Personal Identification */}
        <FormSection
          stepNumber={1}
          title="Candidate Personal Identification"
          subtitle="Biometric identity, national registration credentials, and direct communication channels"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Passport Photo Upload Box */}
            <div className="md:col-span-1 flex flex-col items-center">
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-2 self-start">
                Passport Photo Docket
              </label>
              <div className="w-44 h-52 border-2 border-dashed border-[#D4D9DF] rounded-md bg-[#F8FAFC] flex flex-col items-center justify-center p-3 relative overflow-hidden group hover:border-[#0E1B2A] transition-colors">
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Cadet Portrait"
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setValue('photoUrl', '');
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-[#782525] text-white rounded-full opacity-80 hover:opacity-100 shadow"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-2">
                    {isUploadingPhoto ? (
                      <RefreshCw className="w-8 h-8 text-[#0E1B2A] animate-spin" />
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-[#EDF1F5] flex items-center justify-center text-[#0E1B2A]">
                          <User className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-medium text-[#64748B]">
                          Formal Cadet Portrait
                        </span>
                        <label className="cursor-pointer inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-[#D4D9DF] hover:bg-[#EDF1F5] rounded text-[10px] font-bold text-[#0E1B2A] shadow-xs">
                          <Upload className="w-3 h-3" />
                          <span>Choose Photo</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handlePhotoSelect}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[#64748B] mt-2 text-center">
                JPG, PNG, or WebP (Max 5MB)
              </span>
            </div>

            {/* Identity Form Fields */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('fullName')}
                    placeholder="e.g., Muhammad Hamza"
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
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    {...register('dateOfBirth')}
                    className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                    Gender *
                  </label>
                  <select
                    {...register('gender')}
                    className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-medium focus:outline-none focus:border-[#0E1B2A]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
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
                    onChange={handleCnicChange}
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

              <div>
                <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                  Alternate Phone / WhatsApp (Optional)
                </label>
                <input
                  type="text"
                  {...register('alternatePhone')}
                  placeholder="0311-9876543"
                  className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded font-sans tabular-nums text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
                />
              </div>
            </div>
          </div>
        </FormSection>

        {/* Section 2: Educational Background & Target Cadre */}
        <FormSection
          stepNumber={2}
          title="Educational Background & Target Cadre"
          subtitle="Induction service allocation, qualification background, and cohort alignment"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Highest Education Qualification
              </label>
              <select
                {...register('education')}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-medium focus:outline-none focus:border-[#0E1B2A]"
              >
                <option value="FSc (Pre-Engineering)">FSc (Pre-Engineering)</option>
                <option value="FSc (Pre-Medical)">FSc (Pre-Medical)</option>
                <option value="ICS (Computer Science)">ICS (Computer Science)</option>
                <option value="Matric (Science)">Matric (Science)</option>
                <option value="A-Levels">A-Levels / Cambridge</option>
                <option value="I.Com">I.Com</option>
                <option value="FA">FA</option>
                <option value="Graduation / BS">Graduation / BS (4-Year)</option>
                <option value="Other">Other / Equivalent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Academic Details & Institution
              </label>
              <input
                type="text"
                {...register('educationDetails')}
                placeholder="e.g., 85% Marks, Cadet College Hasan Abdal"
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Target Force */}
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Target Force Branch *
              </label>
              <select
                {...register('targetForceId')}
                disabled={loadingForces}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-medium focus:outline-none focus:border-[#0E1B2A]"
              >
                {forces.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.code.replace('PAKISTAN_', '')})
                  </option>
                ))}
              </select>
              {errors.targetForceId && (
                <p className="text-[11px] text-[#782525] mt-1">{errors.targetForceId.message}</p>
              )}
            </div>

            {/* Target Course (Dependent) */}
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Target Induction Course *
              </label>
              <select
                {...register('targetCourseId')}
                disabled={loadingCourses || courses.length === 0}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-medium focus:outline-none focus:border-[#0E1B2A]"
              >
                {courses.length === 0 ? (
                  <option value="">No courses available</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
              {errors.targetCourseId && (
                <p className="text-[11px] text-[#782525] mt-1">{errors.targetCourseId.message}</p>
              )}
            </div>

            {/* Initial Batch Enrollment (Dependent) */}
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Initial Batch Enrollment
              </label>
              <select
                {...register('batchId')}
                disabled={loadingBatches || batches.length === 0}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-medium focus:outline-none focus:border-[#0E1B2A]"
              >
                {batches.length === 0 ? (
                  <option value="">No active batches (Unassigned)</option>
                ) : (
                  batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} ({b.sessionName || b.name})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </FormSection>

        {/* Section 3: Academy Identity & Login Credentials */}
        <FormSection
          stepNumber={3}
          title="Academy Identity & Security Credentials"
          subtitle="Official institutional roll identification and portal access passcodes"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Roll Number with Generator & Availability Check */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider">
                  Cadet Roll ID *
                </label>
                <button
                  type="button"
                  onClick={generateRollNumber}
                  className="text-[10px] text-[#0E1B2A] font-bold hover:underline inline-flex items-center space-x-1"
                >
                  <Sparkles className="w-2.5 h-2.5 text-[#C6A75E]" />
                  <span>Auto-Suggest</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  {...register('rollNumber')}
                  onBlur={checkRollAvailability}
                  placeholder="e.g., SFA-PMA-2601"
                  className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded font-mono font-bold text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
                />
                <div className="absolute right-2.5 top-2.5">
                  {isCheckingRoll ? (
                    <RefreshCw className="w-3.5 h-3.5 text-[#64748B] animate-spin" />
                  ) : rollAvailable === true ? (
                    <span title="Roll Number Available">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                    </span>
                  ) : rollAvailable === false ? (
                    <span title="Roll Number Already Exists">
                      <AlertCircle className="w-3.5 h-3.5 text-[#782525]" />
                    </span>
                  ) : null}
                </div>
              </div>
              {errors.rollNumber && (
                <p className="text-[11px] text-[#782525] mt-1">{errors.rollNumber.message}</p>
              )}
              {rollAvailable === false && (
                <p className="text-[11px] text-[#782525] mt-1">This Roll ID is already assigned.</p>
              )}
            </div>

            {/* Login Email */}
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Portal Login Email *
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="cadet.roll@shujaforces.com"
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-mono focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
              />
              {errors.email && (
                <p className="text-[11px] text-[#782525] mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Temporary Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider">
                  Initial Passcode *
                </label>
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  className="text-[10px] text-[#0E1B2A] font-bold hover:underline inline-flex items-center space-x-1"
                >
                  <KeyRound className="w-2.5 h-2.5 text-[#C6A75E]" />
                  <span>Generate</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Secret123!"
                  className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded font-mono text-[#0E1B2A] pr-8 focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-[#64748B] hover:text-[#0E1B2A]"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-[#782525] mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Admission Status *
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-medium focus:outline-none focus:border-[#0E1B2A]"
              >
                <option value="ACTIVE">ACTIVE (Testing & CBT Permitted)</option>
                <option value="INACTIVE">INACTIVE (Registration Pending)</option>
                <option value="SUSPENDED">SUSPENDED (Temporary Hold)</option>
                <option value="DISQUALIFIED">DISQUALIFIED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Official Admission Date *
              </label>
              <input
                type="date"
                {...register('admissionDate')}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 4: Guardian & Contact Details */}
        <FormSection
          stepNumber={4}
          title="Guardian & Residential Dossier"
          subtitle="Next-of-kin emergency references and residential address for official dispatch"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Guardian Full Name
              </label>
              <input
                type="text"
                {...register('guardianName')}
                placeholder="e.g., Tariq Mehmood"
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Relationship to Cadet
              </label>
              <select
                {...register('guardianRelationship')}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-medium focus:outline-none focus:border-[#0E1B2A]"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Uncle">Uncle</option>
                <option value="Guardian">Legal Guardian</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Guardian Emergency Phone
              </label>
              <input
                type="text"
                {...register('guardianPhone')}
                placeholder="0300-1234567"
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded font-sans tabular-nums text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
              Permanent Postal Address
            </label>
            <textarea
              rows={2}
              {...register('address')}
              placeholder="House / Street / Sector, Tehsil, District, Province"
              className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
              Medical / Preliminary Board Remarks (Optional)
            </label>
            <textarea
              rows={2}
              {...register('notes')}
              placeholder="Initial medical standing, ISSB orientation notes, or special faculty instructions..."
              className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
            />
          </div>
        </FormSection>

        {/* Form Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#D4D9DF]">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 text-xs font-medium text-[#64748B] hover:text-[#0E1B2A] transition-colors"
          >
            Clear / Reset Inputs
          </button>

          <div className="flex items-center space-x-3">
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
              className="inline-flex items-center space-x-1.5 px-6 py-2.5 bg-[#0E1B2A] hover:bg-[#1A2C42] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Committing Registration...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register & Induct Cadet</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StudentRegistrationPage;
