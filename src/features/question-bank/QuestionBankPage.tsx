import React, { useEffect, useState } from 'react';
import { questionService } from '@/services/questionService';
import { Question, QuestionApprovalStatus } from '@/types';
import { Plus, Search, Eye, Edit3, Image as ImageIcon, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Preview Drawer Modal
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      try {
        const data = await questionService.getQuestions();
        setQuestions(data);
      } catch (e) {
        console.warn('Failed to load questions from questionService:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.stem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.authorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = selectedSubject === 'ALL' || q.subject === selectedSubject;
    const matchesBranch = selectedBranch === 'ALL' || q.branch === selectedBranch || q.branch === 'TRI_SERVICE';
    const matchesStatus = selectedStatus === 'ALL' || q.status === selectedStatus;

    return matchesSearch && matchesSubject && matchesBranch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeactivateSelected = () => {
    if (selectedIds.size === 0) return;
    setQuestions((prev) =>
      prev.map((q) => (selectedIds.has(q.id) ? { ...q, status: 'ARCHIVED' as QuestionApprovalStatus } : q))
    );
    toast.success(`Archived ${selectedIds.size} selected questions.`);
    setSelectedIds(new Set());
  };

  // Metrics
  const totalCount = questions.length;
  const verbalCount = questions.filter((q) => q.subject === 'INTELLIGENCE_VERBAL').length;
  const nonVerbalCount = questions.filter((q) => q.subject === 'INTELLIGENCE_NON_VERBAL').length;
  const academicCount = questions.filter((q) => q.subject.startsWith('ACADEMIC_')).length;
  const approvedCount = questions.filter((q) => q.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-md border border-[#D4D9DF] shadow-sm">
        <div>
          <span className="text-[10px] font-sans font-bold text-[#C6A75E] uppercase tracking-wider">
            ASSESSMENT CONTENT MANAGEMENT
          </span>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#0E1B2A] mt-0.5">
            Question Bank Repository
          </h1>
          <p className="text-xs text-[#64748B]">
            Categorized intelligence, verbal, non-verbal, and academic question item studio.
          </p>
        </div>
        <Link
          to="/admin/authoring"
          className="inline-flex items-center space-x-1.5 bg-[#0E1B2A] text-white px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#1A2C42] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 text-[#C6A75E]" />
          <span>Question Authoring Studio</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-[#D4D9DF] p-3.5 rounded-md shadow-xs">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#64748B]">Total Items</span>
          <div className="text-xl font-bold font-sans tabular-nums text-[#0E1B2A] mt-1">{totalCount}</div>
          <span className="text-[10px] text-[#234E35] font-semibold">{approvedCount} Approved</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-3.5 rounded-md shadow-xs">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#64748B]">Verbal Intel</span>
          <div className="text-xl font-bold font-sans tabular-nums text-[#0E1B2A] mt-1">{verbalCount}</div>
          <span className="text-[10px] text-[#64748B]">Item Pool</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-3.5 rounded-md shadow-xs">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#64748B]">Non-Verbal Intel</span>
          <div className="text-xl font-bold font-sans tabular-nums text-[#0E1B2A] mt-1">{nonVerbalCount}</div>
          <span className="text-[10px] text-[#64748B]">Diagram Based</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-3.5 rounded-md shadow-xs">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#64748B]">Academic Pool</span>
          <div className="text-xl font-bold font-sans tabular-nums text-[#0E1B2A] mt-1">{academicCount}</div>
          <span className="text-[10px] text-[#64748B]">Math & Physics</span>
        </div>
        <div className="bg-white border border-[#D4D9DF] p-3.5 rounded-md shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#64748B]">Tri-Service Ready</span>
          <div className="text-xl font-bold font-sans tabular-nums text-[#234E35] mt-1">100%</div>
          <span className="text-[10px] text-[#234E35]">CBT Standard</span>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="bg-white p-4 rounded-md border border-[#D4D9DF] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search stem, code, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#D4D9DF] rounded focus:outline-none focus:border-[#0E1B2A] focus:ring-1 focus:ring-[#C6A75E]"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs font-sans">
            {/* Subject Select */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-[#D4D9DF] rounded bg-white text-[#0E1B2A] font-semibold focus:outline-none"
            >
              <option value="ALL">All Subjects</option>
              <option value="INTELLIGENCE_VERBAL">Verbal Intelligence</option>
              <option value="INTELLIGENCE_NON_VERBAL">Non-Verbal Intelligence</option>
              <option value="ACADEMIC_PHYSICS">Academic Physics</option>
              <option value="ACADEMIC_MATH">Academic Mathematics</option>
              <option value="ACADEMIC_ENGLISH">Academic English</option>
            </select>

            {/* Branch Select */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 border border-[#D4D9DF] rounded bg-white text-[#0E1B2A] font-semibold focus:outline-none"
            >
              <option value="ALL">All Forces</option>
              <option value="PAKISTAN_ARMY">Pakistan Army</option>
              <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option>
              <option value="PAKISTAN_NAVY">Pakistan Navy</option>
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-[#D4D9DF] rounded bg-white text-[#0E1B2A] font-semibold focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleDeactivateSelected}
                className="px-3 py-2 bg-[#782525] text-white rounded font-bold uppercase text-[11px] hover:bg-[#8F2E2E]"
              >
                Archive ({selectedIds.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Questions Data Table Container */}
      <div className="bg-white border border-[#D4D9DF] rounded-md shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-xs text-[#64748B]">Loading question repository...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#64748B]">
            No questions match your filter criteria.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px] text-xs">
              <thead>
                <tr className="border-b border-[#D4D9DF] bg-[#F6F8FA] text-[#64748B] uppercase font-sans font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-[#D4D9DF]"
                    />
                  </th>
                  <th className="py-3 px-3">Code & Subject</th>
                  <th className="py-3 px-3">Question Stem</th>
                  <th className="py-3 px-3">Target Forces</th>
                  <th className="py-3 px-3">Time Limit</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E6EB]">
                {filteredQuestions.map((q) => {
                  const isSelected = selectedIds.has(q.id);

                  return (
                    <tr key={q.id} className={`hover:bg-[#F8FAFC] transition-colors ${isSelected ? 'bg-[#EDF6F0]/50' : ''}`}>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(q.id)}
                          className="rounded border-[#D4D9DF]"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-[#0E1B2A] bg-[#EDF1F5] px-1.5 py-0.5 rounded border border-[#D4D9DF]">
                            {q.code}
                          </span>
                          {q.imageUrl && (
                            <span title="Contains Diagram/Image" className="text-[#C6A75E]">
                              <ImageIcon className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-sans text-[#64748B] mt-0.5">
                          {q.subject.replace('INTELLIGENCE_', '').replace('ACADEMIC_', '')}
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-xs sm:max-w-md">
                        <p className="font-medium text-[#0E1B2A] truncate" title={q.stem}>
                          {q.stem}
                        </p>
                        <span className="text-[10px] text-[#64748B] font-sans">
                          Author: {q.authorName} • {q.options.length} Alternatives
                        </span>
                      </td>

                      <td className="py-3 px-3 font-sans text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-[#EDF6F0] text-[#234E35] font-bold border border-[#88BE9B] uppercase">
                          {q.branch.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-sans tabular-nums text-[#64748B]">
                        {q.timeLimitSeconds} Seconds
                      </td>

                      <td className="py-3 px-3">
                        {q.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 font-sans text-[10px] font-bold text-[#234E35] bg-[#EDF6F0] px-2 py-0.5 rounded border border-[#88BE9B]">
                            <Check className="w-3 h-3" /> APPROVED
                          </span>
                        ) : q.status === 'PENDING_REVIEW' ? (
                          <span className="inline-flex items-center gap-1 font-sans text-[10px] font-bold text-[#7A5312] bg-[#FDF7EC] px-2 py-0.5 rounded border border-[#DEC088]">
                            PENDING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-sans text-[10px] font-bold text-[#64748B] bg-[#EDF1F5] px-2 py-0.5 rounded border border-[#D4D9DF]">
                            {q.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setPreviewQuestion(q)}
                            title="Preview Candidate View"
                            className="p-1.5 text-[#0E1B2A] hover:bg-[#EDF1F5] rounded border border-[#D4D9DF]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            to={`/admin/authoring?id=${q.id}`}
                            title="Edit Question Studio"
                            className="p-1.5 text-[#0E1B2A] hover:bg-[#EDF1F5] rounded border border-[#D4D9DF]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Accessible Question Preview Modal Drawer */}
      {previewQuestion && (
        <div className="fixed inset-0 bg-[#0E1B2A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0E1B2A] rounded-md p-6 max-w-2xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-3">
              <div>
                <span className="text-[10px] font-sans font-bold text-[#C6A75E] uppercase tracking-wider">
                  CANDIDATE EXAM PREVIEW MODE
                </span>
                <h3 className="text-base font-bold text-[#0E1B2A]">
                  Question Ref: <span className="font-mono">{previewQuestion.code}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="p-1.5 text-[#64748B] hover:text-[#0E1B2A] rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Question Stem & Diagram */}
            <div className="space-y-3">
              <span className="text-xs font-sans text-[#64748B] uppercase font-bold tracking-wider">
                SUBJECT: {previewQuestion.subject} | TIME: <span className="font-mono">{previewQuestion.timeLimitSeconds}s</span>
              </span>
              <h4 className="text-base font-semibold text-[#0E1B2A] leading-relaxed">
                {previewQuestion.stem}
              </h4>

              {previewQuestion.imageUrl && (
                <div className="p-2 border border-[#D4D9DF] rounded bg-[#F6F8FA]">
                  <img
                    src={previewQuestion.imageUrl}
                    alt="Diagram Preview"
                    className="max-h-48 w-auto object-contain rounded mx-auto"
                  />
                </div>
              )}
            </div>

            {/* 4 Options Grid */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans uppercase text-[#64748B] font-bold tracking-wider">Options (Official Key Highlighted):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {previewQuestion.options.map((opt) => {
                  const isCorrect = opt.id === previewQuestion.correctOptionId;

                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded border flex items-center justify-between text-xs ${
                        isCorrect
                          ? 'bg-[#EDF6F0] border-[#88BE9B] text-[#234E35] font-bold'
                          : 'bg-[#F8FAFC] border-[#E2E6EB] text-[#1F2937]'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-sans font-bold text-[#0E1B2A]">{opt.label}.</span>
                        <span>{opt.text}</span>
                      </div>
                      {isCorrect && (
                        <span className="text-[10px] font-sans uppercase font-bold bg-[#234E35] text-white px-1.5 py-0.5 rounded">
                          CORRECT KEY
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation Rationale */}
            <div className="bg-[#FDF7EC] border border-[#DEC088] p-3.5 rounded text-xs space-y-1">
              <span className="text-[10px] font-sans font-bold text-[#7A5312] uppercase tracking-wider block">
                OFFICIAL REASONING & DERIVATION:
              </span>
              <p className="text-[#1F2937] leading-relaxed">{previewQuestion.explanation}</p>
            </div>

            <div className="flex items-center justify-between border-t border-[#E2E6EB] pt-3 text-xs font-sans text-[#64748B]">
              <span>Author: {previewQuestion.authorName}</span>
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-2 bg-[#0E1B2A] text-white rounded font-bold uppercase tracking-wider"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankPage;
