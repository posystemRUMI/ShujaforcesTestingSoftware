import { z } from 'zod';

export const studentFormSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  fatherName: z.string().min(3, 'Father name must be at least 3 characters'),
  cnic: z
    .string()
    .regex(/^\d{5}-\d{7}-\d{1}$/, 'CNIC must follow format 00000-0000000-0'),
  phone: z.string().min(10, 'Valid Pakistani mobile number required (03xx-xxxxxxx)'),
  rollNumber: z.string().min(3, 'Unique Roll Number is required'),
  temporaryCredential: z.string().min(6, 'Initial clearance code must be at least 6 characters'),
  branch: z.enum(['PAKISTAN_ARMY', 'PAKISTAN_AIR_FORCE', 'PAKISTAN_NAVY']),
  batchId: z.string().min(1, 'Target batch selection is required'),
  targetCourse: z.string().min(2, 'Induction target course required (e.g. 154 PMA, 158 GDP)'),
  status: z.enum(['ACTIVE', 'GRADUATED', 'RETAKE_REQUIRED', 'DISQUALIFIED']),
  avatarUrl: z.string().optional(),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
