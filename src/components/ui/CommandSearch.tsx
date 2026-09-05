import React, { useState, useEffect } from 'react';
import { Search, X, Users, IdCard, FileQuestion, Wrench, Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockCadets, mockBatches, mockQuestions } from '@/lib/mock-data';

export interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandSearch: React.FC<CommandSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCadets = mockCadets.filter(
    (c) =>
      c.fullName.toLowerCase().includes(query.toLowerCase()) ||
      c.rollNumber.toLowerCase().includes(query.toLowerCase()),
  );

  const filteredBatches = mockBatches.filter(
    (b) =>
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.code.toLowerCase().includes(query.toLowerCase()),
  );

  const filteredQuestions = mockQuestions.filter(
    (q) =>
      q.stem.toLowerCase().includes(query.toLowerCase()) ||
      q.code.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-[#0E1B2A]/50 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-white border-2 border-[#0E1B2A] rounded shadow-[0_4px_0_0_rgba(14,27,42,0.1)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-[#D4D9DF] bg-[#F6F8FA]">
          <Search className="w-4 h-4 text-[#64748B] stroke-[2]" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cadets, batches, tests, questions, or command codes (ESC to close)..."
            className="w-full px-3 py-3 text-xs bg-transparent border-none focus:outline-none text-[#1F2937] placeholder-[#94A3B8]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[#64748B] hover:text-[#0E1B2A] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#EDF1F5] text-xs">
          {/* Quick Actions / Navigation */}
          <div className="py-2">
            <span className="px-2 text-[10px] font-bold uppercase text-[#64748B] font-mono">
              Quick Navigation
            </span>
            <div className="mt-1 space-y-0.5">
              {[
                { label: 'Live Proctor Radar Matrix', path: '/admin/live-proctor', icon: Shield },
                { label: 'Question Authoring Studio', path: '/admin/authoring', icon: FileQuestion },
                { label: 'Test Blueprint Builder', path: '/admin/test-builder', icon: Wrench },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleSelect(item.path)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#EDF1F5] transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2 text-[#0E1B2A]">
                      <Icon className="w-3.5 h-3.5 text-[#64748B]" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cadets Match */}
          {filteredCadets.length > 0 && (
            <div className="py-2">
              <span className="px-2 text-[10px] font-bold uppercase text-[#64748B] font-mono">
                Cadet Dockets ({filteredCadets.length})
              </span>
              <div className="mt-1 space-y-0.5">
                {filteredCadets.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect('/admin/cadets')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#EDF1F5] transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <IdCard className="w-3.5 h-3.5 text-[#0E1B2A]" />
                      <span className="font-semibold text-[#0E1B2A]">{c.fullName}</span>
                      <span className="font-mono text-[#64748B]">({c.rollNumber})</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-[#455D4A]">
                      {c.branch.replace('PAKISTAN_', '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Batches Match */}
          {filteredBatches.length > 0 && (
            <div className="py-2">
              <span className="px-2 text-[10px] font-bold uppercase text-[#64748B] font-mono">
                Batches ({filteredBatches.length})
              </span>
              <div className="mt-1 space-y-0.5">
                {filteredBatches.slice(0, 3).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelect('/admin/batches')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#EDF1F5] transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-[#0E1B2A]" />
                      <span className="font-semibold text-[#0E1B2A]">{b.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#64748B]">{b.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Questions Match */}
          {filteredQuestions.length > 0 && (
            <div className="py-2">
              <span className="px-2 text-[10px] font-bold uppercase text-[#64748B] font-mono">
                Questions ({filteredQuestions.length})
              </span>
              <div className="mt-1 space-y-0.5">
                {filteredQuestions.slice(0, 3).map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleSelect('/admin/questions')}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#EDF1F5] transition-colors text-left"
                  >
                    <div className="truncate max-w-sm">
                      <span className="font-mono font-bold text-[#0E1B2A] mr-2">[{q.code}]</span>
                      <span className="text-[#1F2937]">{q.stem}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#EDF1F5] border-t border-[#D4D9DF] flex items-center justify-between text-[11px] font-mono text-[#64748B]">
          <span>Use ARROW KEYS to navigate, ENTER to select</span>
          <span>[CTRL+K] / [ESC]</span>
        </div>
      </div>
    </div>
  );
};
