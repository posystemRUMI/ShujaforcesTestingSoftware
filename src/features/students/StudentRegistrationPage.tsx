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
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, FormSection } from '@/components/ui';
import { studentRegistrationService } from '@/services/studentRegistrationService';
import {
  ForceOption,
  CourseOption,
} from '@/types/registration.types';

// Strict Zod Validation Schema with Mandatory Education & Batch & Fee Details
const registrationFormSchema = z
  .object({
    fullName: z.string().min(3, 'Full name must be at least 3 characters').max(100),
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
      .min(10, 'Valid mobile number required')
      .max(16, 'Phone number too long'),
    alternatePhone: z.string().max(16).optional().or(z.literal('')),
    education: z.string().min(1, 'Education qualification is required'),
    educationDetails: z.string().max(250).optional().or(z.literal('')),
    targetForceId: z.string().min(1, 'Target force branch selection is required'),
    targetCourseId: z.string().min(1, 'Target course selection is required'),
    batchId: z.string().optional(),
    rollNumber: z
      .string()
      .min(3, 'Roll number must be at least 3 characters')
      .max(30, 'Roll number too long')
      .regex(/^[A-Za-z0-9-_]+$/, 'Roll number must contain only letters, numbers, hyphens or underscores'),
    email: z.string().email('Valid email address is required'),
    password: z.string().min(4, 'Password must be at least 4 characters'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DISQUALIFIED']),
    guardianName: z.string().max(100).optional().or(z.literal('')),
    guardianRelationship: z.enum(['Father', 'Mother', 'Brother', 'Uncle', 'Guardian']).optional(),
    guardianPhone: z.string().max(16).optional().or(z.literal('')),
    address: z.string().max(250).optional().or(z.literal('')),
    photoUrl: z.string().optional().or(z.literal('')),
    admissionDate: z.string().min(1, 'Admission date is required'),
    notes: z.string().max(500).optional().or(z.literal('')),
    courseFeeAmount: z.coerce.number().min(0, 'Fee cannot be negative').optional(),
    initialPaymentAmount: z.coerce.number().min(0, 'Payment cannot be negative').optional(),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'ONLINE', 'CHEQUE', 'OTHER']).optional(),
  })
  .refine(
    (data) => {
      if (data.education === 'Other') {
        return Boolean(data.educationDetails && data.educationDetails.trim().length > 0);
      }
      return true;
    },
    {
      message: 'Education details are required when "Other" is selected',
      path: ['educationDetails'],
    }
  );

type RegistrationFormData = z.infer<typeof registrationFormSchema>;

export const StudentRegistrationPage: React.FC = () => {
  const navigate = useNavigate();

  // Dynamic dropdown state
  const [forces, setForces] = useState<ForceOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingForces, setLoadingForces] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Security & preview controls state
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingRoll, setIsCheckingRoll] = useState(false);
  const [rollAvailable, setRollAvailable] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
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
      password: '', // HARDENED: Empty by default
      status: 'ACTIVE',
      guardianName: '',
      guardianRelationship: 'Father',
      guardianPhone: '',
      address: '',
      photoUrl: '',
      admissionDate: new Date().toISOString().split('T')[0],
      notes: '',
      courseFeeAmount: 25000,
      initialPaymentAmount: 25000,
      paymentMethod: 'CASH',
    },
  });

  const selectedForceId = watch('targetForceId');
  const selectedCourseId = watch('targetCourseId');
  const selectedEducation = watch('education');
  const watchRollNumber = watch('rollNumber');
  const watchEmail = watch('email');
  const watchCourseFee = watch('courseFeeAmount') || 0;
  const watchInitialPayment = watch('initialPaymentAmount') || 0;
  const selectedCourseObj = courses.find((c) => c.id === selectedCourseId);

  // Load initial forces directly from DB
  useEffect(() => {
    let isMounted = true;
    async function loadForces() {
      try {
        setLoadingForces(true);
        const data = await studentRegistrationService.getActiveForces();
        if (isMounted) {
          setForces(data);
          if (data.length > 0) {
            setValue('targetForceId', data[0].id);
          } else {
            setValue('targetForceId', '');
          }
        }
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load forces.');
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
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load courses.');
      } finally {
        if (isMounted) setLoadingCourses(false);
      }
    }
    loadCourses();
    return () => {
      isMounted = false;
    };
  }, [selectedForceId, setValue]);

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

  // Auto-suggest guaranteed unique Roll Number & Email
  const generateRollNumber = async () => {
    const selectedForce = forces.find((f) => f.id === selectedForceId);
    let prefix = 'SFA';
    if (selectedForce?.code === 'PAKISTAN_ARMY') prefix = 'SFA-PMA';
    else if (selectedForce?.code === 'PAKISTAN_AIR_FORCE') prefix = 'SFA-PAF';
    else if (selectedForce?.code === 'PAKISTAN_NAVY') prefix = 'SFA-NAVY';

    const year = new Date().getFullYear().toString().slice(-2);
    let newRoll = '';
    let newEmail = '';
    let isAvailable = false;
    let attempts = 0;

    while (!isAvailable && attempts < 10) {
      attempts++;
      const randNum = Math.floor(100000 + Math.random() * 900000); // 6-digit unique randomizer
      newRoll = `${prefix}-${year}${randNum}`;
      const cleanRoll = newRoll.toLowerCase().replace(/[^a-z0-9]/g, '.');
      newEmail = `${cleanRoll}@gmail.com`;

      const [rollExists, emailExists] = await Promise.all([
        studentRegistrationService.checkRollNumberExists(newRoll),
        studentRegistrationService.checkEmailExists(newEmail),
      ]);

      if (!rollExists && !emailExists) {
        isAvailable = true;
      }
    }

    setValue('rollNumber', newRoll, { shouldValidate: true });
    setValue('email', newEmail, { shouldValidate: true });
    setRollAvailable(true);
    setEmailAvailable(true);
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
    } catch {
      setRollAvailable(null);
    } finally {
      setIsCheckingRoll(false);
    }
  };

  // Verify Email Availability on blur
  const checkEmailAvailability = async () => {
    if (!watchEmail || !watchEmail.includes('@') || watchEmail.trim().length < 5) {
      setEmailAvailable(null);
      return;
    }
    setIsCheckingEmail(true);
    try {
      const exists = await studentRegistrationService.checkEmailExists(watchEmail);
      setEmailAvailable(!exists);
    } catch {
      setEmailAvailable(null);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Private Photo Upload Handler
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size exceeds 5 MB limit.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const result = await studentRegistrationService.uploadStudentPhoto(file);
      setPhotoPreview(result.signedUrl);
      setValue('photoUrl', result.path);
      toast.success('Photo uploaded securely.');
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
        batchId: data.batchId,
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
        courseFeeAmount: data.courseFeeAmount,
        initialPaymentAmount: data.initialPaymentAmount,
        paymentMethod: data.paymentMethod,
      });

      toast.success(
        `Student ${result.displayName} (${result.rollNumber}) registered successfully!`
      );

      navigate('/admin/students');
    } catch (err: any) {
      console.error('Registration failed:', err);
      let userMsg = err.message || 'Registration failed. Please review inputs.';

      // Strip technical RPC / Edge Function prefixes
      userMsg = userMsg
        .replace(/^DUPLICATE_ENTRY:\s*/i, '')
        .replace(/^VALIDATION_ERROR:\s*/i, '')
        .replace(/^UNAUTHORIZED:\s*/i, '')
        .replace(/^FORBIDDEN:\s*/i, '');

      if (userMsg.includes('User already registered') || userMsg.includes('User already exists')) {
        userMsg = `An account with email "${data.email}" is already registered in the authentication system. Please click "Suggest Roll Number & Email" or enter a unique email.`;
      } else if (userMsg.toLowerCase().includes('rate limit')) {
        userMsg = `Email rate limit exceeded on Supabase (default SMTP limit: 3-4 signups/hr). In Supabase Dashboard -> Authentication -> Email, turn OFF "Confirm email" or wait a few minutes.`;
      }

      toast.error(userMsg);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 select-none pb-12">
      {/* Page Header */}
      <PageHeader
        title="New Student Registration"
        subtitle="Register candidate dossier, assign target branch and course, and create portal credentials"
        breadcrumbs={[
          { label: 'Students Roster', href: '/admin/students' },
          { label: 'Register Student' },
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
        {/* Section 1: Personal Information */}
        <FormSection
          stepNumber={1}
          title="Personal Information"
          subtitle="Candidate identity, CNIC, and contact details"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Passport Photo Upload Box */}
            <div className="md:col-span-1 flex flex-col items-center">
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-2 self-start">
                Student Photo
              </label>
              <div className="w-44 h-52 border-2 border-dashed border-[#D4D9DF] rounded-md bg-[#F8FAFC] flex flex-col items-center justify-center p-3 relative overflow-hidden group hover:border-[#0E1B2A] transition-colors">
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Student Portrait"
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
                          Student Portrait Photo
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

        {/* Section 2: Education & Target */}
        <FormSection
          stepNumber={2}
          title="Education & Target"
          subtitle="Academic background, target force, and course"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Highest Education Qualification *
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
              {errors.education && (
                <p className="text-[11px] text-[#782525] mt-1">{errors.education.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Academic Details & Institution {selectedEducation === 'Other' ? '*' : '(Optional)'}
              </label>
              <input
                type="text"
                {...register('educationDetails')}
                placeholder="e.g., 85% Marks, Cadet College Hasan Abdal"
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
              />
              {errors.educationDetails && (
                <p className="text-[11px] text-[#782525] mt-1">{errors.educationDetails.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Target Force */}
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Target Force *
              </label>
              <select
                {...register('targetForceId')}
                disabled={loadingForces}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-medium focus:outline-none focus:border-[#0E1B2A]"
              >
                {forces.length === 0 ? (
                  <option value="">No forces available</option>
                ) : (
                  forces.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code.replace('PAKISTAN_', '')})
                    </option>
                  ))
                )}
              </select>
              {errors.targetForceId && (
                <p className="text-[11px] text-[#782525] mt-1">{errors.targetForceId.message}</p>
              )}
            </div>

            {/* Target Course (Dependent) */}
            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Target Course *
              </label>
              <select
                {...register('targetCourseId')}
                disabled={loadingCourses || courses.length === 0}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-medium focus:outline-none focus:border-[#0E1B2A]"
              >
                {courses.length === 0 ? (
                  <option value="">No active courses available for this force.</option>
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
          </div>

          {/* Course Fee, Duration & Initial Fee Payment Setup */}
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Course Fee, Duration & Admission Payment</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Set total course fee, view course duration, and record initial fee payment during candidate registration.
                </p>
              </div>
              <div className="bg-white px-3 py-1.5 rounded border border-slate-200 text-left sm:text-right shrink-0">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Course Duration</span>
                <span className="text-xs font-bold font-mono text-blue-800">
                  {selectedCourseObj?.durationWeeks ? `${selectedCourseObj.durationWeeks} Weeks (${Math.round(selectedCourseObj.durationWeeks / 4)} Months)` : '12 Weeks (3 Months)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Total Course Fee (PKR) *
                </label>
                <input
                  type="number"
                  min="0"
                  {...register('courseFeeAmount')}
                  placeholder="25000"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                />
                {errors.courseFeeAmount && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.courseFeeAmount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Fee Paid Now (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  {...register('initialPaymentAmount')}
                  placeholder="e.g. 25000 for Paid, 10000 for Partial"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-emerald-700 focus:outline-none focus:border-slate-900"
                />
                {errors.initialPaymentAmount && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.initialPaymentAmount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  {...register('paymentMethod')}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  <option value="CASH">Cash Payment</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="ONLINE">Online Portal</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Calculated Live Fee Status */}
            <div className="p-3 bg-white border border-slate-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-600">Initial Fee Status:</span>
                {Number(watchInitialPayment) >= Number(watchCourseFee) && Number(watchCourseFee) > 0 ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>FULLY PAID (CLEAR)</span>
                  </span>
                ) : Number(watchInitialPayment) > 0 ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    <span>PARTIALLY PAID</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    <span>UNPAID (DUES PENDING)</span>
                  </span>
                )}
              </div>

              <div className="text-xs font-mono font-bold text-slate-800">
                <span>Remaining Dues Balance: </span>
                <span className={Math.max(0, Number(watchCourseFee) - Number(watchInitialPayment)) > 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                  Rs. {Math.max(0, Number(watchCourseFee) - Number(watchInitialPayment)).toLocaleString('en-PK')}
                </span>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Section 3: Login Details */}
        <FormSection
          stepNumber={3}
          title="Login Details"
          subtitle="Roll identification, login credentials, and status"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Roll Number with Generator & Availability Check */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider">
                  Roll Number *
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
                Login Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  {...register('email')}
                  onBlur={checkEmailAvailability}
                  placeholder="cadet.roll@gmail.com"
                  className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-mono focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E] pr-8"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                  {isCheckingEmail ? (
                    <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
                  ) : emailAvailable === true ? (
                    <span title="Email Available">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1F4D2B]" />
                    </span>
                  ) : emailAvailable === false ? (
                    <span title="Email Already Exists">
                      <AlertCircle className="w-3.5 h-3.5 text-[#782525]" />
                    </span>
                  ) : null}
                </div>
              </div>
              {errors.email && (
                <p className="text-[11px] text-[#782525] mt-1">{errors.email.message}</p>
              )}
              {emailAvailable === false && (
                <p className="text-[11px] text-[#782525] mt-1">This email address is already registered.</p>
              )}
            </div>

            {/* Password (Empty by default) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  className="text-[10px] text-[#0E1B2A] font-bold hover:underline inline-flex items-center space-x-1"
                >
                  <KeyRound className="w-2.5 h-2.5 text-[#C6A75E]" />
                  <span>Generate Password</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Enter or generate password"
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
                Student Status *
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] font-medium focus:outline-none focus:border-[#0E1B2A]"
              >
                <option value="ACTIVE">ACTIVE (Testing Permitted)</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="DISQUALIFIED">DISQUALIFIED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0E1B2A] uppercase tracking-wider mb-1">
                Admission Date *
              </label>
              <input
                type="date"
                {...register('admissionDate')}
                className="w-full px-3 py-2 text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
              />
            </div>
          </div>
        </FormSection>

        {/* Section 4: Guardian & Address */}
        <FormSection
          stepNumber={4}
          title="Guardian & Address"
          subtitle="Next-of-kin emergency references and residential address"
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
                Relationship
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
              Residential Address
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
              Admission Notes / Remarks (Optional)
            </label>
            <textarea
              rows={2}
              {...register('notes')}
              placeholder="Medical notes, ISSB orientation notes, or special instructions..."
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-6 py-2.5 bg-[#0E1B2A] hover:bg-[#1A2C42] text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register Student</span>
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
