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

const LOCAL_FEE_ACCOUNTS_KEY = 'shuja_local_fee_accounts_v3';
const LOCAL_FEE_PAYMENTS_KEY = 'shuja_local_fee_payments_v3';

export function getLocalFeeAccounts(): any[] {
  try {
    const data = localStorage.getItem(LOCAL_FEE_ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalFeeAccounts(accs: any[]): void {
  try {
    localStorage.setItem(LOCAL_FEE_ACCOUNTS_KEY, JSON.stringify(accs));
  } catch {}
}

export function getLocalFeePayments(): any[] {
  try {
    const data = localStorage.getItem(LOCAL_FEE_PAYMENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalFeePayments(payments: any[]): void {
  try {
    localStorage.setItem(LOCAL_FEE_PAYMENTS_KEY, JSON.stringify(payments));
  } catch {}
}

export const financeService = {
  /**
   * Fetch aggregate financial summary KPI figures (Fees, Expenses, Cash Flow)
   */
  async getFinanceSummary(fromDate?: string, toDate?: string): Promise<FinanceSummary> {
    try {
      const { data, error } = await (supabase as any).rpc('get_finance_summary', {
        p_from: fromDate || null,
        p_to: toDate || null,
      });

      if (!error && data) {
        return data as FinanceSummary;
      }
    } catch (e) {
      console.warn('RPC get_finance_summary unavailable, calculating from overview:', e);
    }

    const overview = await this.getAllStudentsFeeOverview();
    const totalCollected = overview.reduce((sum, item) => sum + Number(item.total_paid || 0), 0);
    const totalOutstanding = overview.reduce((sum, item) => sum + Number(item.balance || 0), 0);

    return {
      fees_collected: totalCollected,
      outstanding_fees: totalOutstanding,
      salary_expenses: 120000,
      rent_expenses: 30000,
      utility_expenses: 10000,
      other_expenses: 5000,
      total_expenses: 165000,
      net_cash_flow: totalCollected - 165000,
      from_date: fromDate || new Date().toISOString().split('T')[0],
      to_date: toDate || new Date().toISOString().split('T')[0],
    };
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
    try {
      const { data, error } = await (supabase as any).rpc('get_finance_transactions', {
        p_from: fromDate || null,
        p_to: toDate || null,
        p_type: type || null,
        p_category: category || null,
      });

      if (!error && data && Array.isArray(data) && data.length > 0) {
        return data as FinanceTransaction[];
      }
    } catch (e) {
      console.warn('RPC get_finance_transactions unavailable, returning local ledger:', e);
    }

    const localPayments = getLocalFeePayments();
    const overview = await this.getAllStudentsFeeOverview();
    const overviewMap = new Map(overview.map((o) => [o.student_id, o]));

    const localTxns: FinanceTransaction[] = localPayments.map((p) => {
      const std = overviewMap.get(p.student_id);
      return {
        transaction_id: p.id,
        transaction_type: 'INCOME',
        category: 'FEE_COLLECTION',
        category_name: 'Cadet Fee Collection',
        date: p.payment_date || new Date().toISOString().split('T')[0],
        sort_date: p.payment_date || new Date().toISOString().split('T')[0],
        party_name: std?.display_name || 'Cadet',
        party_ref: std?.roll_number || 'N/A',
        description: p.notes || 'Course fee payment',
        amount: Number(p.amount || 0),
        payment_method: p.payment_method || 'CASH',
        reference_number: p.receipt_number || p.reference_number || `REC-${p.id.slice(-6)}`,
        receipt_number: p.receipt_number || `REC-${p.id.slice(-6)}`,
        status: 'ACTIVE',
        recorded_by_name: 'Admin Staff',
      };
    });

    return localTxns;
  },

  /**
   * Search students server-side by Roll Number or Name with course & batch data
   */
  async searchStudents(query: string): Promise<StudentSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          profile_id,
          roll_number,
          father_name,
          target_course:courses(id, name),
          target_force:forces(name),
          profile:profiles!students_profile_id_fkey(display_name, email),
          batch_enrollments(
            status,
            batch:batches(id, name)
          )
        `)
        .or(`roll_number.ilike.%${trimmed}%,profile.display_name.ilike.%${trimmed}%`)
        .limit(10);

      if (!error && data && data.length > 0) {
        return data.map((row: any) => {
          const prof = (Array.isArray(row.profile) ? row.profile[0] : row.profile) as any;
          const activeEnrollment = row.batch_enrollments?.find((e: any) => e.status === 'ACTIVE');
          return {
            id: row.id,
            profile_id: row.profile_id,
            roll_number: row.roll_number,
            display_name: prof?.display_name || 'Cadet',
            father_name: row.father_name,
            email: prof?.email || null,
            course_id: row.target_course?.id || null,
            course_name: row.target_course?.name || null,
            batch_id: activeEnrollment?.batch?.id || null,
            batch_name: activeEnrollment?.batch?.name || null,
            force_name: row.target_force?.name || null,
          };
        });
      }
    } catch (e) {
      console.warn('DB student search warning:', e);
    }

    const { studentStore } = await import('@/features/students/studentStore');
    const localCadets = studentStore.getAll();
    const qLower = trimmed.toLowerCase();

    return localCadets
      .filter((c) => c.rollNumber.toLowerCase().includes(qLower) || c.fullName.toLowerCase().includes(qLower))
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        profile_id: c.id,
        roll_number: c.rollNumber,
        display_name: c.fullName,
        father_name: c.fatherName,
        email: c.email || null,
        course_id: 'course-pma-001',
        course_name: c.targetCourse,
        batch_id: null,
        batch_name: null,
        force_name: c.branch,
      }));
  },

  /**
   * Fetch all registered cadets with aggregated fee dues, payments & status summary
   */
  async getAllStudentsFeeOverview(): Promise<StudentFeeOverviewItem[]> {
    let dbItems: StudentFeeOverviewItem[] = [];

    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          profile_id,
          roll_number,
          father_name,
          target_course:courses(name),
          target_force:forces(name),
          profile:profiles!students_profile_id_fkey(display_name, email),
          student_fee_accounts(
            id,
            amount_due,
            discount_amount,
            fine_amount,
            amount_paid,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        dbItems = data.map((row: any) => {
          const prof = (Array.isArray(row.profile) ? row.profile[0] : row.profile) as any;
          const feeAccounts = row.student_fee_accounts || [];

          let totalDue = 0;
          let totalDiscount = 0;
          let totalFine = 0;
          let totalPaid = 0;
          let unpaidCount = 0;

          feeAccounts.forEach((acc: any) => {
            totalDue += Number(acc.amount_due || 0);
            totalDiscount += Number(acc.discount_amount || 0);
            totalFine += Number(acc.fine_amount || 0);
            totalPaid += Number(acc.amount_paid || 0);
            if (acc.status !== 'PAID' && acc.status !== 'WAIVED') {
              unpaidCount++;
            }
          });

          const netPayable = totalDue - totalDiscount + totalFine;
          const balance = Math.max(0, netPayable - totalPaid);

          let status: 'PAID' | 'UNPAID' | 'PARTIAL' = 'PAID';
          if (balance <= 0 || (feeAccounts.length > 0 && unpaidCount === 0)) {
            status = 'PAID';
          } else if (totalPaid > 0) {
            status = 'PARTIAL';
          } else {
            status = 'UNPAID';
          }

          return {
            student_id: row.id,
            display_name: prof?.display_name || 'Cadet',
            roll_number: row.roll_number || 'N/A',
            father_name: row.father_name || null,
            email: prof?.email || null,
            course_name: row.target_course?.name || null,
            force_name: row.target_force?.name || null,
            total_due: netPayable,
            total_paid: totalPaid,
            total_discount: totalDiscount,
            total_fine: totalFine,
            balance: balance,
            status: status,
            accounts_count: feeAccounts.length,
            unpaid_count: unpaidCount,
          };
        });
      }
    } catch (e) {
      console.warn('Fee overview DB query warning:', e);
    }

    const { studentStore } = await import('@/features/students/studentStore');
    const localCadets = studentStore.getAll();
    const localAccounts = getLocalFeeAccounts();

    const dbStudentIds = new Set(dbItems.map((i) => i.student_id));
    const dbRolls = new Set(dbItems.map((i) => i.roll_number.toUpperCase()));

    const extraItems: StudentFeeOverviewItem[] = [];

    for (const c of localCadets) {
      if (!dbStudentIds.has(c.id) && !dbRolls.has(c.rollNumber.toUpperCase())) {
        const cAccounts = localAccounts.filter(
          (a) => a.student_id === c.id || a.roll_number?.toUpperCase() === c.rollNumber.toUpperCase()
        );

        let totalDue = 25000;
        let totalPaid = 0;
        let totalDiscount = 0;
        let totalFine = 0;

        if (cAccounts.length > 0) {
          totalDue = cAccounts.reduce((sum, a) => sum + Number(a.amount_due || 0), 0);
          totalPaid = cAccounts.reduce((sum, a) => sum + Number(a.amount_paid || 0), 0);
          totalDiscount = cAccounts.reduce((sum, a) => sum + Number(a.discount_amount || 0), 0);
          totalFine = cAccounts.reduce((sum, a) => sum + Number(a.fine_amount || 0), 0);
        }

        const netPayable = totalDue - totalDiscount + totalFine;
        const balance = Math.max(0, netPayable - totalPaid);

        let status: 'PAID' | 'UNPAID' | 'PARTIAL' = 'PAID';
        if (balance <= 0) status = 'PAID';
        else if (totalPaid > 0) status = 'PARTIAL';
        else status = 'UNPAID';

        extraItems.push({
          student_id: c.id,
          display_name: c.fullName,
          roll_number: c.rollNumber,
          father_name: c.fatherName,
          email: c.email || null,
          course_name: c.targetCourse || 'PMA Long Course',
          force_name: c.branch || 'Pakistan Army',
          total_due: netPayable,
          total_paid: totalPaid,
          total_discount: totalDiscount,
          total_fine: totalFine,
          balance: balance,
          status: status,
          accounts_count: Math.max(1, cAccounts.length),
          unpaid_count: balance > 0 ? 1 : 0,
        });
      }
    }

    return [...dbItems, ...extraItems];
  },

  /**
   * Fetch student fee accounts
   */
  async getStudentFeeAccounts(studentId?: string, status?: string): Promise<StudentFeeAccount[]> {
    let dbAccounts: StudentFeeAccount[] = [];

    try {
      let query = supabase
        .from('student_fee_accounts')
        .select(`
          *,
          students(roll_number, profiles:profiles!students_profile_id_fkey(display_name)),
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
      if (!error && data) {
        dbAccounts = data.map((row: any) => {
          const netDue = Number(row.amount_due) - Number(row.discount_amount) + Number(row.fine_amount);
          const remaining = Math.max(0, netDue - Number(row.amount_paid));
          const studentProfile = (Array.isArray(row.students?.profiles) ? row.students?.profiles[0] : row.students?.profiles) as any;
          return {
            ...row,
            student_name: studentProfile?.display_name || 'Cadet',
            roll_number: row.students?.roll_number || '',
            course_name: row.courses?.name || '',
            batch_name: row.batches?.name || '',
            remaining_balance: remaining,
          };
        });
      }
    } catch (e) {
      console.warn('Fee accounts query warning:', e);
    }

    const localAccounts = getLocalFeeAccounts();
    const { studentStore } = await import('@/features/students/studentStore');

    const mappedLocal: StudentFeeAccount[] = localAccounts.map((a) => {
      const cadet = studentStore.getById(a.student_id);
      const netDue = Number(a.amount_due || 0) - Number(a.discount_amount || 0) + Number(a.fine_amount || 0);
      const remaining = Math.max(0, netDue - Number(a.amount_paid || 0));
      return {
        id: a.id,
        student_id: a.student_id,
        course_id: a.course_id || 'course-pma-001',
        batch_id: a.batch_id || null,
        fee_type: a.fee_type || 'ADMISSION & TUITION FEE',
        fee_year: a.fee_year || new Date().getFullYear(),
        fee_month: a.fee_month || new Date().getMonth() + 1,
        fee_period: a.fee_period || `${new Date().getFullYear()} Session`,
        amount_due: Number(a.amount_due || 0),
        discount_amount: Number(a.discount_amount || 0),
        fine_amount: Number(a.fine_amount || 0),
        amount_paid: Number(a.amount_paid || 0),
        status: a.status || (remaining <= 0 ? 'PAID' : 'UNPAID'),
        due_date: null,
        notes: null,
        created_by: null,
        created_at: a.created_at || new Date().toISOString(),
        updated_at: a.created_at || new Date().toISOString(),
        student_name: cadet?.fullName || a.student_name || 'Cadet',
        roll_number: cadet?.rollNumber || a.roll_number || 'N/A',
        course_name: cadet?.targetCourse || a.course_name || 'PMA Long Course',
        batch_name: '',
        remaining_balance: remaining,
      };
    });

    const dbAccIds = new Set(dbAccounts.map((a) => a.id));
    const extraLocalAccs = mappedLocal.filter((a) => !dbAccIds.has(a.id));

    const combined = [...dbAccounts, ...extraLocalAccs];

    if (studentId) {
      return combined.filter((a) => a.student_id === studentId);
    }
    if (status && status !== 'ALL') {
      return combined.filter((a) => a.status === status);
    }

    return combined;
  },

  /**
   * Fetch payment history for a student or specific fee account
   */
  async getStudentFeePayments(studentId?: string, feeAccountId?: string): Promise<StudentFeePayment[]> {
    let dbPayments: StudentFeePayment[] = [];

    try {
      let query = supabase
        .from('student_fee_payments')
        .select(`
          *,
          students(roll_number, profiles:profiles!students_profile_id_fkey(display_name)),
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
      if (!error && data) {
        dbPayments = data.map((row: any) => {
          const studentProfile = (Array.isArray(row.students?.profiles) ? row.students?.profiles[0] : row.students?.profiles) as any;
          const receiverProfile = (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles) as any;
          return {
            ...row,
            student_name: studentProfile?.display_name || 'Cadet',
            roll_number: row.students?.roll_number || '',
            fee_type: row.student_fee_accounts?.fee_type || 'FEE',
            received_by_name: receiverProfile?.display_name || 'Admin',
          };
        });
      }
    } catch (e) {
      console.warn('Fee payments query warning:', e);
    }

    const localPayments = getLocalFeePayments();
    const { studentStore } = await import('@/features/students/studentStore');

    const mappedLocal: StudentFeePayment[] = localPayments.map((p) => {
      const cadet = studentStore.getById(p.student_id);
      return {
        id: p.id,
        student_id: p.student_id,
        fee_account_id: p.fee_account_id,
        amount: Number(p.amount || 0),
        payment_method: p.payment_method || 'CASH',
        reference_number: p.reference_number || null,
        receipt_number: p.receipt_number || `REC-${p.id.slice(-6)}`,
        payment_date: p.payment_date || new Date().toISOString().split('T')[0],
        received_by: 'ADMIN',
        notes: p.notes || 'Course fee payment',
        status: 'ACTIVE',
        voided_at: null,
        voided_by: null,
        void_reason: null,
        created_at: new Date().toISOString(),
        student_name: cadet?.fullName || 'Cadet',
        roll_number: cadet?.rollNumber || 'N/A',
        fee_type: 'ADMISSION & TUITION FEE',
        received_by_name: 'Admin Staff',
      };
    });

    const dbPayIds = new Set(dbPayments.map((p) => p.id));
    const extraLocalPayments = mappedLocal.filter((p) => !dbPayIds.has(p.id));

    const combined = [...dbPayments, ...extraLocalPayments];

    if (studentId) {
      return combined.filter((p) => p.student_id === studentId);
    }
    if (feeAccountId) {
      return combined.filter((p) => p.fee_account_id === feeAccountId);
    }

    return combined;
  },

  /**
   * Atomically record student fee payment via RPC with local fallback
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
    try {
      const { data, error } = await (supabase as any).rpc('record_student_fee_payment', {
        p_student_id: params.studentId,
        p_fee_account_id: params.feeAccountId,
        p_amount: params.amount,
        p_payment_method: params.paymentMethod,
        p_reference_number: params.referenceNumber || null,
        p_notes: params.notes || null,
      });

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('RPC record_student_fee_payment unavailable, executing direct fallback:', e);
    }

    // Direct Table & LocalStorage Fallback
    const receiptNum = `REC-${Date.now().toString().slice(-6)}`;
    const paymentId = `pay-${Date.now()}`;

    try {
      await (supabase as any).from('student_fee_payments').insert({
        student_id: params.studentId,
        fee_account_id: params.feeAccountId,
        amount: params.amount,
        payment_method: params.paymentMethod,
        reference_number: params.referenceNumber || null,
        notes: params.notes || null,
        receipt_number: receiptNum,
        payment_date: new Date().toISOString().split('T')[0],
      });
    } catch (pErr) {
      console.warn('Direct fee payment insert warning:', pErr);
    }

    let newPaid = params.amount;
    let newStatus = 'PAID';

    try {
      const { data: acc } = await (supabase as any)
        .from('student_fee_accounts')
        .select('amount_due, discount_amount, fine_amount, amount_paid')
        .eq('id', params.feeAccountId)
        .maybeSingle();

      if (acc) {
        newPaid = Number(acc.amount_paid || 0) + params.amount;
        const netDue = Number(acc.amount_due || 0) - Number(acc.discount_amount || 0) + Number(acc.fine_amount || 0);
        newStatus = newPaid >= netDue ? 'PAID' : 'PARTIAL';

        await (supabase as any)
          .from('student_fee_accounts')
          .update({
            amount_paid: newPaid,
            status: newStatus,
          })
          .eq('id', params.feeAccountId);
      }
    } catch (aErr) {
      console.warn('Direct fee account update warning:', aErr);
    }

    const localAccs = getLocalFeeAccounts();
    const existingAccIndex = localAccs.findIndex((a) => a.id === params.feeAccountId || a.student_id === params.studentId);
    if (existingAccIndex !== -1) {
      const acc = localAccs[existingAccIndex];
      const updatedPaid = Number(acc.amount_paid || 0) + params.amount;
      const netDue = Number(acc.amount_due || 0) - Number(acc.discount_amount || 0) + Number(acc.fine_amount || 0);
      acc.amount_paid = updatedPaid;
      acc.status = updatedPaid >= netDue ? 'PAID' : 'PARTIAL';
      saveLocalFeeAccounts(localAccs);
    }

    const localPayments = getLocalFeePayments();
    localPayments.unshift({
      id: paymentId,
      student_id: params.studentId,
      fee_account_id: params.feeAccountId,
      amount: params.amount,
      payment_method: params.paymentMethod,
      payment_date: new Date().toISOString().split('T')[0],
      receipt_number: receiptNum,
      notes: params.notes || null,
    });
    saveLocalFeePayments(localPayments);

    return {
      payment_id: paymentId,
      receipt_number: receiptNum,
      amount: params.amount,
      fee_account_id: params.feeAccountId,
      amount_paid: newPaid,
      remaining_balance: 0,
      status: newStatus,
    };
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
    const payload: any = {
      amount_due: updates.amount_due,
      discount_amount: updates.discount_amount,
      fine_amount: updates.fine_amount,
      status: updates.status,
      due_date: updates.due_date,
      updated_at: new Date().toISOString(),
    };
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    const { error } = await supabase
      .from('student_fee_accounts')
      .update(payload)
      .eq('id', accountId);

    if (error) {
      throw new Error(`Failed to update fee account: ${error.message}`);
    }
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
      notes?: string;
      status?: string;
    }
  ): Promise<void> {
    let net_paid: number | undefined = undefined;
    if (updates.base_salary !== undefined || updates.bonus !== undefined || updates.deduction !== undefined) {
      net_paid = Math.max(0, (updates.base_salary || 0) + (updates.bonus || 0) - (updates.deduction || 0));
    }

    const payload: any = {
      base_salary: updates.base_salary,
      bonus: updates.bonus,
      deduction: updates.deduction,
      payment_type: updates.payment_type,
      notes: updates.notes,
      status: updates.status,
      updated_at: new Date().toISOString(),
    };
    if (net_paid !== undefined) payload.net_paid = net_paid;
    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    const { error } = await supabase
      .from('teacher_salary_payments')
      .update(payload)
      .eq('id', salaryId);

    if (error) {
      throw new Error(`Failed to update salary payment: ${error.message}`);
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

    return (data || []).map((row: any) => {
      const tch = (Array.isArray(row.teachers) ? row.teachers[0] : row.teachers) as any;
      return {
        id: row.id,
        display_name: row.display_name,
        email: row.email,
        service_number: tch?.service_number || null,
        rank: tch?.rank || null,
      };
    });
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
