import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ResponsiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  side?: 'left' | 'right';
  width?: string;
  children: React.ReactNode;
}

export const ResponsiveDrawer: React.FC<ResponsiveDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  side = 'right',
  width = 'w-96',
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-[#0E1B2A]/40 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'fixed inset-y-0 flex max-w-full',
          side === 'left' ? 'left-0' : 'right-0',
        )}
      >
        <div
          className={cn(
            'w-screen bg-white border-l border-[#D4D9DF] shadow-xl flex flex-col',
            width,
            side === 'left' && 'border-r border-l-0',
          )}
        >
          {/* Header */}
          <div className="h-16 px-5 border-b border-[#D4D9DF] flex items-center justify-between bg-[#EDF1F5] flex-shrink-0">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#0E1B2A] font-display">
                {title}
              </h3>
              {subtitle && <p className="text-[11px] text-[#64748B] font-sans">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-[#64748B] hover:text-[#0E1B2A] hover:bg-white transition-colors focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </div>
      </div>
    </div>
  );
};
