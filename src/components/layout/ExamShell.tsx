import React from 'react';
import { Outlet } from 'react-router-dom';
import '@/styles/student-portal.css';
import { MotionConfig } from 'framer-motion';

export const ExamShell: React.FC = () => {
  return (
    <MotionConfig reducedMotion="user"><div className="academy-exam min-h-screen w-full bg-[#F6F8FA] text-[#17202A] select-none exam-runner flex flex-col antialiased">
      <Outlet />
    </div></MotionConfig>
  );
};

