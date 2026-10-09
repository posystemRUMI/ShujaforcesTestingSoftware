import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, X, Plus, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { questionService, BankCatalog, BankFilters } from '@/services/questionService';
import { Question } from '@/types';
import { AnswerExplanation } from '@/features/exam-engine/components/AnswerExplanation';
import { QuestionStatement } from '@/components/ui/QuestionStatement';

export function QuestionBankPage() {
  const [catalog, setCatalog] = useState<BankCatalog | null>(null);
  const [taxonomy, setTaxonomy] = useState<Awaited<ReturnType<typeof questionService.getTaxonomy>>>({ forces: [], courses: [], subjects: [] });
  const [filters, setFilters] = useState<BankFilters>({ page: 1, pageSize: 50 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Question | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { questionService.getTaxonomy().then(setTaxonomy).catch(e => setError(e.message)); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setFilters(f => ({ ...f, search, page: 1 })), 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(''); setSelected(new Set());
    questionService.getCatalog(filters).then(data => { if (!cancelled) setCatalog(data); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters, refresh]);
  const change = (value: Partial<BankFilters>) => setFilters(f => ({ ...f, ...value, page: 1 }));
  const courses = taxonomy.courses.filter(c => !filters.forceId || c.force_id === filters.forceId);
  const questions = catalog?.questions || [];
  const pages = Math.max(1, Math.ceil((catalog?.total || 0) / 50));
  const toggle = (id: string) => setSelected(s => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next; });
  async function archive() {
    try { await questionService.archiveQuestions([...selected]); setRefresh(n => n + 1); toast.success('Questions made inactive.'); }
    catch (e: any) { toast.error(e.message); }
  }
  const selectClass = 'border rounded px-3 py-2 text-xs bg-white min-w-0';
  return <div className="staff-page staff-question-bank space-y-4">
    <div className="flex flex-wrap justify-between items-center gap-3 bg-white border rounded-md p-4">
      <h1 className="text-xl font-bold text-[#0E1B2A]">Question Bank Repository</h1>
      <Link to="/admin/authoring" className="flex items-center gap-2 bg-[#0E1B2A] text-white text-xs rounded px-3 py-2"><Plus size={16} />Question Authoring Studio</Link>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-busy={loading}>
      {[
        ['Total unique questions', catalog?.total], ['Verbal Intelligence', catalog?.verbal],
        ['Non-Verbal Intelligence', catalog?.non_verbal], ['Academic', catalog?.academic],
      ].map(([title, count]) => <div key={title} className="bg-white border rounded-md p-3"><h2 className="text-xs text-[#64748B]">{title}</h2><div className="text-xl font-bold" data-count={title}>{loading ? '…' : count ?? '—'}</div></div>)}
    </div>
    <div className="bg-white border rounded-md p-3 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
        <input aria-label="Search questions" placeholder="Search statement or code" value={search} onChange={e => setSearch(e.target.value)} className={selectClass} />
        <select aria-label="Force" className={selectClass} value={filters.forceId || ''} onChange={e => change({ forceId: e.target.value || undefined, courseId: undefined })}>
          <option value="">All Forces</option>{taxonomy.forces.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select aria-label="Course" className={selectClass} value={filters.courseId || ''} onChange={e => change({ courseId: e.target.value || undefined })}>
          <option value="">All Courses</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
        <select aria-label="Bank" className={selectClass} value={filters.bank || ''} onChange={e => change({ bank: e.target.value || undefined, subjectId: undefined })}>
          <option value="">All Banks</option><option value="v">Verbal Intelligence</option><option value="nv">Non-Verbal Intelligence</option><option value="ACADEMIC">Academic</option>
        </select>
        <select aria-label="Status" className={selectClass} value={filters.status || 'ALL'} onChange={e => change({ status: e.target.value })}>
          <option value="ALL">All Statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-3 items-center text-xs">
        <span data-testid="active-count">Active: {loading ? '…' : catalog?.active ?? '—'}</span><span data-testid="inactive-count">Inactive: {loading ? '…' : catalog?.inactive ?? '—'}</span>
        {filters.bank === 'ACADEMIC' && <select aria-label="Academic subject" className={selectClass} value={filters.subjectId || ''} onChange={e => change({ subjectId: e.target.value || undefined })}><option value="">All Academic Subjects</option>{taxonomy.subjects.filter(s => s.category === 'ACADEMIC').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
        {!!selected.size && <button className="text-red-800 border rounded px-2 py-1" onClick={archive}>Make inactive ({selected.size})</button>}
      </div>
    </div>
    {!!catalog?.academic_courses.length && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2" aria-label="Academic counts by course">
      {catalog.academic_courses.map(c => <div key={c.id} className="bg-white border rounded p-3 text-xs"><h2 className="font-semibold">{c.name} ({c.code})</h2><div className="mt-1">Academic: {c.total} · Active: {c.active} · Inactive: {c.inactive}</div></div>)}
    </div>}
    {!!catalog?.subjects.length && <div className="flex flex-wrap gap-2 text-xs" aria-label="Academic subject counts">{catalog.subjects.map(s => <span key={s.id} className="bg-white border rounded px-2 py-1">{s.name}: {s.total}</span>)}</div>}
    {error && <div role="alert" className="text-red-800 bg-white border p-3">Could not load questions: {error}</div>}
    <div className="bg-white border rounded-md overflow-hidden">
      {loading ? <div role="status" className="p-6 text-center text-sm">Loading question repository…</div> : !questions.length ? <div className="p-6 text-center text-sm">No questions match your filters.</div> : <div className="overflow-x-auto"><table className="w-full text-xs text-left min-w-[620px]">
        <thead className="bg-[#F6F8FA]"><tr><th className="p-3"><input aria-label="Select page" type="checkbox" checked={questions.every(q => selected.has(q.id))} onChange={() => setSelected(selected.size ? new Set() : new Set(questions.map(q => q.id)))} /></th><th className="p-3">Code / Bank</th><th className="p-3">Question</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
        <tbody>{questions.map(q => <tr key={q.id} className="border-t"><td className="p-3"><input aria-label={`Select ${q.code}`} type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} /></td><td className="p-3"><strong>{q.code}</strong><div className="text-[#64748B]">{q.subjectName}</div></td><td className="p-3 max-w-md"><QuestionStatement stem={q.stem} sourceLabel={q.sourceLabel} /></td><td className="p-3">{q.status === 'APPROVED' ? 'Active' : 'Inactive'}</td><td className="p-3"><div className="flex gap-2"><button title="Preview Candidate View" onClick={() => setPreview(q)}><Eye size={16} /></button><Link to={`/admin/authoring?id=${q.id}`} title="Edit Question Studio"><Edit3 size={16} /></Link></div></td></tr>)}</tbody>
      </table></div>}
      <div className="flex flex-wrap justify-between gap-2 p-3 border-t text-xs"><span>Page {filters.page || 1} of {pages} · {catalog?.total ?? 0} matching questions</span><div className="flex gap-3"><button disabled={loading || (filters.page || 1) <= 1} onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) - 1 }))}>Previous</button><button disabled={loading || (filters.page || 1) >= pages} onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) + 1 }))}>Next</button></div></div>
    </div>
    {preview && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3"><div role="dialog" aria-label="Question preview" className="bg-white rounded-md p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4"><div className="flex justify-between items-center"><h2 className="font-bold">{preview.code}</h2><button aria-label="Close Preview" onClick={() => setPreview(null)}><X size={18} /></button></div><p className="font-semibold"><QuestionStatement stem={preview.stem} sourceLabel={preview.sourceLabel} /></p>{preview.imageUrl && <img src={preview.imageUrl} alt="Question diagram" className="max-h-64 object-contain" />}<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{preview.options.map(o => <div key={o.id} className={`border rounded p-3 text-sm ${o.id === preview.correctOptionId ? 'bg-green-50 border-green-600' : ''}`}>{o.label}. {o.text}{o.imageUrl && <img src={o.imageUrl} alt={`Option ${o.label}`} className="max-h-32 object-contain" />}</div>)}</div><AnswerExplanation correctAnswers={preview.options.filter(o => o.id === preview.correctOptionId)} explanation={preview.explanation} /></div></div>}
  </div>;
}

export default QuestionBankPage;
