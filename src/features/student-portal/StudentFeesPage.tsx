import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers';
import { financeService } from '@/services/financeService';

const money = (value: number | null) => value === null ? 'Not recorded' : `Rs ${Number(value).toLocaleString('en-PK')}`;

export default function StudentFeesPage() {
  const { user } = useAuth();
  const fees = useQuery({ queryKey: ['student', 'fees', user?.id], queryFn: () => financeService.getStudentFeeData(), enabled: !!user, refetchInterval: 30000 });
  if (fees.isPending) return <p role="status">Loading fee records...</p>;
  if (fees.isError) return <div role="alert"><p>Could not load fees: {fees.error.message}</p><button className="underline" onClick={() => fees.refetch()}>Try again</button></div>;
  const { totals, accounts, payments } = fees.data;
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">My Fees</h1><button className="border rounded-lg px-4 py-2 print:hidden" onClick={() => window.print()}>Print fee statement</button></div>
    <div className="grid sm:grid-cols-3 gap-4">{[['Total Fee', totals.total_fee], ['Paid Fee', totals.paid_fee], ['Remaining Fee', totals.remaining_fee]].map(([label, value]) => <div className="border rounded-xl bg-white p-5" key={String(label)}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold">{money(value as number | null)}</p></div>)}</div>
    <section className="bg-white border rounded-xl p-6"><h2 className="text-lg font-semibold mb-4">Fee Accounts</h2>{!accounts.length ? <p>No fees recorded.</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{['Fee', 'Period', 'Payable', 'Paid', 'Remaining', 'Status', 'Due date'].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{accounts.map(a => <tr className="border-t" key={a.id}><td className="p-3">{a.fee_type}</td><td>{a.fee_period || 'Registration'}</td><td>{money(a.net_due)}</td><td>{money(a.amount_paid)}</td><td>{money(a.remaining_balance)}</td><td>{a.status}</td><td>{a.due_date || 'Not set'}</td></tr>)}</tbody></table></div>}</section>
    <section className="bg-white border rounded-xl p-6"><h2 className="text-lg font-semibold mb-4">Payment History</h2>{!payments.length ? <p>No payments recorded.</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{['Receipt', 'Fee', 'Paid at', 'Amount', 'Method', 'Status'].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{payments.map(p => <tr className="border-t" key={p.id}><td className="p-3">{p.receipt_number}</td><td>{p.fee_type}</td><td>{new Date(p.payment_date).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</td><td>{money(p.amount)}</td><td>{p.payment_method}</td><td>{p.status}{p.status === 'VOID' && p.void_reason ? `: ${p.void_reason}` : ''}</td></tr>)}</tbody></table></div>}<p className="mt-4 text-xs text-slate-500">Voided payments remain in your history and are excluded from paid totals. Times shown in Asia/Karachi.</p></section>
  </div>;
}
