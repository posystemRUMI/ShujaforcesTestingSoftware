import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center p-6 select-none">
      <div className="max-w-md w-full bg-white border border-[#D4D9DF] rounded p-8 text-center shadow-[0_4px_0_0_rgba(14,27,42,0.06)] space-y-4">
        <div className="w-12 h-12 rounded bg-[#EDF1F5] flex items-center justify-center text-[#0E1B2A] mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold uppercase tracking-wider text-[#0E1B2A]">
          404 — Subsystem Not Found
        </h1>
        <p className="text-xs text-[#64748B]">
          The requested computerized testing sector or route does not exist within the system registry.
        </p>
        <div className="pt-3">
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="inline-flex items-center space-x-2 bg-[#0E1B2A] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1A2C42]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Command Console</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
