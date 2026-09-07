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
  TeacherDropdownItem,
  PaymentMethod,
  SalaryPaymentType,
} from '@/types/finance.types';

export const financeService = {
  /**
   * Fetch aggregate financial summary KPI figures (Fees, Expenses, Cash Flow)
   */
  async getFinanceSummary(fromDate?: string, toDate?: string): Promise<FinanceSummary> {
    const { data, error } = await (supabase as any).rpc('get_finance_summary', {
      p_from: fromDate || null,
      p_to: toDate || null,
    });

    if (error) {
      throw new Error(`Failed to load finance summary: ${error.message}`);
    }

    return data as FinanceSummary;
  },

  /**
   * Fetch unified master transactions ledger (Income & Expenses)
   */
  async getFinanceTransactions(
    fromDate?: string,
    toDate?: string,
    type?: string,
    category?: string,
  ): Promise<FinanceTransaction[]> {
    const { data, error } = await (supabase as any).rpc('get_finance_transactions', {
      p_from: fromDate || null,
      p_to: toDate || null,
      p_type: type || null,
      p_category: category || null,
    });

    if (error) {
      throw new Error(`Failed to load finance transactions: ${error.message}`);
    }

    return (data || []) as FinanceTransaction[];
  },

  /**
   * Search students server-side by Roll Number or Name with course & batch data
   */
  async searchStudents(query: string): Promise<StudentSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        profile_id,
        roll_number,
        father_name,
        target_course:courses(id, name),
        target_force:forces(name),
        profile:profiles!profile_id(display_name, email),
        batch_enrollments(
          status,
          batch:batches(id, name)
        )
      `)
      .or(`roll_number.ilike.%${trimmed}%,profile.display_name.ilike.%${trimmed}%`)
      .limit(10);

    if (error) {
      // Fallback query if cross-resource or ilike throws
      const { data: fallbackData, error: fbError } = await supabase
        .from('students')
        .select(`
          id,
          profile_id,
          roll_number,
          father_name,
          courses(id, name),
          forces(name),
          profiles!profile_id(display_name, email)
        `)
        .ilike('roll_number', `%${trimmed}%`)
        .limit(10);

      if (fbError) {
        throw new Error(`Student search failed: ${fbError.message}`);
      }

      return (fallbackData || []).map((row: any) => ({
        id: row.id,
        profile_id: row.profile_id,
        roll_number: row.roll_number,
        display_name: row.profiles?.display_name || 'Cadet',
        father_name: row.father_name,
        email: row.profiles?.email || null,
        course_id: row.courses?.id || null,
        course_name: row.courses?.name || null,
        batch_id: null,
        batch_name: null,
        force_name: row.forces?.name || null,
      }));
    }

    return (data || []).map((row: any) => {
      const activeEnrollment = row.batch_enrollments?.find((e: any) => e.status === 'ACTIVE');
      return {
        id: row.id,
        profile_id: row.profile_id,
        roll_number: row.roll_number,
        display_name: row.profile?.display_name || 'Cadet',
        father_name: row.father_name,
        email: row.profile?.email || null,
        course_id: row.target_course?.id || null,
        course_name: row.target_course?.name || null,
        batch_id: activeEnrollment?.batch?.id || null,
        batch_name: activeEnrollment?.batch?.name || null,
        force_name: row.target_force?.name || null,
      };
    });
  },

  /**
   * Fetch student fee accounts
   */
  async getStudentFeeAccounts(studentId?: string, status?: string): Promise<StudentFeeAccount[]> {
    let query = supabase
      .from('student_fee_accounts')
      .select(`
        *,
        students(roll_number, profiles!profile_id(display_name)),
        courses(name),
        batches(name)
      `)
      .order('fee_year', { ascending: false })
      .order('fee_month', { ascending: false })
      .order('created_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to load fee accounts: ${error.message}`);
    }

    return (data || []).map((row: any) => {
      const netDue = Number(row.amount_due) - Number(row.discount_amount) + Number(row.fine_amount);
      const remaining = Math.max(0, netDue - Number(row.amount_paid));
      return {
        ...row,
        student_name: row.students?.profiles?.display_name || 'Cadet',
        roll_number: row.students?.roll_number || '',
        course_name: row.courses?.name || '',
        batch_name: row.batches?.name || '',
        remaining_balance: remaining,
      };
    });
  },

  /**
   * Fetch payment history for a student or specific fee account
   */
  async getStudentFeePayments(studentId?: string, feeAccountId?: string): Promise<StudentFeePayment[]> {
    let query = supabase
      .from('student_fee_payments')
      .select(`
        *,
        students(roll_number, profiles!profile_id(display_name)),
        student_fee_accounts(fee_type, fee_period),
        profiles:received_by(display_name)
      `)
      .order('payment_date', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (feeAccountId) {
      query = query.eq('fee_account_id', feeAccountId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to load payment history: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      ...row,
      student_name: row.students?.profiles?.display_name || 'Cadet',
      roll_number: row.students?.roll_number || '',
      fee_type: row.student_fee_accounts?.fee_type || 'FEE',
      received_by_name: row.profiles?.display_name || 'Admin',
    }));
  },

  /**
   * Atomically record student fee payment via RPC
   */
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
      p_student_id: params.studentId,
      p_fee_account_id: params.feeAccountId,
      p_amount: params.amount,
      p_payment_method: params.paymentMethod,
      p_reference_number: params.referenceNumber || null,
      p_notes: params.notes || null,
    });

    if (error) {
      throw new Error(error.message);
    }

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

    return (data || []).map((row: any) => ({
      ...row,
      category_name: row.expense_categories?.name || row.category_code,
      teacher_name: row.teacher?.display_name || null,
      recorded_by_name: row.recorded_by_profile?.display_name || 'Admin',
    }));
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
   * Fetch salary payments
   */
  async getTeacherSalaryPayments(year?: number, month?: number): Promise<TeacherSalaryPayment[]> {
    let query = supabase
      .from('teacher_salary_payments')
      .select(`
        *,
        profiles:teacher_profile_id(display_name, email),
        teachers:teacher_profile_id(service_number, rank)
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

    return (data || []).map((row: any) => ({
      ...row,
      teacher_name: row.profiles?.display_name || 'Faculty Member',
      teacher_email: row.profiles?.email || null,
      service_number: row.teachers?.service_number || null,
      rank: row.teachers?.rank || null,
    }));
  },

  /**
   * Fetch eligible teachers for salary dropdown (Role = TEACHER)
   */
  async getTeachersForSalaryDropdown(): Promise<TeacherDropdownItem[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        display_name,
        email,
        teachers(service_number, rank)
      `)
      .eq('role', 'TEACHER')
      .eq('status', 'ACTIVE')
      .order('display_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to load teachers list: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      display_name: row.display_name,
      email: row.email,
      service_number: row.teachers?.service_number || null,
      rank: row.teachers?.rank || null,
    }));
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
  async uploadReceiptAttachment(file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const filePath = `receipts/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const { error } = await supabase.storage
      .from('finance-receipts')
      .upload(filePath, file, { upsert: false });

    if (error) {
      throw new Error(`Receipt upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from('finance-receipts').getPublicUrl(filePath);
    return data.publicUrl;
  },
};
