import { useState } from 'react';
import { StudentAttendanceCard } from '@/features/attendance/StudentAttendance';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3, ListChecks, ShieldCheck, Target } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { PortalResult, PortalTest, studentPortalService } from '@/services/studentPortalService';
import { StudentPanel as Panel, StudentMetrics as Metrics, StudentState as State, StudentPageHeader, StudentEmpty } from '@/components/student/StudentUI';
const percent = (n: number | null) => n === null ? 'No results yet' : `${Number(n).toFixed(2)}%`;
const rank = (n: number | null) => n === null ? 'Not ranked' : `#${n}`;
const money = (n: number | null) => n === null ? 'Not recorded' : `Rs ${Number(n).toLocaleString('en-PK')}`;

function History({ results, timezone }: { results: PortalResult[]; timezone: string }) {
  return !results.length ? <StudentEmpty>No results yet.</StudentEmpty> : <>
    <div className="student-table-scroll"><table className="student-table"><thead><tr>{['Test', 'Completed at', 'Marks obtained', 'Total marks', 'Percentage', 'Details'].map(x => <th key={x}>{x}</th>)}</tr></thead>
      <tbody>{results.map(r => <tr key={r.attempt_id}><td>{r.test_name}</td><td>{new Date(r.completed_at).toLocaleString('en-PK', { timeZone: timezone })}</td><td>{r.marks_obtained}</td><td>{r.max_marks}</td><td>{percent(r.percentage)}</td><td><Link className="student-button student-button-secondary" to={`/student/result/${r.attempt_id}`}>Review result<ArrowUpRight size={14} aria-hidden="true" /></Link></td></tr>)}</tbody></table></div>
    <p className="student-caption">Times shown in {timezone}.</p>
  </>;
}
function Assignments({ tests }: { tests: PortalTest[] }) {
  return !tests.length ? <StudentEmpty>No eligible pending assignments.</StudentEmpty> : <div className="student-test-grid">{tests.map(t => <article key={t.id} className="student-test-card">
    <h3>{t.name}</h3>{t.is_retake && <p className="student-status student-status-warning">Authorized retake</p>}
    <p className="student-test-meta"><span><ListChecks aria-hidden="true" />{t.question_count} questions</span><span><Clock3 aria-hidden="true" />{t.duration_minutes} minutes</span><span><Target aria-hidden="true" />Pass: {t.passing_threshold}%</span></p>
    <Link className="student-button" to={`/student/test/${t.id}/familiarization`}>Open examination<ArrowUpRight size={15} aria-hidden="true" /></Link>
  </article>)}</div>;
}
export function PortalPage({ page }: { page: 'dashboard' | 'profile' | 'results' | 'tests' }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const q = useQuery({ queryKey: ['student', 'portal', user?.id], queryFn: studentPortalService.snapshot, enabled: !!user, staleTime: 0, refetchInterval: 30000 });
  if (!q.data || q.isError) return <State loading={q.isPending} error={q.error} retry={() => q.refetch()} />;
  const d = q.data, p = d.profile, s = d.statistics;
  if (page === 'tests') return <div className="student-page"><StudentPageHeader title={`Assigned Tests (${d.assigned_tests.length})`} /><section className="student-panel"><div className="student-panel-body">
    <input aria-label="Search assigned tests" className="student-filter" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assigned tests" />
    <Assignments tests={d.assigned_tests.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))} />
  </div></section></div>;
  if (page === 'results') return <div className="student-page"><StudentPageHeader title="My Results" /><Panel title="Examination History"><History results={d.results} timezone={d.timezone} /></Panel></div>;
  if (page === 'profile') return <div className="student-page">
    <StudentPageHeader title="My Profile" />
    <div className="student-welcome"><div><h2 className="text-2xl font-bold">{p.name}</h2><div className="student-welcome-identity"><span>{p.roll_number}</span><p>{p.force_name || 'Not provided'}</p></div></div><ShieldCheck className="student-welcome-mark" aria-hidden="true" /></div>
    <Panel title="Personal Information"><dl className="student-profile-details">{([['Email', p.email], ['Phone', p.phone], ['Roll number', p.roll_number], ["Father’s name", p.father_name], ['CNIC / B-Form', p.cnic], ['Assigned role', p.role], ['Target force', p.force_name]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd></div>)}</dl></Panel>
    <Panel title="Performance Overview"><Metrics items={[["Completed Tests", s.completed_tests], ["Average Score", percent(s.average_percentage)], ["Aggregate Score", percent(s.aggregate_percentage)]]} /></Panel>
    <Panel title="Current Standing"><p className="student-standing">{p.course_name || 'Course not recorded'}: {rank(d.course_position)}</p></Panel>
  </div>;
  return <div className="student-page">
    <div className="student-welcome"><div><h1>Welcome, {p.name}</h1><div className="student-welcome-identity"><span>{p.roll_number}</span></div></div><ShieldCheck className="student-welcome-mark" aria-hidden="true" /></div>
    <Metrics items={[["Assigned Tests", d.assigned_tests.length], ["Completed Tests", s.completed_tests], ["Average Score", percent(s.average_percentage)], ["Academy Standing", rank(d.academy_position)]]} />
    <div className="student-dashboard-secondary">
      <Panel title="Your Standings"><p className="student-standing">{p.course_name || 'Course not recorded'}: {rank(d.course_position)}</p><Link className="student-button student-button-secondary" to="/student/leaderboard">View Leaderboard<ArrowUpRight size={15} aria-hidden="true" /></Link></Panel>
      <Panel title="Fees"><Metrics items={[["Total Fee", money(d.fees.total_fee)], ["Paid Fee", d.fees.total_fee === null ? 'Not recorded' : money(d.fees.paid_fee)], ["Remaining Fee", money(d.fees.remaining_fee)]]} /><Link className="student-link" to="/student/fees">View fee accounts and payment history</Link></Panel>
    </div>
    <StudentAttendanceCard />
    <Panel title="Assigned Tests"><Assignments tests={d.assigned_tests} /></Panel>
    <Panel title="Recent Examination History"><History results={d.results.slice(0, 10)} timezone={d.timezone} /></Panel>
  </div>;
}
export function PortalLeaderboard() {
  const { user } = useAuth();
  const [mode, setMode] = useState('course');
  const [test, setTest] = useState('');
  const [offset, setOffset] = useState(0);
  const tests = useQuery({ queryKey: ['student', 'portal-tests', user?.id], queryFn: studentPortalService.tests, enabled: !!user });
  const board = useQuery({ queryKey: ['student', 'portal-board', user?.id, mode, test, offset], queryFn: () => studentPortalService.leaderboard(mode === 'test' ? test : null, offset), enabled: !!user && (mode === 'course' || !!test), staleTime: 0 });
  return <div className="student-page"><StudentPageHeader title="Course Leaderboard" /><section className="student-panel"><div className="student-panel-body">
    <div className="student-filter-bar"><label>Ranking mode<select className="student-filter" value={mode} onChange={e => { setMode(e.target.value); setOffset(0); }}><option value="course">My Course Positions</option><option value="test">Test-wise Leaderboard</option></select></label>
      {mode === 'test' && <div><State loading={tests.isPending} error={tests.error} retry={() => tests.refetch()} />{tests.data && <label>Select test<select className="student-filter" value={test} onChange={e => { setTest(e.target.value); setOffset(0); }}><option value="">Select a relevant test</option>{tests.data.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>{!tests.data.length && <p>No eligible tests.</p>}</label>}</div>}
    </div>
    {(mode === 'course' || !!test) && <><State loading={board.isPending} error={board.error} retry={() => board.refetch()} />{board.data && !board.isError && <>
      <p className="student-standing">Your course position: {rank(board.data.current_position)}</p>
      <div className="student-table-scroll"><table className="student-table"><thead><tr>{['Course position', 'Student name', 'Roll number', mode === 'course' ? 'Aggregate percentage' : 'Test percentage'].map(x => <th key={x}>{x}</th>)}</tr></thead>
        <tbody>{board.data.rows.map(r => <tr key={r.roll_number} data-rank={r.position} className={r.is_current_user ? 'student-current-row font-semibold' : ''}><td>{rank(r.position)}</td><td>{r.student_name}{r.is_current_user ? ' (You)' : ''}</td><td>{r.roll_number}</td><td>{percent(r.percentage)}</td></tr>)}</tbody></table>{!board.data.rows.length && <StudentEmpty>No course students found.</StudentEmpty>}</div>
      <div className="student-pagination"><button className="student-button student-button-secondary" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 100))}>Previous</button><span>{board.data.total ? offset + 1 : 0}–{Math.min(offset + 100, board.data.total)} of {board.data.total}</span><button className="student-button student-button-secondary" disabled={offset + 100 >= board.data.total} onClick={() => setOffset(offset + 100)}>Next</button></div>
    </>}</>}
  </div></section></div>;
}
