import React, { useState, useEffect } from 'react';
import { mockService } from '@/lib/mock-service';
import { TerminalWorkstation, TerminalWorkstationStatus } from '@/types';
import { ShieldAlert, Play, Pause, AlertTriangle, Eye, Radio, Search, Monitor, Activity, X } from 'lucide-react';
import { toast } from 'sonner';

export const LiveProctorPage: React.FC = () => {
  const [terminals, setTerminals] = useState<TerminalWorkstation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalWorkstation | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'PAUSE' | 'RESUME' | 'FORCE_SUBMIT' | 'GLOBAL_FREEZE';
    terminal?: TerminalWorkstation;
  } | null>(null);

  // Realtime simulation tick
  useEffect(() => {
    async function loadData() {
      try {
        const data = await mockService.getTerminals();
        setTerminals(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Simulated realtime progress tick
    const interval = setInterval(() => {
      setTerminals((prev) =>
        prev.map((term) => {
          if (term.status === 'ACTIVE_EXAM' && term.timeRemainingSeconds > 0) {
            const nextTime = term.timeRemainingSeconds - 1;
            const newAnswered = nextTime % 30 === 0 ? Math.min(term.answeredCount + 1, term.totalQuestions) : term.answeredCount;
            return {
              ...term,
              timeRemainingSeconds: nextTime,
              answeredCount: newAnswered,
              networkLatencyMs: Math.floor(12 + Math.random() * 20),
            };
          }
          return term;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredTerminals = terminals.filter((t) => {
    const matchesSearch =
      t.terminalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ipAddress.includes(searchTerm) ||
      (t.currentCadet && t.currentCadet.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.currentCadet && t.currentCadet.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Action Handlers
  const handleExecuteAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'PAUSE' && confirmAction.terminal) {
      setTerminals((prev) =>
        prev.map((t) => (t.id === confirmAction.terminal!.id ? { ...t, status: 'ANOMALY' as TerminalWorkstationStatus, lockStatus: true } : t))
      );
      toast.warning(`Session paused for workstation ${confirmAction.terminal.terminalCode}`);
    } else if (confirmAction.type === 'RESUME' && confirmAction.terminal) {
      setTerminals((prev) =>
        prev.map((t) => (t.id === confirmAction.terminal!.id ? { ...t, status: 'ACTIVE_EXAM' as TerminalWorkstationStatus, lockStatus: false } : t))
      );
      toast.success(`Session resumed for workstation ${confirmAction.terminal.terminalCode}`);
    } else if (confirmAction.type === 'FORCE_SUBMIT' && confirmAction.terminal) {
      setTerminals((prev) =>
        prev.map((t) => (t.id === confirmAction.terminal!.id ? { ...t, status: 'ONLINE' as TerminalWorkstationStatus, currentCadet: null } : t))
      );
      toast.error(`Forced test submission executed for ${confirmAction.terminal.terminalCode}`);
    } else if (confirmAction.type === 'GLOBAL_FREEZE') {
      setTerminals((prev) =>
        prev.map((t) => (t.status === 'ACTIVE_EXAM' ? { ...t, status: 'ANOMALY' as TerminalWorkstationStatus, lockStatus: true } : t))
      );
      toast.error('EMERGENCY COMMAND EXECUTED: All active CBT workstations frozen by Chief Proctor.');
    }

    setConfirmAction(null);
  };

  // Metric counts
  const totalCount = terminals.length;
  const activeCount = terminals.filter((t) => t.status === 'ACTIVE_EXAM').length;
  const anomalyCount = terminals.filter((t) => t.status === 'ANOMALY' || t.anomalyDetected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-md border border-[#D4D9DF] shadow-sm">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#C6A75E] uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#234E35] animate-pulse" />
            <span>REALTIME EXAMINATION PROCTORING CONSOLE</span>
          </span>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#0E1B2A] mt-0.5">
            Live CBT Workstation Monitoring
          </h1>
          <p className="text-xs text-[#64748B]">
            Workstation radar telemetry, candidate pacing monitoring, and remote session control.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setConfirmAction({ type: 'GLOBAL_FREEZE' })}
            className="inline-flex items-center space-x-1.5 bg-[#782525] text-white px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#8F2E2E] transition-colors shadow-xs"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency Freeze All</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#64748B]">Total Terminals</span>
          <div className="text-2xl font-bold font-mono text-[#0E1B2A] mt-1">{totalCount}</div>
          <span className="text-[10px] text-[#64748B]">LAN Station Nodes</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#64748B]">Active Testing</span>
          <div className="text-2xl font-bold font-mono text-[#234E35] mt-1">{activeCount}</div>
          <span className="text-[10px] text-[#234E35] font-semibold">Live Candidates</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#64748B]">Anomalies / Paused</span>
          <div className="text-2xl font-bold font-mono text-[#782525] mt-1">{anomalyCount}</div>
          <span className="text-[10px] text-[#782525] font-semibold">Attention Required</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-4 rounded-md shadow-xs">
          <span className="text-[10px] font-mono font-bold uppercase text-[#64748B]">Station Latency</span>
          <div className="text-2xl font-bold font-mono text-[#0E1B2A] mt-1">16 ms</div>
          <span className="text-[10px] text-[#234E35]">Optimal Network Sync</span>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="bg-white p-4 rounded-md border border-[#D4D9DF] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search terminal code, IP, or cadet name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#D4D9DF] rounded focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[#D4D9DF] rounded bg-white text-[#0E1B2A] font-semibold"
          >
            <option value="ALL">All Terminal Statuses</option>
            <option value="ACTIVE_EXAM">Active Exam</option>
            <option value="ANOMALY">Anomaly / Paused</option>
            <option value="ONLINE">Online Standby</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      {/* Live Workstations Matrix Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-12 text-xs text-[#64748B]">Loading terminal telemetry...</div>
        ) : filteredTerminals.length === 0 ? (
          <div className="col-span-full text-center py-12 text-xs text-[#64748B]">No workstations match filter.</div>
        ) : (
          filteredTerminals.map((term) => {
            const isExam = term.status === 'ACTIVE_EXAM';
            const isAnomaly = term.status === 'ANOMALY' || term.anomalyDetected;

            return (
              <div
                key={term.id}
                className={`bg-white border rounded-md p-5 shadow-sm space-y-4 transition-all ${
                  isAnomaly
                    ? 'border-[#782525] ring-1 ring-[#782525]'
                    : isExam
                    ? 'border-[#0E1B2A]'
                    : 'border-[#D4D9DF]'
                }`}
              >
                {/* Workstation Top Strip */}
                <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-3">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-[#0E1B2A]" />
                    <span className="font-mono font-bold text-xs text-[#0E1B2A]">{term.terminalCode}</span>
                    <span className="text-[10px] font-mono text-[#64748B]">({term.ipAddress})</span>
                  </div>

                  {isAnomaly ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#782525] bg-[#FDF2F2] px-2 py-0.5 rounded border border-[#E29A9A] animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> ANOMALY
                    </span>
                  ) : isExam ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#234E35] bg-[#EDF6F0] px-2 py-0.5 rounded border border-[#88BE9B]">
                      <Activity className="w-3 h-3" /> ACTIVE EXAM
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#64748B] bg-[#EDF1F5] px-2 py-0.5 rounded border border-[#D4D9DF]">
                      ONLINE STANDBY
                    </span>
                  )}
                </div>

                {/* Cadet & Test Info */}
                {term.currentCadet ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-[#0E1B2A]">{term.currentCadet.name}</div>
                        <div className="text-[10px] font-mono text-[#64748B]">{term.currentCadet.rollNumber}</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-[#F6F8FA] px-2 py-0.5 rounded border text-[#0E1B2A]">
                        {term.currentCadet.branch.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-[#64748B] truncate" title={term.testTitle || ''}>
                      {term.testTitle}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1 bg-[#F6F8FA] p-2 rounded border border-[#E2E6EB]">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>Pacing: Q {term.currentQuestion}/{term.totalQuestions}</span>
                        <span className="font-bold text-[#0E1B2A]">
                          {Math.round((term.answeredCount / term.totalQuestions) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-[#E2E6EB] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#234E35] h-full"
                          style={{ width: `${(term.answeredCount / term.totalQuestions) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-[#64748B] font-mono">
                    Station unassigned. Ready for candidate login.
                  </div>
                )}

                {/* Actions Footer */}
                <div className="border-t border-[#E2E6EB] pt-3 flex items-center justify-between gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setSelectedTerminal(term)}
                    className="px-2.5 py-1 bg-[#F6F8FA] border border-[#D4D9DF] rounded text-[#0E1B2A] hover:bg-[#EDF1F5] flex items-center gap-1 font-bold"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect
                  </button>

                  {isExam ? (
                    <button
                      type="button"
                      onClick={() => setConfirmAction({ type: 'PAUSE', terminal: term })}
                      className="px-2.5 py-1 bg-[#FDF7EC] border border-[#DEC088] text-[#7A5312] rounded font-bold hover:bg-[#FDF0D5]"
                    >
                      <Pause className="w-3.5 h-3.5 inline mr-1" /> Pause
                    </button>
                  ) : isAnomaly ? (
                    <button
                      type="button"
                      onClick={() => setConfirmAction({ type: 'RESUME', terminal: term })}
                      className="px-2.5 py-1 bg-[#EDF6F0] border border-[#88BE9B] text-[#234E35] rounded font-bold hover:bg-[#E1F2E6]"
                    >
                      <Play className="w-3.5 h-3.5 inline mr-1" /> Resume
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Telemetry Inspection Drawer */}
      {selectedTerminal && (
        <div className="fixed inset-0 bg-[#0E1B2A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0E1B2A] rounded-md p-6 max-w-xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#C6A75E] uppercase tracking-wider">
                  TELEMETRY INSPECTION DRAWER
                </span>
                <h3 className="text-lg font-bold text-[#0E1B2A]">
                  Workstation Ref: {selectedTerminal.terminalCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTerminal(null)}
                className="p-1 text-[#64748B] hover:text-[#0E1B2A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono bg-[#F6F8FA] p-4 rounded border border-[#E2E6EB]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Terminal IP Address:</span>
                <span className="font-bold text-[#0E1B2A]">{selectedTerminal.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Active Cadet:</span>
                <span className="font-bold text-[#0E1B2A]">
                  {selectedTerminal.currentCadet?.name || 'None'} ({selectedTerminal.currentCadet?.rollNumber || 'N/A'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Test Title:</span>
                <span className="font-bold text-[#0E1B2A]">{selectedTerminal.testTitle || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Network Latency:</span>
                <span className="font-bold text-[#234E35]">{selectedTerminal.networkLatencyMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Lock State:</span>
                <span className="font-bold text-[#782525]">
                  {selectedTerminal.lockStatus ? 'LOCKED / PAUSED' : 'UNLOCKED / ACTIVE'}
                </span>
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t border-[#E2E6EB]">
              <button
                type="button"
                onClick={() => setConfirmAction({ type: 'FORCE_SUBMIT', terminal: selectedTerminal })}
                className="px-3 py-2 bg-[#782525] text-white rounded text-xs font-bold font-mono uppercase hover:bg-[#8F2E2E]"
              >
                Force Final Submit
              </button>
              <button
                type="button"
                onClick={() => setSelectedTerminal(null)}
                className="px-4 py-2 bg-[#0E1B2A] text-white rounded text-xs font-bold font-mono uppercase"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-[#0E1B2A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0E1B2A] rounded-md p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-[#782525] border-b border-[#E2E6EB] pb-3">
              <AlertTriangle className="w-6 h-6 text-[#C6A75E]" />
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#C6A75E]">FACULTY COMMAND CONFIRMATION</span>
                <h3 className="text-base font-bold text-[#0E1B2A]">
                  Execute {confirmAction.type.replace('_', ' ')}?
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Confirming this action will immediately dispatch a proctor command packet to the target candidate workstation.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border border-[#D4D9DF] text-xs font-semibold rounded text-[#64748B] hover:bg-[#EDF1F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                className="px-5 py-2 bg-[#782525] text-white text-xs font-bold uppercase rounded hover:bg-[#8F2E2E]"
              >
                Confirm Command
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveProctorPage;
