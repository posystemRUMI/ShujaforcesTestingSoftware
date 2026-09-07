export type GenderType = 'Male' | 'Female';

export type EducationLevel =
  | 'Matric (Science)'
  | 'Matric (Arts)'
  | 'FSc (Pre-Engineering)'
  | 'FSc (Pre-Medical)'
  | 'ICS (Computer Science)'
  | 'I.Com'
  | 'FA'
  | 'A-Levels'
  | 'Graduation / BS'
  | 'Other';

export type GuardianRelation = 'Father' | 'Mother' | 'Brother' | 'Uncle' | 'Guardian';

export type CadetAdmissionStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DISQUALIFIED';

export interface ForceOption {
  id: string;
  code: string;
  name: string;
  motto?: string;
}

export interface CourseOption {
  id: string;
  forceId: string;
  code: string;
  name: string;
  durationWeeks?: number;
}

export interface BatchOption {
  id: string;
  courseId: string;
  code: string;
  name: string;
  sessionName?: string;
  status: string;
}

export interface StudentRegistrationInput {
  // Section 1: Personal Information
  fullName: string;
  fatherName: string;
  dateOfBirth?: string;
  gender: GenderType;
  cnic: string;
  phone: string;
  alternatePhone?: string;

  // Section 2: Education & Target
  education: string;
  educationDetails?: string;
  targetForceId: string;
  targetCourseId: string;
  batchId: string;

  // Section 3: Login Details
  rollNumber: string;
  email: string;
  password: string;
  status: CadetAdmissionStatus;

  // Section 4: Guardian & Address
  guardianName?: string;
  guardianRelationship?: GuardianRelation;
  guardianPhone?: string;
  address?: string;

  // Section 5: Student Photo
  photoUrl?: string;

  // Section 6: Admission Details
  admissionDate?: string;
  notes?: string;
}

export interface RegistrationResult {
  success: boolean;
  studentId: string;
  profileId: string;
  rollNumber: string;
  email: string;
  displayName: string;
}
