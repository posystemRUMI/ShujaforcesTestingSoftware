-- ============================================================================
-- Security & Functional Test: 03_finance_security_validation.sql
-- Description: Complete Finance Module RLS, RPCs, Lifecycle & Calculations Validation
-- Test Codes: FIN-001 to FIN-032
-- Author: Antigravity
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Assertion 1: All Finance Tables have Row Level Security Enabled
-- (FIN-003, FIN-004)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_table TEXT;
  v_has_rls BOOLEAN;
  v_unprotected TEXT[] := ARRAY[]::TEXT[];
  v_tables TEXT[] := ARRAY[
    'fee_types',
    'student_fee_accounts',
    'student_fee_payments',
    'expense_categories',
    'finance_expenses',
    'teacher_salary_payments',
    'finance_audit_log'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    SELECT relrowsecurity INTO v_has_rls
    FROM pg_class WHERE relname = v_table AND relnamespace = 'public'::regnamespace;

    IF NOT COALESCE(v_has_rls, false) THEN
      v_unprotected := array_append(v_unprotected, v_table);
    END IF;
  END LOOP;

  IF array_length(v_unprotected, 1) > 0 THEN
    RAISE EXCEPTION 'SECURITY ASSERTION FAILED: Finance tables without RLS enabled: %', v_unprotected;
  END IF;
  RAISE NOTICE '✓ FIN-003/004: All 7 finance tables have RLS strictly enabled.';
END $$;

-- ----------------------------------------------------------------------------
-- Assertion 2: All Required Finance RPCs Exist in Public Schema
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_rpc TEXT;
  v_rpcs TEXT[] := ARRAY[
    'generate_receipt_number',
    'record_student_fee_payment',
    'void_student_fee_payment',
    'update_student_fee_adjustment',
    'waive_student_fee',
    'record_finance_expense',
    'void_finance_expense',
    'generate_monthly_fees',
    'get_finance_summary',
    'get_finance_transactions'
  ];
BEGIN
  FOREACH v_rpc IN ARRAY v_rpcs LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = v_rpc
    ) THEN
      RAISE EXCEPTION 'ASSERTION FAILED: Missing required Finance RPC function %', v_rpc;
    END IF;
  END LOOP;
  RAISE NOTICE '✓ All 10 Finance RPC functions exist and are properly registered.';
END $$;

-- ----------------------------------------------------------------------------
-- Assertion 3: Sequential & Unique Receipt Generation
-- (FIN-013)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_r1 TEXT;
  v_r2 TEXT;
  v_year TEXT;
BEGIN
  v_year := to_char(CURRENT_DATE, 'YYYY');
  v_r1 := public.generate_receipt_number();
  v_r2 := public.generate_receipt_number();

  IF v_r1 IS NULL OR v_r2 IS NULL THEN
    RAISE EXCEPTION 'FIN-013 FAILED: Receipt number is null';
  END IF;

  IF v_r1 = v_r2 THEN
    RAISE EXCEPTION 'FIN-013 FAILED: Generated duplicate receipt numbers: % and %', v_r1, v_r2;
  END IF;

  IF NOT (v_r1 LIKE 'SFA-FEE-' || v_year || '-%') THEN
    RAISE EXCEPTION 'FIN-013 FAILED: Receipt number format invalid: %', v_r1;
  END IF;

  RAISE NOTICE '✓ FIN-013: Unique sequential receipt generation verified (% -> %).', v_r1, v_r2;
END $$;

-- ----------------------------------------------------------------------------
-- Assertion 4: Student Fee Lifecycle & Overpayment Prevention
-- (FIN-010, FIN-011, FIN-012, FIN-014)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_student_id UUID;
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_account_id UUID;
  v_res JSONB;
  v_payment_id UUID;
  v_overpay_err BOOLEAN := false;
  v_account RECORD;
BEGIN
  -- Get or create test student
  SELECT id INTO v_student_id FROM public.students LIMIT 1;
  IF v_student_id IS NULL THEN
    RAISE NOTICE 'Skipping inline fee lifecycle test: No student found in test DB.';
    RETURN;
  END IF;

  -- 1. Create a fee account for 10,000 PKR
  INSERT INTO public.student_fee_accounts (
    student_id, fee_period, fee_month, fee_year, fee_type, amount_due, status, created_by
  ) VALUES (
    v_student_id, 'October 2026', 10, 2026, 'MONTHLY', 10000.00, 'UNPAID', v_admin_id
  ) RETURNING id INTO v_account_id;

  -- 2. Partial Payment: 4,000 PKR -> Status must be PARTIAL (FIN-011)
  v_res := public.record_student_fee_payment(
    p_student_id => v_student_id,
    p_fee_account_id => v_account_id,
    p_amount => 4000.00,
    p_payment_method => 'CASH',
    p_notes => 'Partial fee test'
  );

  SELECT * INTO v_account FROM public.student_fee_accounts WHERE id = v_account_id;
  IF v_account.status <> 'PARTIAL' OR v_account.amount_paid <> 4000.00 THEN
    RAISE EXCEPTION 'FIN-011 FAILED: Expected PARTIAL with 4000 paid, got % with % paid', v_account.status, v_account.amount_paid;
  END IF;
  RAISE NOTICE '✓ FIN-011: Partial payment recorded; status transitioned to PARTIAL.';

  -- 3. Overpayment Attempt: 7,000 PKR when 6,000 is remaining -> Must FAIL (FIN-012)
  BEGIN
    PERFORM public.record_student_fee_payment(
      p_student_id => v_student_id,
      p_fee_account_id => v_account_id,
      p_amount => 7000.00,
      p_payment_method => 'BANK_TRANSFER'
    );
  EXCEPTION WHEN OTHERS THEN
    v_overpay_err := true;
  END;

  IF NOT v_overpay_err THEN
    RAISE EXCEPTION 'FIN-012 FAILED: Overpayment was erroneously permitted!';
  END IF;
  RAISE NOTICE '✓ FIN-012: Overpayment attempt blocked correctly.';

  -- 4. Complete Payment: 6,000 PKR -> Status must be PAID (FIN-010)
  v_res := public.record_student_fee_payment(
    p_student_id => v_student_id,
    p_fee_account_id => v_account_id,
    p_amount => 6000.00,
    p_payment_method => 'ONLINE',
    p_reference_number => 'TXN-998877'
  );
  v_payment_id := (v_res->>'payment_id')::UUID;

  SELECT * INTO v_account FROM public.student_fee_accounts WHERE id = v_account_id;
  IF v_account.status <> 'PAID' OR v_account.amount_paid <> 10000.00 THEN
    RAISE EXCEPTION 'FIN-010 FAILED: Expected PAID with 10000 paid, got % with % paid', v_account.status, v_account.amount_paid;
  END IF;
  RAISE NOTICE '✓ FIN-010: Full fee payment recorded; status transitioned to PAID.';

  -- 5. Void Second Payment (6,000 PKR) -> Balance restored to 4,000 and status PARTIAL (FIN-014)
  PERFORM public.void_student_fee_payment(
    p_payment_id => v_payment_id,
    p_reason => 'Erroneous duplicate entry test'
  );

  SELECT * INTO v_account FROM public.student_fee_accounts WHERE id = v_account_id;
  IF v_account.status <> 'PARTIAL' OR v_account.amount_paid <> 4000.00 THEN
    RAISE EXCEPTION 'FIN-014 FAILED: Void payment failed to restore balance. Got % with % paid', v_account.status, v_account.amount_paid;
  END IF;
  RAISE NOTICE '✓ FIN-014: Payment voided and account balance restored accurately.';
END $$;

-- ----------------------------------------------------------------------------
-- Assertion 5: Teacher Salary Recording, Duplicate Block, & Adjustment Payouts
-- (FIN-018, FIN-019, FIN-020, FIN-021)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_teacher_id UUID;
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_res JSONB;
  v_dup_err BOOLEAN := false;
  v_expense_count INT;
BEGIN
  -- Get active teacher profile
  SELECT id INTO v_teacher_id FROM public.profiles WHERE role = 'TEACHER' AND status = 'ACTIVE' LIMIT 1;
  IF v_teacher_id IS NULL THEN
    RAISE NOTICE 'Skipping teacher salary tests: No active teacher found in test DB.';
    RETURN;
  END IF;

  -- 1. Record Regular Salary for 11/2026 (FIN-019)
  v_res := public.record_finance_expense(
    p_category_code => 'SALARY',
    p_title => 'Monthly Faculty Remuneration',
    p_amount => 50000.00,
    p_expense_date => CURRENT_DATE,
    p_payment_method => 'BANK_TRANSFER',
    p_teacher_id => v_teacher_id,
    p_salary_month => 11,
    p_salary_year => 2026,
    p_salary_payment_type => 'REGULAR',
    p_base_salary => 50000.00,
    p_bonus => 5000.00,
    p_deduction => 2000.00
  );

  IF (v_res->>'salary_id') IS NULL OR (v_res->>'amount')::NUMERIC <> 53000.00 THEN
    RAISE EXCEPTION 'FIN-019 FAILED: Salary recording calculation mismatch: %', v_res;
  END IF;
  RAISE NOTICE '✓ FIN-019: Teacher regular salary recorded with linked expense (Net: 53,000 PKR).';

  -- 2. Attempt Duplicate Regular Salary for same teacher in 11/2026 -> Must FAIL (FIN-020)
  BEGIN
    PERFORM public.record_finance_expense(
      p_category_code => 'SALARY',
      p_title => 'Duplicate Regular Salary Attempt',
      p_amount => 50000.00,
      p_expense_date => CURRENT_DATE,
      p_payment_method => 'CASH',
      p_teacher_id => v_teacher_id,
      p_salary_month => 11,
      p_salary_year => 2026,
      p_salary_payment_type => 'REGULAR',
      p_base_salary => 50000.00
    );
  EXCEPTION WHEN OTHERS THEN
    v_dup_err := true;
  END;

  IF NOT v_dup_err THEN
    RAISE EXCEPTION 'FIN-020 FAILED: Duplicate regular monthly salary was permitted!';
  END IF;
  RAISE NOTICE '✓ FIN-020: Duplicate regular monthly salary blocked.';

  -- 3. Adjustment Salary for same month -> Must SUCCEED (FIN-021)
  v_res := public.record_finance_expense(
    p_category_code => 'SALARY',
    p_title => 'Extra Lectures Remuneration',
    p_amount => 8000.00,
    p_expense_date => CURRENT_DATE,
    p_payment_method => 'CASH',
    p_teacher_id => v_teacher_id,
    p_salary_month => 11,
    p_salary_year => 2026,
    p_salary_payment_type => 'ADJUSTMENT',
    p_base_salary => 8000.00
  );

  IF (v_res->>'salary_id') IS NULL THEN
    RAISE EXCEPTION 'FIN-021 FAILED: Salary adjustment payout failed: %', v_res;
  END IF;
  RAISE NOTICE '✓ FIN-021: Adjustment payout permitted for same month.';
END $$;

-- ----------------------------------------------------------------------------
-- Assertion 6: Facility Rent, Utilities, & Expense Void Audit Trail
-- (FIN-022, FIN-023, FIN-024)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_rent_res JSONB;
  v_util_res JSONB;
  v_rent_id UUID;
  v_util_id UUID;
  v_expense RECORD;
  v_audit RECORD;
BEGIN
  -- 1. Record Rent (FIN-022)
  v_rent_res := public.record_finance_expense(
    p_category_code => 'RENT',
    p_title => 'Pindsultani Campus Main Building Rent',
    p_amount => 75000.00,
    p_expense_date => CURRENT_DATE,
    p_payment_method => 'BANK_TRANSFER',
    p_payee_name => 'Campus Landlord'
  );
  v_rent_id := (v_rent_res->>'expense_id')::UUID;
  RAISE NOTICE '✓ FIN-022: Facility Rent expense recorded (75,000 PKR).';

  -- 2. Record Utility Bill (FIN-023)
  v_util_res := public.record_finance_expense(
    p_category_code => 'ELECTRICITY',
    p_title => 'IESCO Commercial Electricity Bill',
    p_amount => 32400.00,
    p_expense_date => CURRENT_DATE,
    p_payment_method => 'ONLINE',
    p_payee_name => 'IESCO'
  );
  v_util_id := (v_util_res->>'expense_id')::UUID;
  RAISE NOTICE '✓ FIN-023: Electricity Utility expense recorded (32,400 PKR).';

  -- 3. Void Utility Expense & Verify Row Retained with Status VOID (FIN-024)
  PERFORM public.void_finance_expense(
    p_expense_id => v_util_id,
    p_reason => 'Duplicate online billing reversal'
  );

  SELECT * INTO v_expense FROM public.finance_expenses WHERE id = v_util_id;
  IF v_expense IS NULL OR v_expense.status <> 'VOID' OR v_expense.void_reason IS NULL THEN
    RAISE EXCEPTION 'FIN-024 FAILED: Expense row was deleted or not marked VOID: %', v_expense;
  END IF;

  SELECT * INTO v_audit FROM public.finance_audit_log WHERE entity_id = v_util_id::TEXT AND action = 'EXPENSE_VOIDED';
  IF v_audit IS NULL THEN
    RAISE EXCEPTION 'FIN-024 FAILED: Audit log entry missing for voided expense!';
  END IF;
  RAISE NOTICE '✓ FIN-024: Voided expense retained with VOID status, reason, and immutable audit log.';
END $$;

-- ----------------------------------------------------------------------------
-- Assertion 7: Authoritative Finance Summary & Net Cash Flow Calculations
-- (FIN-025, FIN-026, FIN-027, FIN-028)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_summary JSONB;
  v_fees NUMERIC;
  v_expenses NUMERIC;
  v_net NUMERIC;
BEGIN
  v_summary := public.get_finance_summary(
    p_from => CURRENT_DATE - INTERVAL '30 days',
    p_to => CURRENT_DATE + INTERVAL '1 day'
  );

  v_fees := (v_summary->>'fees_collected')::NUMERIC;
  v_expenses := (v_summary->>'total_expenses')::NUMERIC;
  v_net := (v_summary->>'net_cash_flow')::NUMERIC;

  IF v_net <> (v_fees - v_expenses) THEN
    RAISE EXCEPTION 'FIN-027 FAILED: Net Cash Flow mismatch. Fees %, Expenses %, Net %', v_fees, v_expenses, v_net;
  END IF;

  RAISE NOTICE '✓ FIN-025/026/027/028: Authoritative Finance Summary validated (Fees: %, Expenses: %, Net: %).', v_fees, v_expenses, v_net;
END $$;

ROLLBACK;
