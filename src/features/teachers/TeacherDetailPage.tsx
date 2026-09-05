import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  PageHeader,
  Avatar,
  ForceBadge,
  StatusBadge,
  SubjectBadge,
  MetricCard,
  Tabs,
  EmptyState,
} from '@/components/ui';
import { teacherStore } from './teacherStore';
import {
  Edit,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  BookOpen,
  FileQuestion,
  Award,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const TeacherDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const teacher = id ? teacherStore.getTeacherById(id) : undefined;

  if (!teacher) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="FACULTY DOSSIER"
          breadcrumbs={[
            { label: 'Command Console', href: '/admin/dashboard' },
            { label: 'Faculty & Instructors', href: '/admin/teachers' },
            { label: 'Not Found' },
          ]}
        />
        <EmptyState
          title="Faculty Member Not Found"
          description="The requested faculty record does not exist or has been removed from the registry."
          action={{
            label: 'Return to Faculty List',
            onClick: () => navigate('/admin/teachers'),
          }}
        />
      </div>
    );
  }

  // Mock authored questions data
  const mockAuthoredQuestions = [
    {
      code: 'Q-VERB-4091',
      subject: teacher.assignedSubjects[0] || 'INTELLIGENCE_VERBAL',
      stem: 'Which word does not belong with the others: Radar, Sonar, Lidar, Compass?',
      difficulty: 'MEDIUM',
      status: 'APPROVED',
      date: '2026-09-02',
    },
    {
      code: 'Q-PAT-8812',
      subject: teacher.assignedSubjects[1] || 'INTELLIGENCE_NON_VERBAL',
      stem: 'Select the missing figure that completes the 3x3 geometric rotation matrix.',
      difficulty: 'HARD',
      status: 'APPROVED',
      date: '2026-08-27',
    },
    {
      code: 'Q-MATH-1104',
      subject: teacher.assignedSubjects[2] || 'ACADEMIC_MATH',
      stem: 'Find the trajectory velocity equation given initial launch angle theta = 45 degrees.',
      difficulty: 'MEDIUM',
      status: 'APPROVED',
      date: '2026-08-19',
    },
  ];

  // Mock audit logs
  const auditLogs = [
    {
      action: 'Test Battery Approved',
      detail: 'Cleared 154 PMA Long Course Preliminary Battery for publication',
      timestamp: '2026-09-05 14:30 PKT',
    },
    {
      action: 'Item Bank Contribution',
      detail: 'Submitted 12 new items to Verbal Intelligence category',
      timestamp: '2026-09-03 09:15 PKT',
    },
    {
      action: 'Proctor Session Supervised',
      detail: 'Supervised Hall B CBT Terminal room during 158 GDP Mock Exam',
      timestamp: '2026-08-29 11:00 PKT',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Top Header */}
      <PageHeader
        title={`${teacher.titleRank} ${teacher.fullName}`}
        subtitle={`Faculty Docket ID: ${teacher.employeeId} · Commissioned & Faculty Appointment`}
        breadcrumbs={[
          { label: 'Command Console', href: '/admin/dashboard' },
          { label: 'Faculty & Instructors', href: '/admin/teachers' },
          { label: `${teacher.titleRank} ${teacher.fullName}` },
        ]}
        action={{
          label: 'Edit Profile',
          icon: Edit,
          onClick: () => navigate(`/admin/teachers/${teacher.id}/edit`),
        }}
      />

      {/* Main Identity Banner Card */}
      <div className="bg-white border border-[#CBD5E1] rounded-md p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <Avatar
              name={`${teacher.titleRank} ${teacher.fullName}`}
              size="lg"
              className="border-2 border-[#CBD5E1] w-16 h-16 text-lg font-bold"
            />
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-[#0E1B2A]">
                  <span className="text-[#C6A75E] mr-1.5">{teacher.titleRank}</span>
                  {teacher.fullName}
                </h1>
                <StatusBadge status={teacher.status === 'ACTIVE' ? 'active' : 'archived'} />
              </div>
              <p className="text-xs font-semibold text-[#475569] flex items-center space-x-2">
                <span className="font-mono bg-[#F1F5F9] px-2 py-0.5 rounded text-[#0E1B2A] border border-[#CBD5E1]">
                  {teacher.employeeId}
                </span>
                <span>·</span>
                <span className="text-[#0E1B2A]">
                  {teacher.role.replace(/_/g, ' ')}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                <div className="flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>{teacher.email}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span className="font-mono">{teacher.phone}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>Inducted {teacher.joinedAt}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end space-y-2">
            {teacher.branchAffiliation === 'TRI_SERVICE' ? (
              <span className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-slate-800 text-amber-300 border border-amber-400/30">
                Tri-Service Joint HQ
              </span>
            ) : (
              <ForceBadge branch={teacher.branchAffiliation} />
            )}
            <span className="text-[11px] font-mono text-[#64748B]">
              Last Active: {new Date(teacher.lastActiveAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Authored Items"
          value={teacher.questionsCreatedCount.toString()}
          subtitle="Contributed to question bank"
          icon={<FileQuestion className="w-5 h-5 text-[#0E1B2A]" />}
        />
        <MetricCard
          title="Active Test Batteries"
          value={teacher.activeTestsManaged.toString()}
          subtitle="Under active supervision"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
        />
        <MetricCard
          title="Assigned Subjects"
          value={teacher.assignedSubjects.length.toString()}
          subtitle="Core instructional fields"
          icon={<BookOpen className="w-5 h-5 text-[#C6A75E]" />}
        />
        <MetricCard
          title="Moderation Index"
          value="99.2%"
          subtitle="Editorial clearance rate"
          icon={<Award className="w-5 h-5 text-sky-600" />}
        />
      </div>

      {/* Detail Tabs */}
      <div className="bg-white border border-[#CBD5E1] rounded-md shadow-xs">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Faculty Dossier & Bio' },
            { id: 'questions', label: `Authored Questions (${mockAuthoredQuestions.length})` },
            { id: 'supervised', label: 'Supervised Batteries & Batches' },
            { id: 'logs', label: 'Security & Action Audit' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="p-6">
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] mb-2">
                  Officer Biography & Service Background
                </h3>
                <p className="text-xs text-[#334155] leading-relaxed bg-[#F8FAFC] p-4 rounded border border-[#E2E8F0]">
                  {teacher.bio ||
                    'No extended biographical summary on record. Commissioned faculty member cleared for computerized test administration, psychometric assessment, and item bank moderations.'}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] mb-3">
                  Assigned Subject Disciplines
                </h3>
                <div className="flex flex-wrap gap-2">
                  {teacher.assignedSubjects.map((sub) => (
                    <SubjectBadge key={sub} subject={sub} />
                  ))}
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] mb-3">
                  Air-Gapped LAN & Proctoring Clearance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 p-2.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Authorized for Live CBT Proctoring Radar & Terminal Overrides</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 p-2.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Authorized for Question Authoring & Answer Key Publishing</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Authored Questions */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A]">
                  Recent Item Bank Submissions
                </span>
                <Link
                  to="/admin/questions"
                  className="text-xs font-semibold text-[#0E1B2A] hover:underline"
                >
                  View in Question Bank →
                </Link>
              </div>

              <div className="border border-[#CBD5E1] rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EDF1F5] text-[#0E1B2A] font-bold text-[11px] uppercase border-b border-[#CBD5E1]">
                    <tr>
                      <th className="py-2.5 px-3">Item Code</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Stem Preview</th>
                      <th className="py-2.5 px-3">Difficulty</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {mockAuthoredQuestions.map((q) => (
                      <tr key={q.code} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0E1B2A]">{q.code}</td>
                        <td className="py-2.5 px-3">
                          <SubjectBadge subject={q.subject} />
                        </td>
                        <td className="py-2.5 px-3 text-[#334155] max-w-md truncate">{q.stem}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-700">
                          {q.difficulty}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {q.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[11px] text-[#64748B]">
                          {q.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Supervised Batteries */}
          {activeTab === 'supervised' && (
            <div className="space-y-4">
              <div className="border border-[#CBD5E1] rounded p-4 bg-[#F8FAFC]">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-xs text-[#0E1B2A]">
                    154 PMA Long Course — Intelligence Battery #01
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                    ACTIVE
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] flex items-center space-x-4">
                  <span>Sections: Verbal, Non-Verbal</span>
                  <span>Candidates: 48 Enrolled</span>
                  <span>Pass Threshold: 60%</span>
                </div>
              </div>

              <div className="border border-[#CBD5E1] rounded p-4 bg-[#F8FAFC]">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-xs text-[#0E1B2A]">
                    158 GDP Pakistan Air Force — Aerodynamics & Math
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                    ACTIVE
                  </span>
                </div>
                <div className="text-[11px] text-[#64748B] flex items-center space-x-4">
                  <span>Sections: Physics, Mathematics</span>
                  <span>Candidates: 36 Enrolled</span>
                  <span>Pass Threshold: 65%</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {auditLogs.map((log, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between p-3 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-[#0E1B2A]">{log.action}</div>
                    <div className="text-[#475569]">{log.detail}</div>
                  </div>
                  <div className="flex items-center space-x-1 font-mono text-[11px] text-[#64748B]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDetailPage;
