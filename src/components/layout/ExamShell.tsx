import React from 'react';
import { Outlet } from 'react-router-dom';

export const ExamShell: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#F6F8FA] text-[#17202A] select-none exam-runner flex flex-col antialiased">
      <Outlet />
    </div>
  );
};

