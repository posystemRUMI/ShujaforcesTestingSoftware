import React from 'react';
import { Award, BookOpen, CheckCircle2, CircleDollarSign, Clock3, ShieldCheck, Trophy } from 'lucide-react';

export function StudentPageHeader({ title, actions }: { title: React.ReactNode; actions?: React.ReactNode }) {
  return <div className="student-page-heading"><h1>{title}</h1>{actions && <div className="student-heading-actions">{actions}</div>}</div>;
}
export function StudentPanel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`student-panel ${className}`}><div className="student-panel-heading"><h2>{title}</h2></div><div className="student-panel-body">{children}</div></section>;
}
export function StudentMetrics({ items }: { items: [string, React.ReactNode][] }) {
  const icons = [BookOpen, CheckCircle2, Award, Trophy];
  return <div className="student-metrics">{items.map(([label, value], i) => {
    const Icon = /Fee/.test(label) ? CircleDollarSign : icons[i % icons.length];
    return <div key={label} className="student-metric"><div className="student-metric-top"><p>{label}</p><Icon size={19} aria-hidden="true" /></div><p className="student-metric-value">{value}</p></div>;
  })}</div>;
}
export function StudentState({ loading, error, retry }: { loading: boolean; error: Error | null; retry: () => void }) {
  if (loading) return <div role="status" className="student-loading"><Clock3 aria-hidden="true" size={24} /><p>Loading saved records…</p><div className="student-skeleton-grid" aria-hidden="true">{[0, 1, 2].map(i => <div key={i} />)}</div></div>;
  if (error) return <div role="alert" className="student-error"><p>Could not load records: {error.message}</p><button className="student-button student-button-secondary" onClick={retry}>Try again</button></div>;
  return null;
}
export function StudentEmpty({ children }: { children: React.ReactNode }) {
  return <div className="student-empty"><ShieldCheck size={25} aria-hidden="true" /><p>{children}</p></div>;
}
export function StudentStatus({ value }: { value: string }) {
  const tone = /PAID|COMPLETE|ACTIVE|PASS/.test(value) && !/UNPAID/.test(value) ? 'success' : /PARTIAL|UNPAID|PENDING/.test(value) ? 'warning' : /VOID|FAIL/.test(value) ? 'error' : 'neutral';
  return <span className={`student-status student-status-${tone}`}>{value}</span>;
}
