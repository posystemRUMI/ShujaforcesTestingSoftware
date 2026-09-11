export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'ONLINE' | 'CHEQUE' | 'OTHER';

export type FeeStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'WAIVED';

export type PaymentStatus = 'ACTIVE' | 'VOID';

export type SalaryPaymentType = 'REGULAR' | 'BONUS' | 'ADJUSTMENT';

export interface FeeType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StudentFeeAccount {
  id: string;
  student_id: string;
  course_id: string | null;
  batch_id: string | null;
  fee_period: string | null;
  fee_month: number | null;
  fee_year: number;
  fee_type: string;
  amount_due: number;
  discount_amount: number;
  fine_amount: number;
  amount_paid: number;
  status: FeeStatus;
  due_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined presentation fields
  student_name?: string;
  roll_number?: string;
  course_name?: string;
  batch_name?: string;
  fee_type_name?: string;
  remaining_balance?: number;
}

export interface StudentFeePayment {
  id: string;
  student_id: string;
  fee_account_id: string | null;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  payment_date: string;
  received_by: string;
  notes: string | null;
  receipt_number: string;
  status: PaymentStatus;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  created_at: string;
  // Joined presentation fields
  student_name?: string;
  roll_number?: string;
  course_name?: string;
  batch_name?: string;
  fee_type?: string;
  received_by_name?: string;
}

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface FinanceExpense {
  id: string;
  expense_category_id: string | null;
  category_code: string;
  title: string;
  description: string | null;
  amount: number;
  expense_date: string;
  payment_method: PaymentMethod;
  reference_number: string | null;
  payee_name: string | null;
  teacher_id: string | null;
  receipt_url: string | null;
  is_recurring: boolean;
  recurring_period: string | null;
  status: PaymentStatus;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  recorded_by: string;
  created_at: string;
  updated_at: string;
  // Joined presentation fields
  category_name?: string;
  teacher_name?: string;
  recorded_by_name?: string;
}

export interface TeacherSalaryPayment {
  id: string;
  teacher_profile_id: string;
  expense_id: string;
  salary_month: number;
  salary_year: number;
  payment_type: SalaryPaymentType;
  base_salary: number;
  bonus: number;
  deduction: number;
  net_paid: number;
  payment_date: string;
  notes: string | null;
  status: PaymentStatus;
  created_at: string;
  // Joined presentation fields
  teacher_name?: string;
  teacher_email?: string;
  service_number?: string;
  rank?: string;
}

export interface FinanceSummary {
  fees_collected: number;
  outstanding_fees: number;
  salary_expenses: number;
  rent_expenses: number;
  utility_expenses: number;
  other_expenses: number;
  total_expenses: number;
  net_cash_flow: number;
  from_date: string;
  to_date: string;
}

export interface FinanceTransaction {
  transaction_id: string;
  transaction_type: 'INCOME' | 'EXPENSE';
  category: string;
  category_name: string;
  date: string;
  sort_date: string;
  party_name: string;
  party_ref: string;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string | null;
  receipt_number: string | null;
  status: PaymentStatus;
  recorded_by_name: string;
}

export interface StudentSearchResult {
  id: string;
  profile_id: string;
  roll_number: string;
  display_name: string;
  father_name: string;
  email: string | null;
  course_id: string | null;
  course_name: string | null;
  batch_id: string | null;
  batch_name: string | null;
  force_name: string | null;
}

export interface TeacherDropdownItem {
  id: string;
  display_name: string;
  email: string | null;
  service_number: string | null;
  rank: string | null;
}

export interface StudentFeeOverviewItem {
  student_id: string;
  display_name: string;
  roll_number: string;
  father_name: string | null;
  email: string | null;
  course_name: string | null;
  force_name: string | null;
  total_due: number;
  total_paid: number;
  total_discount: number;
  total_fine: number;
  balance: number;
  status: 'PAID' | 'UNPAID' | 'PARTIAL';
  accounts_count: number;
  unpaid_count: number;
}

