import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  variant = 'primary',
  isLoading = false,
}) => {
  const effectiveConfirmLabel = confirmLabel || confirmText || 'Confirm Action';
  const effectiveCancelLabel = cancelLabel || cancelText || 'Cancel';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1B2A]/50 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md bg-white border-2 border-[#0E1B2A] rounded p-6 shadow-[0_4px_0_0_rgba(14,27,42,0.08)] space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            {variant === 'danger' && (
              <div className="w-7 h-7 rounded bg-red-100 flex items-center justify-center text-[#782525]">
                <AlertTriangle className="w-4 h-4 stroke-[2]" />
              </div>
            )}
            <h3
              id="confirm-dialog-title"
              className="text-sm font-bold uppercase tracking-wider text-[#0E1B2A] font-display"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0E1B2A] p-1 rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#1F2937] leading-relaxed font-sans">
          {description}
        </p>

        <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[#EDF1F5]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 rounded text-xs font-semibold border border-[#D4D9DF] text-[#0E1B2A] hover:bg-[#EDF1F5] disabled:opacity-50 transition-colors"
          >
            {effectiveCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 rounded text-xs font-bold uppercase tracking-wider text-white transition-colors disabled:opacity-50 shadow-sm',
              variant === 'danger'
                ? 'bg-[#782525] hover:bg-[#8F2E2E]'
                : variant === 'warning'
                ? 'bg-[#7A5312] hover:bg-[#8F6317]'
                : 'bg-[#0E1B2A] hover:bg-[#1A2C42]',
            )}
          >
            {isLoading ? 'Executing...' : effectiveConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
