import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppLogo } from '@/components/ui';
import { ShieldCheck, Lock, Award } from 'lucide-react';

export const AuthShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row select-none font-sans">
      {/* Left Media & Branding Panel */}
      <div className="relative w-full lg:w-[55%] xl:w-[60%] flex flex-col justify-between bg-[#0E1B2A] min-h-[180px] sm:min-h-[230px] lg:min-h-screen overflow-hidden">
        
        {/* Background Video with Fallback (z-0) */}
        <div className="absolute inset-0 w-full h-full z-0 bg-[#0E1B2A] bg-[url('/assets/academy-poster.jpg')] bg-cover bg-center">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/assets/academy-poster.jpg"
            className="w-full h-full object-cover motion-reduce:hidden absolute inset-0 z-0"
          >
            <source src="/videos/Mainpagevid.mp4" type="video/mp4" />
          </video>
          
          {/* Subtle Overlay for Readability (z-10) */}
          <div className="absolute inset-0 bg-[#0E1B2A]/20 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0E1B2A]/30 via-transparent to-transparent z-10 pointer-events-none"></div>
        </div>

        {/* Content Over Video (z-20) */}
        <div className="relative z-20 p-6 sm:p-10 lg:p-12 flex flex-col h-full justify-between">
          {/* Top Branding */}
          <div className="flex flex-col">
            <AppLogo
              size="lg"
              theme="dark"
            />
            <div className="mt-1.5 lg:pl-[62px]">
              <span className="text-[13px] lg:text-[14px] font-medium text-white/95 tracking-wide drop-shadow-sm">
                Computerized Testing & Examination System
              </span>
            </div>
          </div>

          {/* Middle/Bottom Copy (Hidden on Mobile for brevity) */}
          <div className="hidden lg:flex flex-col mt-auto space-y-4 mb-16 xl:mb-24">
            <h1 className="text-3xl xl:text-4xl font-bold text-white tracking-tight drop-shadow-md">
              Discipline. Knowledge. Excellence.
            </h1>
            <p className="text-[15px] xl:text-[16px] text-white/95 max-w-lg leading-relaxed font-normal drop-shadow-sm">
              Secure digital assessment for students, instructors and academy administration.
            </p>

            <div className="flex items-center space-x-6 pt-6">
              <div className="flex items-center space-x-2.5 text-[13px] font-medium text-white drop-shadow-sm">
                <ShieldCheck className="w-[18px] h-[18px] text-[#C6A75E]" />
                <span>Secure Access</span>
              </div>
              <div className="flex items-center space-x-2.5 text-[13px] font-medium text-white drop-shadow-sm">
                <Lock className="w-[18px] h-[18px] text-[#C6A75E]" />
                <span>Structured Assessments</span>
              </div>
              <div className="flex items-center space-x-2.5 text-[13px] font-medium text-white drop-shadow-sm">
                <Award className="w-[18px] h-[18px] text-[#C6A75E]" />
                <span>Verified Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Authentication Panel */}
      <div className="w-full lg:w-[45%] xl:w-[40%] bg-[#FFFFFF] lg:bg-[#F8FAFC] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 flex-grow">
        <div className="w-full max-w-[440px] bg-white lg:bg-transparent rounded-2xl lg:rounded-none lg:shadow-none p-6 sm:p-8 lg:p-0 border border-[#E6E8EC] lg:border-none shadow-sm">
          {/* Mobile Header Branding Backup */}
          <div className="lg:hidden mb-8 flex justify-center text-center">
            <AppLogo
              size="md"
              theme="light"
            />
          </div>
          <Outlet />
        </div>
        
        {/* Footer info attached to bottom of panel */}
        <div className="hidden lg:block fixed bottom-6 text-[11px] text-[#667085] text-center w-[45%] xl:w-[40%] right-0">
          Shuja Forces Academy Pindsultani
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
