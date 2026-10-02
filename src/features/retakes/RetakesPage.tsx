import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, ArrowRight } from 'lucide-react';

export const RetakesPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center text-[#0E1B2A]">
        <RotateCcw className="w-8 h-8 opacity-60" />
      </div>
      <h1 className="text-xl font-bold text-[#0E1B2A]">Retakes Functionality Disabled</h1>
      <p className="text-xs text-[#64748B] leading-relaxed">
        Examination retakes have been disabled academy-wide in accordance with official testing directives. All candidate examination attempts are single-attempt and final.
      </p>
      <div className="pt-2">
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#0E1B2A] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#1C2E42] transition-colors"
        >
          <span>Return to Command Console</span>
          <ArrowRight className="w-4 h-4 text-[#C6A75E]" />
        </Link>
      </div>
    </div>
  );
};

export default RetakesPage;
