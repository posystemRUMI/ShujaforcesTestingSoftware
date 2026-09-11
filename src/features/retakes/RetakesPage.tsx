import React, { useEffect, useState } from 'react';
import { retakeService } from '@/services/retakeService';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { RetakeDocket } from '@/types';
import { ShieldCheck, Plus, Search, Calendar, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export const RetakesPage: React.FC = () => {
  const [retakes, setRetakes] = useState<RetakeDocket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal for new/approve retake
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedDocket, setSelectedDocket] = useState<RetakeDocket | null>(null);

  // Form State
  const [cadetName, setCadetName] = useState('Usman Ali');
  const [rollNumber, setRollNumber] = useState('PMA-2604');
  const [testTitle, setTestTitle] = useState('154 PMA Long Course Initial Screening Examination');
  const [failedSubject, setFailedSubject] = useState('Academic Mathematics & Non-Verbal Logic');
  const [previousScorePercent, setPreviousScorePercent] = useState<number>(58);
  const [scheduledDate, setScheduledDate] = useState('2026-03-12');
  const [reason, setReason] = useState('Remediation completed in non-verbal logic & mathematics.');
  const [authorizedOfficer, setAuthorizedOfficer] = useState('Maj. Tariq Mahmood (Chief Invigilator)');

  useEffect(() => {
    async function loadData() {
      try {
        if (isSupabaseConfigured()) {
          const data = await retakeService.getRetakePermissions();
          if (data) {
            const mapped: RetakeDocket[] = data.map((d) => ({
              id: d.id,
              originalResultId: d.original_attempt_id || 'res-001',
              cadetId: d.student_id,
              cadetName: 'Cadet ' + d.student_id.slice(0, 8),
              rollNumber: 'PMA-2601',
              branch: 'PAKISTAN_ARMY',
              testTitle: 'Commissioning Screening Exam',
              failedSubject: 'Academic Mathematics',
              previousScorePercent: 54,
              scheduledDate: d.expires_at ? d.expires_at.split('T')[0] : '2026-03-15',
              reason: d.notes || 'Official Retake Grant',
              authorizedOfficer: 'Col. Farooq',
              status: d.status === 'AVAILABLE' ? 'SCHEDULED' : 'RESOLVED',
            }));
            setRetakes(mapped);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch from retakeService:', e);
        toast.error('Failed to fetch retake permissions from database.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredRetakes = retakes.filter((r) => {
    const matchesSearch =
      r.cadetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.testTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAuthorizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newDocket: RetakeDocket = {
      id: selectedDocket ? selectedDocket.id : `retake-${Date.now()}`,
      originalResultId: 'res-003',
      cadetId: 'cadet-004',
      cadetName,
      rollNumber,
      branch: 'PAKISTAN_ARMY',
      testTitle,
      failedSubject,
      previousScorePercent,
      scheduledDate,
      reason,
      status: 'SCHEDULED',
      authorizedOfficer,
    };

    if (selectedDocket) {
      setRetakes((prev) => prev.map((r) => (r.id === selectedDocket.id ? newDocket : r)));
      toast.success(`Retake docket authorized for ${cadetName}`);
    } else {
      setRetakes((prev) => [newDocket, ...prev]);
      toast.success(`New retake docket created for ${cadetName}`);
    }

    setShowAuthModal(false);
    setSelectedDocket(null);
  };

  // Metrics
  const totalCount = retakes.length;
  const scheduledCount = retakes.filter((r) => r.status === 'SCHEDULED').length;
  const pendingCount = retakes.filter((r) => r.status === 'PENDING_APPROVAL').length;
  const resolvedCount = retakes.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-md border border-[#D4D9DF] shadow-sm">
        <div>
          <span className="text-[10px] font-sans font-bold text-[#C6A75E] uppercase tracking-wider">
            REMEDIATION & RE-TEST AUTHORIZATION CHAMBER
          </span>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#0E1B2A] mt-0.5">
            Retakes & Remediation Console
          </h1>
          <p className="text-xs text-[#64748B]">
            Authorize cadet re-examination tickets, schedule remediation dates, and preserve historical attempts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedDocket(null);
            setShowAuthModal(true);
          }}
          className="inline-flex items-center space-x-1.5 bg-[#0E1B2A] text-white px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#1A2C42] shadow-xs"
        >
          <Plus className="w-4 h-4 text-[#C6A75E]" />
          <span>Issue Retake Authorization Ticket</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-sans font-bold uppercase text-[#64748B]">Total Dockets</span>
          <div className="text-2xl font-bold font-sans tabular-nums text-[#0E1B2A] mt-1">{totalCount}</div>
          <span className="text-[10px] text-[#64748B]">Historical Log</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-sans font-bold uppercase text-[#64748B]">Scheduled Retakes</span>
          <div className="text-2xl font-bold font-sans tabular-nums text-[#7A5312] mt-1">{scheduledCount}</div>
          <span className="text-[10px] text-[#7A5312] font-semibold">Active Tickets</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-sans font-bold uppercase text-[#64748B]">Pending Approvals</span>
          <div className="text-2xl font-bold font-sans tabular-nums text-[#0E1B2A] mt-1">{pendingCount}</div>
          <span className="text-[10px] text-[#64748B]">Awaiting Officer Sign-off</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-sans font-bold uppercase text-[#64748B]">Resolved Retakes</span>
          <div className="text-2xl font-bold font-sans tabular-nums text-[#234E35] mt-1">{resolvedCount}</div>
          <span className="text-[10px] text-[#234E35] font-semibold">Re-tested & Passed</span>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="bg-white p-4 rounded-md border border-[#D4D9DF] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search candidate name, roll number, or test..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#D4D9DF] rounded focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-sans w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[#D4D9DF] rounded bg-white text-[#0E1B2A] font-semibold"
          >
            <option value="ALL">All Docket Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="RESOLVED">Resolved</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* Retake Table */}
      <div className="bg-white border border-[#D4D9DF] rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-xs text-[#64748B]">Loading retake dockets...</div>
        ) : filteredRetakes.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#64748B]">No retake dockets found.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px] text-xs">
              <thead>
                <tr className="border-b border-[#D4D9DF] bg-[#F6F8FA] text-[#64748B] uppercase font-sans font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Cadet Name & Roll No</th>
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3">Examination Title</th>
                  <th className="py-3 px-3">Remediation Subject</th>
                  <th className="py-3 px-3">Prior Score</th>
                  <th className="py-3 px-3">Scheduled Date</th>
                  <th className="py-3 px-3">Authorizing Officer</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E6EB]">
                {filteredRetakes.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#0E1B2A]">{r.cadetName}</div>
                      <div className="text-[10px] font-mono text-[#64748B]">{r.rollNumber}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="bg-[#EDF6F0] text-[#234E35] px-2 py-0.5 rounded border border-[#88BE9B] font-sans font-bold text-[10px] uppercase">
                        {r.branch.replace('PAKISTAN_', '')}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-[#0E1B2A] max-w-xs truncate" title={r.testTitle}>
                      {r.testTitle}
                    </td>

                    <td className="py-3 px-3 text-[#782525] font-semibold">
                      {r.failedSubject}
                    </td>

                    <td className="py-3 px-3 font-sans tabular-nums font-bold text-[#782525]">
                      {r.previousScorePercent}%
                    </td>

                    <td className="py-3 px-3 font-sans tabular-nums text-[#64748B]">
                      {r.scheduledDate}
                    </td>

                    <td className="py-3 px-3 text-[11px] font-sans text-[#0E1B2A]">
                      {r.authorizedOfficer}
                    </td>

                    <td className="py-3 px-3">
                      {r.status === 'SCHEDULED' ? (
                        <span className="inline-flex items-center gap-1 font-sans text-[10px] font-bold text-[#7A5312] bg-[#FDF7EC] px-2 py-0.5 rounded border border-[#DEC088]">
                          <Calendar className="w-3 h-3" /> SCHEDULED
                        </span>
                      ) : r.status === 'RESOLVED' ? (
                        <span className="inline-flex items-center gap-1 font-sans text-[10px] font-bold text-[#234E35] bg-[#EDF6F0] px-2 py-0.5 rounded border border-[#88BE9B]">
                          <CheckCircle2 className="w-3 h-3" /> RESOLVED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-sans text-[10px] font-bold text-[#64748B] bg-[#EDF1F5] px-2 py-0.5 rounded border border-[#D4D9DF]">
                          {r.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDocket(r);
                          setCadetName(r.cadetName);
                          setRollNumber(r.rollNumber);
                          setTestTitle(r.testTitle);
                          setFailedSubject(r.failedSubject);
                          setPreviousScorePercent(r.previousScorePercent);
                          setScheduledDate(r.scheduledDate);
                          setReason(r.reason);
                          setAuthorizedOfficer(r.authorizedOfficer);
                          setShowAuthModal(true);
                        }}
                        className="px-2.5 py-1 bg-[#0E1B2A] text-white text-xs font-bold font-sans rounded uppercase tracking-wider hover:bg-[#1A2C42]"
                      >
                        Manage Docket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Authorize Retake Docket Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-[#0E1B2A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAuthorizeSubmit}
            className="bg-white border-2 border-[#0E1B2A] rounded-md p-6 max-w-lg w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#C6A75E]" />
                <h3 className="text-base font-bold text-[#0E1B2A]">
                  {selectedDocket ? 'Manage Retake Authorization Ticket' : 'Issue Authorized Retake Docket'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="p-1 text-[#64748B] hover:text-[#0E1B2A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1">Cadet Full Name</label>
                  <input
                    type="text"
                    value={cadetName}
                    onChange={(e) => setCadetName(e.target.value)}
                    className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1">Roll Docket ID</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0E1B2A] mb-1">Examination Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1">Remediation Subject</label>
                  <input
                    type="text"
                    value={failedSubject}
                    onChange={(e) => setFailedSubject(e.target.value)}
                    className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0E1B2A] mb-1">Scheduled Retake Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0E1B2A] mb-1">Authorizing Officer Sign-Off</label>
                <input
                  type="text"
                  value={authorizedOfficer}
                  onChange={(e) => setAuthorizedOfficer(e.target.value)}
                  className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0E1B2A] mb-1">Remediation Notes & Justification</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded p-2 text-[#1F2937]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#E2E6EB]">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="px-4 py-2 border border-[#D4D9DF] text-xs font-semibold rounded text-[#64748B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0E1B2A] text-white text-xs font-bold font-sans uppercase tracking-wider rounded hover:bg-[#1A2C42]"
              >
                Authorize Retake Docket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RetakesPage;
