import { z } from 'zod';

export const teacherSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  titleRank: z.string().min(2, 'Title or rank is required (e.g. Major, Dr., Engr.)'),
  employeeId: z.string().min(3, 'Faculty identifier code is required (e.g. FAC-01)'),
  email: z.string().email('Please enter a valid academic/institutional email'),
  phone: z.string().min(7, 'Valid contact number is required'),
  branchAffiliation: z.enum(['PAKISTAN_ARMY', 'PAKISTAN_AIR_FORCE', 'PAKISTAN_NAVY', 'TRI_SERVICE']),
  role: z.enum([
    'CHIEF_EXAMINER',
    'SENIOR_INSTRUCTOR',
    'SUBJECT_SPECIALIST',
    'PROCTOR_OFFICER',
    'QUESTION_AUTHOR',
  ]),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'INACTIVE']),
  assignedSubjects: z
    .array(
      z.enum([
        'INTELLIGENCE_VERBAL',
        'INTELLIGENCE_NON_VERBAL',
        'ACADEMIC_PHYSICS',
        'ACADEMIC_MATH',
        'ACADEMIC_ENGLISH',
        'GENERAL_KNOWLEDGE',
      ]),
    )
    .min(1, 'Please select at least one assigned subject'),
  bio: z.string().optional(),
});

export type TeacherFormData = z.infer<typeof teacherSchema>;
