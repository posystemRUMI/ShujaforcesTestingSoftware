import React, { useCallback, useEffect, useState } from 'react';
import { financeService } from '@/services/financeService';
import type { TeacherSalaryPayment } from '@/types/finance.types';

const money = (n: number) => `PKR ${Number(n).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const TeacherSalaryPanel: React.FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [payments, setPayments] = useState<TeacherSalaryPayment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try { setError(''); setPayments(await financeService.getMyTeacherSalaries(year)); }
    catch (err: any) { setError(err.message || 'Failed to load salary records'); }
    finally { setLoading(false); }
  }, [year]);
  useEffect(() => {
    setLoading(true); void load();
    const focus = () => { void load(); };window.addEventListener('focus', focus);
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 30000);
    return () => { window.removeEventListener('focus', focus); window.clearInterval(timer); };
  }, [load, refreshKey]);
  const paid = payments.filter(p => p.status === 'ACTIVE');
  return <section className="staff-salary-panel bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-bold text-lg">My Salary</h2>
      <select aria-label="Salary history year" value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded px-3 py-2 text-sm">
        {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + 1 - i).map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
    {loading ? <p className="text-sm">Loading salary records…</p> : error ? <p role="alert" className="text-red-700 text-sm">{error}</p> : <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div><span className="text-slate-500">Paid this year</span><p className="font-bold">{money(paid.reduce((n, p) => n + Number(p.net_paid), 0))}</p></div>
        <div><span className="text-slate-500">Payments</span><p className="font-bold">{paid.length}</p></div>
        <div><span className="text-slate-500">Latest payment</span><p className="font-bold">{paid[0] ? `${paid[0].salary_month}/${paid[0].salary_year}` : 'No payments'}</p></div>
      </div>
      {!payments.length ? <p className="text-sm text-slate-500">No salary payments for {year}.</p> : <div className="overflow-x-auto">
        <table className="w-full text-sm text-left"><thead><tr className="border-b">
          {['Month', 'Base Salary', 'Bonus', 'Deduction', 'Net Paid', 'Payment Date', 'Type', 'Status', 'Notes'].map(h => <th className="p-2 whitespace-nowrap" key={h}>{h}</th>)}
        </tr></thead><tbody>{payments.map(p => <tr key={p.id} className="border-b">
          <td className="p-2">{p.salary_month}/{p.salary_year}</td><td className="p-2 whitespace-nowrap">{money(p.base_salary)}</td>
          <td className="p-2 whitespace-nowrap">{money(p.bonus)}</td><td className="p-2 whitespace-nowrap">{money(p.deduction)}</td>
          <td className="p-2 font-semibold whitespace-nowrap">{money(p.net_paid)}</td><td className="p-2 whitespace-nowrap">{p.payment_date}</td>
          <td className="p-2">{p.payment_type}</td><td className="p-2">{p.status === 'ACTIVE' ? 'Paid' : 'Voided'}</td><td className="p-2 min-w-32">{p.notes || '—'}</td>
        </tr>)}</tbody></table>
      </div>}
    </>}
  </section>;
};
