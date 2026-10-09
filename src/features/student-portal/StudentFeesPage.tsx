import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/providers';
import { financeService } from '@/services/financeService';
import { StudentEmpty, StudentPageHeader, StudentStatus } from '@/components/student/StudentUI';
import { Printer } from 'lucide-react';

const money = (value: number | null) => value === null ? 'Not recorded' : `Rs ${Number(value).toLocaleString('en-PK')}`;

export default function StudentFeesPage() {
  const { user } = useAuth();
  const fees = useQuery({ queryKey: ['student', 'fees', user?.id], queryFn: () => financeService.getStudentFeeData(), enabled: !!user, refetchInterval: 30000 });
  if (fees.isPending) return <p role="status" className="student-loading">Loading fee records...</p>;
  if (fees.isError) return <div role="alert" className="student-error"><p>Could not load fees: {fees.error.message}</p><button className="student-button student-button-secondary" onClick={() => fees.refetch()}>Try again</button></div>;
  const { totals, accounts, payments } = fees.data;
  return <div className="student-page student-fees">
    <StudentPageHeader title="My Fees" actions={<button className="student-button student-button-secondary print:hidden" onClick={() => window.print()}><Printer size={16} aria-hidden="true" />Print fee statement</button>} />
    <div className="student-metrics">{[['Total Fee', totals.total_fee], ['Paid Fee', totals.paid_fee], ['Remaining Fee', totals.remaining_fee]].map(([label, value]) => <div className="student-metric" key={String(label)}><p className="student-caption">{label}</p><p className="student-metric-value">{money(value as number | null)}</p></div>)}</div>
    <section className="student-panel student-fee-panel"><h2 className="student-fee-heading">Fee Accounts</h2>{!accounts.length ? <StudentEmpty>No fees recorded.</StudentEmpty> : <div className="student-table-scroll"><table className="student-table"><thead><tr>{['Fee', 'Period', 'Payable', 'Paid', 'Remaining', 'Status', 'Due date'].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{accounts.map(a => <tr className="border-t" key={a.id}><td className="p-3">{a.fee_type}</td><td>{a.fee_period || 'Registration'}</td><td>{money(a.net_due)}</td><td>{money(a.amount_paid)}</td><td>{money(a.remaining_balance)}</td><td><StudentStatus value={a.status} /></td><td>{a.due_date || 'Not set'}</td></tr>)}</tbody></table></div>}</section>
    <section className="student-panel student-fee-panel"><h2 className="student-fee-heading">Payment History</h2>{!payments.length ? <StudentEmpty>No payments recorded.</StudentEmpty> : <div className="student-table-scroll"><table className="student-table"><thead><tr>{['Receipt', 'Fee', 'Paid at', 'Amount', 'Method', 'Status'].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{payments.map(p => <tr className="border-t" key={p.id}><td className="p-3">{p.receipt_number}</td><td>{p.fee_type}</td><td>{new Date(p.payment_date).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}</td><td>{money(p.amount)}</td><td>{p.payment_method}</td><td><StudentStatus value={p.status} />{p.status === 'VOID' && p.void_reason ? `: ${p.void_reason}` : ''}</td></tr>)}</tbody></table></div>}<p className="mt-4 text-xs text-slate-500">Voided payments remain in your history and are excluded from paid totals. Times shown in Asia/Karachi.</p></section>
  </div>;
}
