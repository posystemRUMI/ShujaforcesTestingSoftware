import React from 'react';
import { Bell, AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'anomaly';
  read: boolean;
}

export interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Workstation WS-CBT-03 Alt-Tab Alert',
    message: 'Candidate Bilal Ahmed exceeded window defocus threshold.',
    timestamp: '2 mins ago',
    type: 'anomaly',
    read: false,
  },
  {
    id: 'n-2',
    title: '154 PMA Long Course Autosave Cycle',
    message: 'All 42 test workstations committed cryptographically signed state.',
    timestamp: '8 mins ago',
    type: 'info',
    read: true,
  },
  {
    id: 'n-3',
    title: 'Retake Cooldown Clearance Required',
    message: 'Cadet Usman Ali has satisfied mandatory 72-hr remediation protocol.',
    timestamp: '1 hour ago',
    type: 'warning',
    read: true,
  },
];

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications = DEFAULT_NOTIFICATIONS,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-12 w-80 bg-white border-2 border-[#0E1B2A] rounded shadow-xl z-50 overflow-hidden select-none animate-in fade-in zoom-in-95 duration-100">
      <div className="px-4 py-3 bg-[#EDF1F5] border-b border-[#D4D9DF] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-[#0E1B2A]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0E1B2A] font-display">
            Operational Alerts
          </h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#64748B] hover:text-[#0E1B2A] p-0.5 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="divide-y divide-[#EDF1F5] max-h-72 overflow-y-auto">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={cn(
              'p-3 text-xs transition-colors hover:bg-[#F8FAFC]',
              !n.read ? 'bg-[#FDF7EC]/40' : 'bg-white',
            )}
          >
            <div className="flex items-start space-x-2.5">
              {n.type === 'anomaly' ? (
                <ShieldAlert className="w-4 h-4 text-[#782525] flex-shrink-0 mt-0.5" />
              ) : n.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-[#7A5312] flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#234E35] flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-0.5">
                <div className="font-semibold text-[#0E1B2A] flex justify-between items-center">
                  <span className="truncate pr-1">{n.title}</span>
                  <span className="text-[10px] font-mono text-[#94A3B8] flex-shrink-0">
                    {n.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-tight">{n.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 bg-[#F6F8FA] border-t border-[#D4D9DF] text-center">
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] font-semibold text-[#0E1B2A] hover:underline"
        >
          Mark All Telemetry Acknowledged
        </button>
      </div>
    </div>
  );
};
