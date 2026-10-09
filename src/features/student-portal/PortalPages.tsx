import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { PortalResult, PortalTest, studentPortalService } from '@/services/studentPortalService';
const percent = (n: number | null) => n === null ? 'No results yet' : `${Number(n).toFixed(2)}%`;
const rank = (n: number | null) => n === null ? 'Not ranked' : `#${n}`;
const money = (n: number | null) => n === null ? 'Not recorded' : `Rs ${Number(n).toLocaleString('en-PK')}`;
function Panel({ title, children }: {
    title: string;
    children: React.ReactNode;
}) { return <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"><h2 className="text-lg font-semibold">{title}</h2>{children}</section>; }
function Metrics({ items }: {
    items: [
        string,
        React.ReactNode
    ][];
}) { return <div className="grid sm:grid-cols-3 gap-4">{items.map(([label, value]) => <div key={label} className="bg-white border rounded-xl p-5"><p className="text-sm text-slate-500">{label}</p><p className="text-xl font-semibold mt-2">{value}</p></div>)}</div>; }
function State({ loading, error, retry }: {
    loading: boolean;
    error: Error | null;
    retry: () => void;
}) { return loading ? <p role="status">Loading saved records…</p> : error ? <div role="alert" className="bg-red-50 p-5 rounded"><p>Could not load records: {error.message}</p><button className="underline" onClick={retry}>Try again</button></div> : null; }
function History({ results, timezone }: {
    results: PortalResult[];
    timezone: string;
}) { return !results.length ? <p>No results yet.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Test', 'Completed at', 'Marks obtained', 'Total marks', 'Percentage', 'Details'].map(x => <th key={x} className="py-3 pr-4">{x}</th>)}</tr></thead><tbody>{results.map(r => <tr className="border-t" key={r.attempt_id}><td className="py-3 pr-4">{r.test_name}</td><td className="pr-4">{new Date(r.completed_at).toLocaleString('en-PK', { timeZone: timezone })}</td><td>{r.marks_obtained}</td><td>{r.max_marks}</td><td>{percent(r.percentage)}</td><td><Link className="underline" to={`/student/result/${r.attempt_id}`}>Review result</Link></td></tr>)}</tbody></table><p className="text-xs text-slate-500 mt-3">Times shown in {timezone}.</p></div>; }
function Assignments({ tests }: {
    tests: PortalTest[];
}) { return !tests.length ? <p>No eligible pending assignments.</p> : <div className="grid sm:grid-cols-2 gap-4">{tests.map(t => <article key={t.id} className="border rounded-lg p-4 space-y-3"><h3 className="font-semibold">{t.name}</h3>{t.is_retake && <p>Authorized retake</p>}<p className="text-sm text-slate-500">{t.question_count} questions · {t.duration_minutes} minutes · Pass: {t.passing_threshold}%</p><Link className="inline-block bg-slate-900 text-white rounded-lg px-4 py-2" to={`/student/test/${t.id}/familiarization`}>Open examination</Link></article>)}</div>; }
export function PortalPage({ page }: {
    page: 'dashboard' | 'profile' | 'results' | 'tests';
}) {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const q = useQuery({ queryKey: ['student', 'portal', user?.id], queryFn: studentPortalService.snapshot, enabled: !!user, staleTime: 0, refetchInterval: 30000 });
    if (!q.data || q.isError)
        return <State loading={q.isPending} error={q.error} retry={() => q.refetch()}/>;
    const d = q.data, p = d.profile, s = d.statistics;
    if (page === 'tests')
        return <Panel title={`Assigned Tests (${d.assigned_tests.length})`}><input aria-label="Search assigned tests" className="border rounded p-3 w-full" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assigned tests"/><Assignments tests={d.assigned_tests.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))}/></Panel>;
    if (page === 'results')
        return <Panel title="My Results"><History results={d.results} timezone={d.timezone}/></Panel>;
    if (page === 'profile')
        return <div className="space-y-6"><Panel title={p.name}><p>{p.roll_number}</p><p>{p.force_name || 'Not provided'}</p></Panel><Panel title="Personal Information"><dl className="grid sm:grid-cols-2 gap-4">{([['Email', p.email], ['Phone', p.phone], ['Roll number', p.roll_number], ["Father’s name", p.father_name], ['CNIC / B-Form', p.cnic], ['Assigned role', p.role], ['Target force', p.force_name]] as const).map(([label, value]) => <div key={label}><dt className="text-sm text-slate-500">{label}</dt><dd>{value || 'Not provided'}</dd></div>)}</dl></Panel>{/* System Reference Identifiers: hidden; internal IDs remain in the backend. */}<Panel title="Performance Overview"><Metrics items={[["Completed Tests", s.completed_tests], ["Average Score", percent(s.average_percentage)], ["Aggregate Score", percent(s.aggregate_percentage)]]}/></Panel><Panel title="Current Standing"><p>{p.course_name || 'Course not recorded'}: {rank(d.course_position)}</p></Panel></div>;
    return <div className="space-y-6"><h1 className="text-2xl font-bold">Welcome, {p.name}</h1><Metrics items={[["Assigned Tests", d.assigned_tests.length], ["Completed Tests", s.completed_tests], ["Average Score", percent(s.average_percentage)], ["Academy Standing", rank(d.academy_position)]]}/><Panel title="Your Standings"><p>{p.course_name || 'Course not recorded'}: {rank(d.course_position)}</p><Link className="underline" to="/student/leaderboard">View Leaderboard</Link></Panel><Panel title="Fees"><Link className="underline" to="/student/fees">View fee accounts and payment history</Link><Metrics items={[["Total Fee", money(d.fees.total_fee)], ["Paid Fee", d.fees.total_fee === null ? 'Not recorded' : money(d.fees.paid_fee)], ["Remaining Fee", money(d.fees.remaining_fee)]]}/></Panel><Panel title="Assigned Tests"><Assignments tests={d.assigned_tests}/></Panel><Panel title="Recent Examination History"><History results={d.results.slice(0, 10)} timezone={d.timezone}/></Panel></div>;
}
export function PortalLeaderboard() {
    const { user } = useAuth();
    const [mode, setMode] = useState('course');
    const [test, setTest] = useState('');
    const [offset, setOffset] = useState(0);
    const tests = useQuery({ queryKey: ['student', 'portal-tests', user?.id], queryFn: studentPortalService.tests, enabled: !!user });
    const board = useQuery({ queryKey: ['student', 'portal-board', user?.id, mode, test, offset], queryFn: () => studentPortalService.leaderboard(mode === 'test' ? test : null, offset), enabled: !!user && (mode === 'course' || !!test), staleTime: 0 });
    return <Panel title="Course Leaderboard"><label>Ranking mode <select className="border rounded p-2 ml-3" value={mode} onChange={e => { setMode(e.target.value); setOffset(0); }}><option value="course">My Course Positions</option><option value="test">Test-wise Leaderboard</option></select></label>{mode === 'test' && <div><State loading={tests.isPending} error={tests.error} retry={() => tests.refetch()}/>{tests.data && <label>Select test <select className="border p-2 rounded ml-3" value={test} onChange={e => { setTest(e.target.value); setOffset(0); }}><option value="">Select a relevant test</option>{tests.data.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>{!tests.data.length && <p>No eligible tests.</p>}</label>}</div>}{(mode === 'course' || !!test) && <><State loading={board.isPending} error={board.error} retry={() => board.refetch()}/>{board.data && !board.isError && <><p>Your course position: {rank(board.data.current_position)}</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Course position', 'Student name', 'Roll number', mode === 'course' ? 'Aggregate percentage' : 'Test percentage'].map(x => <th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{board.data.rows.map(r => <tr key={r.roll_number} className={r.is_current_user ? 'bg-amber-50 font-semibold' : 'border-t'}><td className="p-3">{rank(r.position)}</td><td>{r.student_name}{r.is_current_user ? ' (You)' : ''}</td><td>{r.roll_number}</td><td>{percent(r.percentage)}</td></tr>)}</tbody></table>{!board.data.rows.length && <p>No course students found.</p>}</div><div className="flex gap-4"><button disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 100))}>Previous</button><span>{board.data.total ? offset + 1 : 0}–{Math.min(offset + 100, board.data.total)} of {board.data.total}</span><button disabled={offset + 100 >= board.data.total} onClick={() => setOffset(offset + 100)}>Next</button></div></>}</>}</Panel>;
}
