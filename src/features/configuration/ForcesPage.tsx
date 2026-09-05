import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, ForceBadge, MetricCard } from '@/components/ui';
import { configStore } from './configStore';
import { ForceConfig } from './types';
import {
  BookOpen,
  Users,
  FileQuestion,
  ArrowRight,
  Building,
} from 'lucide-react';

export const ForcesPage: React.FC = () => {
  const navigate = useNavigate();
  const [forces, setForces] = useState<ForceConfig[]>(configStore.getForces());

  useEffect(() => {
    const unsub = configStore.subscribe(() => {
      setForces(configStore.getForces());
    });
    return unsub;
  }, []);

  const totalCourses = forces.reduce((sum, f) => sum + f.coursesCount, 0);
  const totalCadets = forces.reduce((sum, f) => sum + f.enrolledCadetsCount, 0);
  const totalQuestions = forces.reduce((sum, f) => sum + f.totalQuestionsCount, 0);

  return (
    <div className="space-y-6 pb-12 max-w-6xl">
      <PageHeader
        title="ARMED FORCES BRANCHES"
        subtitle="Tri-service induction branches, commissioning courses, and service-specific examination syllabi"
        breadcrumbs={[
          { label: 'Command Console', href: '/admin/dashboard' },
          { label: 'Armed Forces Branches' },
        ]}
      />

      {/* Top Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Commissioning Courses"
          value={totalCourses.toString()}
          subtitle="Accredited officer programs"
          icon={<BookOpen className="w-5 h-5 text-[#0E1B2A]" />}
        />
        <MetricCard
          title="Active Enrolled Candidates"
          value={totalCadets.toString()}
          subtitle="Under current induction training"
          icon={<Users className="w-5 h-5 text-emerald-600" />}
        />
        <MetricCard
          title="Question Bank Depth"
          value={totalQuestions.toLocaleString()}
          subtitle="Tri-service validated items"
          icon={<FileQuestion className="w-5 h-5 text-[#C6A75E]" />}
        />
      </div>

      {/* Force Cards */}
      <div className="space-y-6">
        {forces.map((force) => (
          <div
            key={force.id}
            className="bg-white border border-[#CBD5E1] rounded-lg p-6 shadow-xs hover:border-[#0E1B2A] transition-all space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <ForceBadge branch={force.branch} />
                  <span className="text-xs font-mono text-[#64748B]">{force.inductionCenter}</span>
                </div>

                <h2 className="text-xl font-bold text-[#0E1B2A]">{force.name}</h2>

                <div className="bg-[#F8FAFC] border-l-2 border-[#C6A75E] px-3 py-1.5 rounded-r">
                  <p className="text-xs italic font-semibold text-[#0E1B2A]">"{force.motto}"</p>
                  <p className="text-[11px] text-[#64748B]">{force.mottoTranslation}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/admin/forces/${force.id}`)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-[#0E1B2A] text-white hover:bg-[#1A2C42] rounded transition-colors shadow-xs self-start"
              >
                <span>Branch Profile</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C6A75E]" />
              </button>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">{force.description}</p>

            <div className="flex items-center space-x-1.5 text-xs text-[#64748B]">
              <Building className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>Headquarters: <strong className="text-[#0E1B2A]">{force.headquarters}</strong></span>
            </div>

            {/* 4 Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E2E8F0]">
              <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-semibold text-[#64748B]">Active Courses</span>
                <div className="text-base font-bold font-mono text-[#0E1B2A]">{force.coursesCount} Programs</div>
              </div>
              <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-semibold text-[#64748B]">Enrolled Cadets</span>
                <div className="text-base font-bold font-mono text-emerald-700">{force.enrolledCadetsCount} Candidates</div>
              </div>
              <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-semibold text-[#64748B]">Item Bank Items</span>
                <div className="text-base font-bold font-mono text-[#0E1B2A]">{force.totalQuestionsCount} Items</div>
              </div>
              <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                <span className="text-[10px] uppercase font-semibold text-[#64748B]">Active Test Batteries</span>
                <div className="text-base font-bold font-mono text-[#C6A75E]">{force.activeTestsCount} Live</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForcesPage;
