import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers';
import { academyDate, attendanceService, attendanceTime, statusLabel } from '@/services/attendanceService';
import { useAttendanceUpdates } from './useAttendanceUpdates';
export function StudentAttendanceCard({ history = false }: { history?: boolean }) {
 const { user } = useAuth(); const [month, setMonth] = useState(academyDate().slice(0, 7));
 useAttendanceUpdates();
 const q = useQuery({ queryKey: ['attendance', 'student', user?.id, history ? month : 'current'], queryFn: () => attendanceService.student(history ? month : undefined), enabled: !!user, staleTime: 0, refetchInterval: 15000, refetchOnWindowFocus: true, refetchOnReconnect: true });
 return <section className="student-panel"><div className="student-panel-body space-y-4">
  <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">{history ? 'Attendance History' : 'Attendance'}</h2>{history ? <label className="text-sm">Month<input aria-label="Attendance month" className="student-filter ml-2" type="month" max={academyDate().slice(0, 7)} value={month} onChange={e => { if (e.target.value) setMonth(e.target.value); }} /></label> : <Link className="student-button student-button-secondary" to="/student/attendance">View Attendance</Link>}</div>
  {q.isPending ? <p aria-live="polite">Loading attendance…</p> : q.isError ? <div role="alert"><p>{q.error.message}</p><button className="student-button student-button-secondary" onClick={() => q.refetch()}>Retry</button></div> : q.data && <>
   <p className="student-standing">Today: <strong>{statusLabel(q.data.today_status)}</strong> <span className="text-sm">({q.data.today})</span></p>
   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['Finalized attendance', q.data.totals.percentage === null ? 'No finalized attendance percentage yet' : `${q.data.totals.percentage}%`], ['Present days', q.data.totals.present], ['Absent days', q.data.totals.absent], ['Excused days', q.data.totals.excused]].map(([label, value]) => <div className="rounded-xl border p-3" key={label}><p className="text-sm text-slate-500">{label}</p><p className="text-lg font-bold">{value}</p></div>)}</div>
   <p className="student-caption">Monthly totals use finalized class days. Excused and unmarked days are excluded.</p>
   {history && <div className="student-table-scroll"><table className="student-table"><thead><tr><th>Date</th><th>Status</th><th>Register</th><th>Arrival (Pakistan time)</th></tr></thead><tbody>{q.data.days.map(d => <tr key={d.date}><td>{d.date}</td><td>{statusLabel(d.status)}</td><td>{d.state ? statusLabel(d.state) : 'No register recorded'}</td><td>{attendanceTime(d.arrival_at)}</td></tr>)}</tbody></table>{!q.data.days.length && <p>No attendance dates in this month.</p>}</div>}
  </>}
 </div></section>;
}
export default function StudentAttendancePage() { return <div className="student-page"><h1 className="text-3xl font-bold">My Attendance</h1><StudentAttendanceCard history /></div>; }
