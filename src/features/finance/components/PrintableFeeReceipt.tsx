import React, { useRef } from 'react';
import { Printer, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { StudentFeeAccount, StudentFeePayment, StudentSearchResult } from '@/types/finance.types';

interface PrintableFeeReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  account: StudentFeeAccount | null;
  payment?: StudentFeePayment | null;
  student?: StudentSearchResult | { id: string; full_name: string; father_name?: string; roll_number: string; phone_number?: string; email?: string } | null;
}

const formatCurrency = (val?: number | null) => {
  return `Rs. ${(val || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const PrintableFeeReceipt: React.FC<PrintableFeeReceiptProps> = ({
  isOpen,
  onClose,
  account,
  payment,
  student,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !account) return null;

  const handlePrint = () => {
    window.print();
  };

  const netDue = (account.amount_due || 0) - (account.discount_amount || 0) + (account.fine_amount || 0);
  const remainingBalance = Math.max(0, netDue - (account.amount_paid || 0));

  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const periodLabel = account.fee_month && account.fee_year
    ? `${monthNames[account.fee_month]} ${account.fee_year}`
    : account.fee_year
    ? `${account.fee_year}`
    : 'Current Session';

  const receiptNumber = payment?.receipt_number || `SFA-ACC-${account.id.slice(0, 8).toUpperCase()}`;
  const receiptDate = payment?.payment_date
    ? new Date(payment.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const renderReceiptHalf = (copyType: 'CADET COPY' | 'ACADEMY RECORD COPY') => (
    <div className="flex-1 p-6 bg-white border border-slate-300 rounded-lg relative overflow-hidden flex flex-col justify-between text-slate-800 text-xs">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none rotate-[-30deg]">
        <span className="text-7xl font-black text-slate-900 tracking-widest uppercase">SHUJA FORCES</span>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-start justify-between border-b border-slate-300 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-full bg-[#0E1B2A] text-amber-400 flex items-center justify-center font-black text-base tracking-wider border-2 border-amber-400/40">
              SFA
            </div>
            <div>
              <h1 className="font-extrabold text-sm uppercase tracking-wider text-[#0E1B2A]">
                SHUJA FORCES ACADEMY
              </h1>
              <p className="text-[10px] text-slate-600 font-semibold tracking-wide">
                PINDSULTANI CAMPUS • TESTING & PREP WING
              </p>
              <p className="text-[9px] text-slate-500">
                Main Campus Pindsultani | Helpline: +92 312 9595950
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300 uppercase tracking-wider">
              {copyType}
            </span>
            <div className="mt-1 font-mono font-bold text-[11px] text-[#0E1B2A]">
              {receiptNumber}
            </div>
            <div className="text-[10px] text-slate-500">{receiptDate}</div>
          </div>
        </div>

        {/* Student & Payment Metadata */}
        <div className="grid grid-cols-2 gap-2 my-3 p-2 bg-slate-50 rounded border border-slate-200">
          <div>
            <span className="text-slate-500 text-[10px] block">Cadet Full Name:</span>
            <span className="font-bold text-slate-900 text-xs">{(student as any)?.display_name || (student as any)?.full_name || 'Cadet Student'}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">Father's Name:</span>
            <span className="font-bold text-slate-900 text-xs">{(student as any)?.father_name || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">Roll Number:</span>
            <span className="font-mono font-bold text-blue-700 text-xs">{student?.roll_number || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">Fee Head & Period:</span>
            <span className="font-bold text-slate-900 text-xs">{account.fee_type} ({periodLabel})</span>
          </div>
        </div>

        {/* Financial Table */}
        <table className="w-full text-[11px] mb-3 border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-slate-600 uppercase text-[9px]">
              <th className="py-1 text-left">Description</th>
              <th className="py-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-1 text-slate-700">Base Tuition / Fee Amount</td>
              <td className="py-1 text-right font-medium">{formatCurrency(account.amount_due)}</td>
            </tr>
            {(account.discount_amount || 0) > 0 && (
              <tr className="text-emerald-700">
                <td className="py-1">Fee Scholarship / Discount</td>
                <td className="py-1 text-right font-medium">- {formatCurrency(account.discount_amount)}</td>
              </tr>
            )}
            {(account.fine_amount || 0) > 0 && (
              <tr className="text-rose-700">
                <td className="py-1">Late Fine / Penalty</td>
                <td className="py-1 text-right font-medium">+ {formatCurrency(account.fine_amount)}</td>
              </tr>
            )}
            <tr className="border-t border-slate-300 font-bold text-slate-900 bg-slate-50/60">
              <td className="py-1.5 px-1">Total Net Payable</td>
              <td className="py-1.5 px-1 text-right">{formatCurrency(netDue)}</td>
            </tr>
            {payment && (
              <tr className="font-bold text-emerald-700 bg-emerald-50/40">
                <td className="py-1.5 px-1">Amount Paid (This Transaction)</td>
                <td className="py-1.5 px-1 text-right">{formatCurrency(payment.amount)}</td>
              </tr>
            )}
            <tr className="font-bold text-slate-800">
              <td className="py-1.5 px-1">Total Paid To Date</td>
              <td className="py-1.5 px-1 text-right">{formatCurrency(account.amount_paid)}</td>
            </tr>
            <tr className={`font-bold ${remainingBalance > 0 ? 'text-amber-700 bg-amber-50/30' : 'text-emerald-700 bg-emerald-50/30'}`}>
              <td className="py-1.5 px-1">Outstanding Balance Remaining</td>
              <td className="py-1.5 px-1 text-right">{formatCurrency(remainingBalance)}</td>
            </tr>
          </tbody>
        </table>

        {/* Transaction Details */}
        <div className="text-[10px] space-y-1 text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
          <div className="flex justify-between">
            <span>Payment Mode:</span>
            <span className="font-semibold uppercase text-slate-800">{payment?.payment_method || 'CASH'}</span>
          </div>
          {payment?.reference_number && (
            <div className="flex justify-between">
              <span>Reference / Txn ID:</span>
              <span className="font-mono text-slate-800">{payment.reference_number}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Fee Account Status:</span>
            <span className={`font-bold ${
              account.status === 'PAID' ? 'text-emerald-700' :
              account.status === 'PARTIAL' ? 'text-amber-700' :
              account.status === 'WAIVED' ? 'text-purple-700' : 'text-rose-700'
            }`}>
              {account.status}
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Signatures */}
      <div className="mt-4 pt-3 border-t border-slate-300">
        <div className="flex justify-between items-end text-[9px] text-slate-500">
          <div className="text-center w-28">
            <div className="h-6 border-b border-slate-400 mb-1"></div>
            <span>Cadet / Depositor</span>
          </div>
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mb-0.5" />
            <span className="font-mono text-[8px] text-slate-400 uppercase">SYSTEM VERIFIED</span>
          </div>
          <div className="text-center w-28">
            <div className="h-6 border-b border-slate-400 mb-1"></div>
            <span>Authorized Cashier</span>
          </div>
        </div>
        <p className="text-[8px] text-slate-400 text-center mt-2">
          This is a computer-generated fee receipt from Shuja Forces Academy Testing Management System.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Print Stylesheet injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-fee-receipt-container,
          #printable-fee-receipt-container * {
            visibility: visible;
          }
          #printable-fee-receipt-container {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 10mm;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Action Header (Hidden during Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Official Fee Receipt</h2>
              <p className="text-xs text-slate-500 font-mono">{receiptNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0E1B2A] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Canvas (Dual copy split view) */}
        <div className="p-6 overflow-y-auto bg-slate-100">
          <div
            id="printable-fee-receipt-container"
            ref={receiptRef}
            className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
          >
            {/* Cadet Copy */}
            {renderReceiptHalf('CADET COPY')}

            {/* Perforated Divider */}
            <div className="hidden md:flex flex-col items-center justify-center px-1 text-slate-300">
              <div className="h-full border-r-2 border-dashed border-slate-300 relative">
                <span className="absolute top-1/2 -left-2.5 -translate-y-1/2 bg-white px-1 text-slate-400 text-xs">✂</span>
              </div>
            </div>

            {/* Academy Copy */}
            {renderReceiptHalf('ACADEMY RECORD COPY')}
          </div>
        </div>
      </div>
    </div>
  );
};
