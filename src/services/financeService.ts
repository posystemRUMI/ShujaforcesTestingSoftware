import { supabase } from '@/lib/supabaseClient';
import type {
  FeeType,
  StudentFeeAccount,
  StudentFeePayment,
  ExpenseCategory,
  FinanceExpense,
  TeacherSalaryPayment,
  FinanceSummary,
  FinanceTransaction,
  StudentSearchResult,
  StudentFeeOverviewItem,
  TeacherDropdownItem,
  PaymentMethod,
  SalaryPaymentType,
} from '@/types/finance.types';

export interface FeeLedgerData {
  accounts: Array<StudentFeeAccount & { net_due: number; remaining_balance: number }>;
  payments: StudentFeePayment[];
  totals: { total_fee: number | null; paid_fee: number; remaining_fee: number | null };
}
async function financeRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await (supabase as any).rpc(name, args);
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('Backend returned no saved finance data.');
  return data as T;
}

export const financeService = {
  /**
   * Fetch aggregate financial summary KPI figures (Fees, Expenses, Cash Flow)
   */
  async getFinanceSummary(fromDate?: string, toDate?: string): Promise<FinanceSummary> {
    return financeRpc('get_finance_summary', { p_from: fromDate || null, p_to: toDate || null });
  },
  async getFinanceTransactions(fromDate?: string, toDate?: string, type?: string, category?: string): Promise<FinanceTransaction[]> {
    return financeRpc('get_finance_transactions', { p_from: fromDate || null, p_to: toDate || null, p_type: type || null, p_category: category || null });
  },
  async searchStudents(query: string): Promise<StudentSearchResult[]> {
    if (!query.trim()) return [];
    return financeRpc('finance_students_fee_overview', { p_search: query.trim() });
  },
  async getAllStudentsFeeOverview(): Promise<StudentFeeOverviewItem[]> {
    return financeRpc('finance_students_fee_overview', { p_search: null });
  },
  async getStudentFeeData(studentId?: string, status?: string, feeAccountId?: string): Promise<FeeLedgerData> {
    return financeRpc('finance_student_fee_data', { p_student_id: studentId || null, p_status: status || null, p_fee_account_id: feeAccountId || null });
  },
  async getStudentFeeAccounts(studentId?: string, status?: string): Promise<StudentFeeAccount[]> {
    return (await this.getStudentFeeData(studentId, status)).accounts;
  },
  async getStudentFeePayments(studentId?: string, feeAccountId?: string): Promise<StudentFeePayment[]> {
    return (await this.getStudentFeeData(studentId, undefined, feeAccountId)).payments;
  },

  async recordStudentFeePayment(params: {
    studentId: string;
    feeAccountId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
  }): Promise<{
    payment_id: string;
    receipt_number: string;
    amount: number;
    fee_account_id: string;
    amount_paid: number;
    remaining_balance: number;
    status: string;
  }> {
    const { data, error } = await (supabase as any).rpc('record_student_fee_payment', {
      p_student_id: params.studentId, p_fee_account_id: params.feeAccountId, p_amount: params.amount,
      p_payment_method: params.paymentMethod, p_reference_number: params.referenceNumber || null, p_notes: params.notes || null,
    });
    if (error) throw new Error(error.message);
    if (!data?.payment_id) throw new Error('The backend did not save the payment.');
    return data;
  },

  /**
   * Void fee payment and recompute balance
   */
  async voidStudentFeePayment(paymentId: string, reason: string): Promise<void> {
    const { error } = await (supabase as any).rpc('void_student_fee_payment', {
      p_payment_id: paymentId,
      p_reason: reason,
    });

    if (error) {
      throw new Error(`Failed to void payment: ${error.message}`);
    }
  },

  /**
   * Update fee account discount or fine
   */
  async updateFeeAdjustment(params: {
    feeAccountId: string;
    discountAmount: number;
    fineAmount: number;
    reason?: string;
  }): Promise<void> {
    const { error } = await (supabase as any).rpc('update_student_fee_adjustment', {
      p_fee_account_id: params.feeAccountId,
      p_discount_amount: params.discountAmount,
      p_fine_amount: params.fineAmount,
      p_reason: params.reason || null,
    });

    if (error) {
      throw new Error(`Failed to adjust fee: ${error.message}`);
    }
  },

  /**
   * Waive a fee account
   */
  async waiveStudentFee(feeAccountId: string, reason: string): Promise<void> {
    const { error } = await (supabase as any).rpc('waive_student_fee', {
      p_fee_account_id: feeAccountId,
      p_reason: reason,
    });

    if (error) {
      throw new Error(`Failed to waive fee: ${error.message}`);
    }
  },

  /**
   * Generate monthly fees in batch for eligible students
   */
  async generateMonthlyFees(params: {
    feeMonth: number;
    feeYear: number;
    feePeriod: string;
    feeType?: string;
    amount: number;
    dueDate?: string;
    forceId?: string;
    courseId?: string;
    batchId?: string;
  }): Promise<{ created_count: number; skipped_count: number; total_eligible: number }> {
    const { data, error } = await (supabase as any).rpc('generate_monthly_fees', {
      p_fee_month: params.feeMonth,
      p_fee_year: params.feeYear,
      p_fee_period: params.feePeriod,
      p_fee_type: params.feeType || 'MONTHLY',
      p_amount: params.amount,
      p_due_date: params.dueDate || null,
      p_force_id: params.forceId || null,
      p_course_id: params.courseId || null,
      p_batch_id: params.batchId || null,
    });

    if (error) {
      throw new Error(`Failed to generate monthly fees: ${error.message}`);
    }

    return data;
  },

  /**
   * Fetch expenses list with category & teacher joins
   */
  async getExpenses(filters?: {
    fromDate?: string;
    toDate?: string;
    category?: string;
    status?: string;
  }): Promise<FinanceExpense[]> {
    let query = supabase
      .from('finance_expenses')
      .select(`
        *,
        expense_categories(name),
        teacher:profiles!finance_expenses_teacher_id_fkey(display_name),
        recorded_by_profile:profiles!finance_expenses_recorded_by_fkey(display_name)
      `)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.fromDate) {
      query = query.gte('expense_date', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('expense_date', filters.toDate);
    }
    if (filters?.category && filters.category !== 'ALL') {
      query = query.eq('category_code', filters.category);
    }
    if (filters?.status && filters.status !== 'ALL') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to load expenses: ${error.message}`);
    }

    return Promise.all((data || []).map(async (row: any) => ({
      ...row,
      receipt_url: row.receipt_url ? await this.getReceiptAttachmentUrl(row.receipt_url) : null,
      category_name: row.expense_categories?.name || row.category_code,
      teacher_name: row.teacher?.display_name || null,
      recorded_by_name: row.recorded_by_profile?.display_name || 'Admin',
    })));
  },

  /**
   * Record an expense (supports general, rent, utilities, and salary)
   */
  async recordExpense(params: {
    categoryCode: string;
    title: string;
    description?: string;
    amount: number;
    expenseDate: string;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    payeeName?: string;
    teacherId?: string;
    receiptUrl?: string;
    isRecurring?: boolean;
    recurringPeriod?: string;
    salaryMonth?: number;
    salaryYear?: number;
    salaryPaymentType?: SalaryPaymentType;
    baseSalary?: number;
    bonus?: number;
    deduction?: number;
  }): Promise<{ expense_id: string; salary_id?: string }> {
    const { data, error } = await (supabase as any).rpc('record_finance_expense', {
      p_category_code: params.categoryCode,
      p_title: params.title,
      p_description: params.description || null,
      p_amount: params.amount,
      p_expense_date: params.expenseDate,
      p_payment_method: params.paymentMethod,
      p_reference_number: params.referenceNumber || null,
      p_payee_name: params.payeeName || null,
      p_teacher_id: params.teacherId || null,
      p_receipt_url: params.receiptUrl || null,
      p_is_recurring: params.isRecurring || false,
      p_recurring_period: params.recurringPeriod || null,
      p_salary_month: params.salaryMonth || null,
      p_salary_year: params.salaryYear || null,
      p_salary_payment_type: params.salaryPaymentType || 'REGULAR',
      p_base_salary: params.baseSalary || 0,
      p_bonus: params.bonus || 0,
      p_deduction: params.deduction || 0,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Void an expense
   */
  async voidExpense(expenseId: string, reason: string): Promise<void> {
    const { error } = await (supabase as any).rpc('void_finance_expense', {
      p_expense_id: expenseId,
      p_reason: reason,
    });

    if (error) {
      throw new Error(`Failed to void expense: ${error.message}`);
    }
  },

  /**
   * Update an existing expense record
   */
  async updateExpense(
    expenseId: string,
    updates: {
      title?: string;
      description?: string;
      amount?: number;
      payeeName?: string;
      paymentMethod?: PaymentMethod;
      referenceNumber?: string;
      categoryCode?: string;
    }
  ): Promise<void> {
    const payload: any = {
      title: updates.title,
      description: updates.description,
      amount: updates.amount,
      payee_name: updates.payeeName,
      payment_method: updates.paymentMethod,
      reference_number: updates.referenceNumber,
      category_code: updates.categoryCode,
      updated_at: new Date().toISOString(),
    };
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    const { error } = await supabase
      .from('finance_expenses')
      .update(payload)
      .eq('id', expenseId);

    if (error) {
      throw new Error(`Failed to update expense: ${error.message}`);
    }
  },

  /**
   * Update an existing cadet fee account
   */
  async updateFeeAccount(
    accountId: string,
    updates: {
      amount_due?: number;
      discount_amount?: number;
      fine_amount?: number;
      status?: 'UNPAID' | 'PARTIAL' | 'PAID' | 'WAIVED' | 'OVERDUE';
      due_date?: string;
    }
  ): Promise<void> {
    await financeRpc('finance_update_fee_account', { p_account_id: accountId, p_updates: updates });
  },

  /**
   * Update an existing teacher salary payment record
   */
  async updateSalaryPayment(
    salaryId: string,
    updates: {
      base_salary?: number;
      bonus?: number;
      deduction?: number;
      payment_type?: SalaryPaymentType;
      notes?: string | null;
      status?: string;
    }
  ): Promise<void> {
    await financeRpc('finance_update_salary_payment', { p_salary_id: salaryId, p_updates: updates });
  },

  /**
   * Fetch salary payments
   */
  async getTeacherSalaryPayments(year?: number, month?: number): Promise<TeacherSalaryPayment[]> {
    let query = supabase
      .from('teacher_salary_payments')
      .select(`
        *,
        profiles:teacher_profile_id(
          display_name,
          email,
          teachers(service_number, rank)
        )
      `)
      .order('payment_date', { ascending: false });

    if (year) {
      query = query.eq('salary_year', year);
    }
    if (month && month > 0) {
      query = query.eq('salary_month', month);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to load salary payments: ${error.message}`);
    }

    return (data || []).map((row: any) => {
      const prof = (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles) as any;
      const tch = (Array.isArray(prof?.teachers) ? prof?.teachers[0] : prof?.teachers) as any;
      return {
        ...row,
        teacher_name: prof?.display_name || 'Faculty Member',
        teacher_email: prof?.email || null,
        service_number: tch?.service_number || null,
        rank: tch?.rank || null,
      };
    });
  },

  /**
   * Fetch eligible teachers for salary dropdown (Role = TEACHER)
   */
  async getTeachersForSalaryDropdown(year?: number, month?: number): Promise<TeacherDropdownItem[]> {
    return financeRpc('finance_salary_eligible_teachers', { p_year: year ?? null, p_month: month ?? null });
  },

  async getMyTeacherSalaries(year: number, month?: number): Promise<TeacherSalaryPayment[]> {
    return financeRpc('get_my_teacher_salaries', { p_year: year, p_month: month ?? null });
  },
  /**
   * Fetch all active fee types
   */
  async getFeeTypes(): Promise<FeeType[]> {
    const { data, error } = await supabase
      .from('fee_types')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to load fee types: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Fetch all active expense categories
   */
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to load expense categories: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Upload expense receipt attachment to private bucket
   */
  async getReceiptAttachmentUrl(stored: string): Promise<string> {
    const marker = '/storage/v1/object/public/finance-receipts/';
    const path = stored.includes(marker) ? decodeURIComponent(stored.split(marker)[1]) : stored;
    if (path.startsWith('http')) throw new Error('Unrecognized receipt storage path.');
    const { data, error } = await supabase.storage.from('finance-receipts').createSignedUrl(path, 3600);
    if (error) throw new Error(error.message);
    return data.signedUrl;
  },
  async uploadReceiptAttachment(file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const filePath = `receipts/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const { error } = await supabase.storage
      .from('finance-receipts')
      .upload(filePath, file, { upsert: false });

    if (error) {
      throw new Error(`Receipt upload failed: ${error.message}`);
    }

    return filePath;
  },
};
