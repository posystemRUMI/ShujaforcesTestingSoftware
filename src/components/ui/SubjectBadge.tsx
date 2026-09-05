import React from 'react';
import { SubjectCategory } from '@/types';
import { cn } from '@/lib/utils';
import { BookOpen } from 'lucide-react';

const SUBJECT_LABELS: Record<SubjectCategory, string> = {
  INTELLIGENCE_VERBAL: 'Verbal Intelligence',
  INTELLIGENCE_NON_VERBAL: 'Non-Verbal Intelligence',
  ACADEMIC_PHYSICS: 'Physics',
  ACADEMIC_MATH: 'Mathematics',
  ACADEMIC_ENGLISH: 'English',
  GENERAL_KNOWLEDGE: 'General Knowledge',
};

export interface SubjectBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  subject: SubjectCategory;
}

export const SubjectBadge: React.FC<SubjectBadgeProps> = ({ subject, className, ...props }) => {
  const label = SUBJECT_LABELS[subject] || subject;

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-xs text-[11px] font-medium bg-[#EDF1F5] text-[#0E1B2A] border border-[#D4D9DF] select-none',
        className,
      )}
      {...props}
    >
      <BookOpen className="w-3 h-3 text-[#64748B] flex-shrink-0" />
      <span>{label}</span>
    </span>
  );
};
