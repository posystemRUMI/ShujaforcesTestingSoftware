-- ============================================================================
-- Migration: 20260907210000_finance_module.sql
-- Description: Complete Admin Finance Module Schema, RLS, & Atomic RPCs
--   - Tables: fee_types, student_fee_accounts, student_fee_payments,
--             expense_categories, finance_expenses, teacher_salary_payments,
--             finance_audit_log
--   - Receipts: Sequential receipt generation (SFA-FEE-YYYY-XXXXXX)
--   - Storage: finance-receipts bucket (admin-only)
--   - RPCs: record_student_fee_payment, void_student_fee_payment,
--           update_student_fee_adjustment, waive_student_fee,
--           record_finance_expense, void_finance_expense,
--           generate_monthly_fees, get_finance_summary, get_finance_transactions
--   - Security: Strict Admin & service_role RLS isolation
-- Author: Antigravity
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FEE TYPES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fee_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Seed standard fee types
INSERT INTO public.fee_types (name, code, description, is_active)
VALUES
  ('Monthly Fee', 'MONTHLY', 'Standard recurring monthly tuition fee', true),
  ('Admission Fee', 'ADMISSION', 'One-time initial academy admission fee', true),
  ('Registration Fee', 'REGISTRATION', 'Registration and documentation charge', true),
  ('Test & Drill Fee', 'TEST', 'Computerized mock test series and drill fee', true),
  ('Study Material', 'MATERIAL', 'Uniform, books, handouts, and notes', true),
  ('Hostel Accommodation', 'HOSTEL', 'Boarding and lodging fee', true),
  ('Transport', 'TRANSPORT', 'Pick and drop academy transit service', true),
  ('Late Fee Fine', 'LATE_FEE', 'Penalty surcharge for overdue payment', true),
  ('Other Miscellaneous', 'OTHER', 'Uncategorized or custom financial fee', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 2. STUDENT FEE ACCOUNTS TABLE (Master Dues per Student & Period)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_fee_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  fee_period TEXT, -- e.g. "September 2026"
  fee_month INT CHECK (fee_month IS NULL OR (fee_month >= 1 AND fee_month <= 12)),
  fee_year INT NOT NULL,
  fee_type TEXT NOT NULL,
  amount_due NUMERIC(12,2) NOT NULL CHECK (amount_due >= 0),
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  fine_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (fine_amount >= 0),
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
  status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PARTIAL', 'PAID', 'WAIVED')),
  due_date DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Unique monthly fee rule per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_fee_monthly_uniq
  ON public.student_fee_accounts(student_id, fee_type, fee_month, fee_year)
  WHERE fee_month IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fee_accounts_student_id ON public.student_fee_accounts(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_accounts_status ON public.student_fee_accounts(status);
CREATE INDEX IF NOT EXISTS idx_fee_accounts_due_date ON public.student_fee_accounts(due_date);
CREATE INDEX IF NOT EXISTS idx_fee_accounts_period ON public.student_fee_accounts(fee_year, fee_month);

CREATE TRIGGER trg_student_fee_accounts_updated_at
  BEFORE UPDATE ON public.student_fee_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. RECEIPT NUMBER SEQUENCE & GENERATOR
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.receipt_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_val BIGINT;
  v_year TEXT;
BEGIN
  SELECT nextval('public.receipt_number_seq') INTO v_next_val;
  v_year := to_char(CURRENT_DATE, 'YYYY');
  RETURN 'SFA-FEE-' || v_year || '-' || lpad(v_next_val::TEXT, 6, '0');
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. STUDENT FEE PAYMENTS TABLE (Source of Truth for Cash Inflow)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_account_id UUID REFERENCES public.student_fee_accounts(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'ONLINE', 'CHEQUE', 'OTHER')),
  reference_number TEXT,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  received_by UUID NOT NULL REFERENCES public.profiles(id),
  notes TEXT,
  receipt_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VOID')),
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES public.profiles(id),
  void_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON public.student_fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_account_id ON public.student_fee_payments(fee_account_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_date ON public.student_fee_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_fee_payments_status ON public.student_fee_payments(status);

-- ----------------------------------------------------------------------------
-- 5. EXPENSE CATEGORIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO public.expense_categories (code, name, is_active)
VALUES
  ('SALARY', 'Teacher / Staff Salary', true),
  ('RENT', 'Academy Facility Rent', true),
  ('ELECTRICITY', 'Electricity Utility Bill', true),
  ('GAS', 'Gas Utility Bill', true),
  ('INTERNET', 'Internet & Communications', true),
  ('WATER', 'Water Utility Bill', true),
  ('STATIONERY', 'Printing & Stationery', true),
  ('MAINTENANCE', 'Building Repairs & Maintenance', true),
  ('EQUIPMENT', 'Computers & Academy Equipment', true),
  ('MARKETING', 'Marketing, Banners & Ads', true),
  ('TRANSPORT', 'Transport & Vehicle Fuel', true),
  ('REFRESHMENTS', 'Cadet Refreshments & Messing', true),
  ('OTHER', 'General Miscellaneous Expenses', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 6. FINANCE EXPENSES TABLE (Central Cash Outflow Register)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  category_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'ONLINE', 'CHEQUE', 'OTHER')),
  reference_number TEXT,
  payee_name TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  receipt_url TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_period TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VOID')),
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES public.profiles(id),
  void_reason TEXT,
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_finance_expenses_date ON public.finance_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_category ON public.finance_expenses(category_code);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_teacher ON public.finance_expenses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_status ON public.finance_expenses(status);

CREATE TRIGGER trg_finance_expenses_updated_at
  BEFORE UPDATE ON public.finance_expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. TEACHER SALARY PAYMENTS TABLE (Linked to Expenses)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  expense_id UUID NOT NULL REFERENCES public.finance_expenses(id) ON DELETE CASCADE,
  salary_month INT NOT NULL CHECK (salary_month >= 1 AND salary_month <= 12),
  salary_year INT NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'REGULAR' CHECK (payment_type IN ('REGULAR', 'BONUS', 'ADJUSTMENT')),
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (base_salary >= 0),
  bonus NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (bonus >= 0),
  deduction NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (deduction >= 0),
  net_paid NUMERIC(12,2) NOT NULL CHECK (net_paid > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'VOID')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Unique index prevents duplicate regular salary for same teacher + month + year
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_salary_regular_uniq
  ON public.teacher_salary_payments(teacher_profile_id, salary_month, salary_year, payment_type)
  WHERE status = 'ACTIVE' AND payment_type = 'REGULAR';

CREATE INDEX IF NOT EXISTS idx_teacher_salary_profile ON public.teacher_salary_payments(teacher_profile_id);
CREATE INDEX IF NOT EXISTS idx_teacher_salary_period ON public.teacher_salary_payments(salary_year, salary_month);

-- ----------------------------------------------------------------------------
-- 8. FINANCE AUDIT LOG TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  performed_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_finance_audit_entity ON public.finance_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_finance_audit_created ON public.finance_audit_log(created_at);

-- ----------------------------------------------------------------------------
-- 9. STORAGE BUCKET FOR FINANCE ATTACHMENTS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'finance-receipts',
  'finance-receipts',
  false,
  10485760, -- 10 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "finance_receipts_admin_all" ON storage.objects;
CREATE POLICY "finance_receipts_admin_all"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'finance-receipts'
    AND (public.is_admin() OR auth.role() = 'service_role')
  )
  WITH CHECK (
    bucket_id = 'finance-receipts'
    AND (public.is_admin() OR auth.role() = 'service_role')
  );

-- ----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY ON ALL FINANCE TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE public.fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_audit_log ENABLE ROW LEVEL SECURITY;

-- Pure Admin & service_role access only
DROP POLICY IF EXISTS "fee_types_admin_manage" ON public.fee_types;
CREATE POLICY "fee_types_admin_manage" ON public.fee_types
  FOR ALL TO authenticated
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "student_fee_accounts_admin_manage" ON public.student_fee_accounts;
CREATE POLICY "student_fee_accounts_admin_manage" ON public.student_fee_accounts
  FOR ALL TO authenticated
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "student_fee_payments_admin_manage" ON public.student_fee_payments;
CREATE POLICY "student_fee_payments_admin_manage" ON public.student_fee_payments
  FOR ALL TO authenticated
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "expense_categories_admin_manage" ON public.expense_categories;
CREATE POLICY "expense_categories_admin_manage" ON public.expense_categories
  FOR ALL TO authenticated
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "finance_expenses_admin_manage" ON public.finance_expenses;
CREATE POLICY "finance_expenses_admin_manage" ON public.finance_expenses
  FOR ALL TO authenticated
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "teacher_salary_payments_admin_manage" ON public.teacher_salary_payments;
CREATE POLICY "teacher_salary_payments_admin_manage" ON public.teacher_salary_payments
  FOR ALL TO authenticated
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "finance_audit_log_admin_manage" ON public.finance_audit_log;
CREATE POLICY "finance_audit_log_admin_manage" ON public.finance_audit_log
  FOR ALL TO authenticated
  USING (public.is_admin() OR auth.role() = 'service_role')
  WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 11. RPC: RECORD STUDENT FEE PAYMENT (Atomic)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_student_fee_payment(
  p_student_id UUID,
  p_fee_account_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_reference_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_student RECORD;
  v_account RECORD;
  v_net_due NUMERIC(12,2);
  v_remaining NUMERIC(12,2);
  v_new_paid NUMERIC(12,2);
  v_new_status TEXT;
  v_receipt_no TEXT;
  v_payment_id UUID;
BEGIN
  -- 1. Verify admin authorization
  IF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  v_admin_id := COALESCE(auth.uid(), 'a0000000-0000-0000-0000-000000000001'::uuid);

  -- 2. Validate student exists
  SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Student not found.';
  END IF;

  -- 3. Validate payment amount
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero.';
  END IF;

  -- 4. Validate payment method
  IF p_payment_method NOT IN ('CASH', 'BANK_TRANSFER', 'ONLINE', 'CHEQUE', 'OTHER') THEN
    RAISE EXCEPTION 'Invalid payment method: %', p_payment_method;
  END IF;

  -- 5. Validate fee account and overpayment protection
  IF p_fee_account_id IS NOT NULL THEN
    SELECT * INTO v_account FROM public.student_fee_accounts WHERE id = p_fee_account_id FOR UPDATE;
    IF v_account IS NULL THEN
      RAISE EXCEPTION 'Fee account not found.';
    END IF;
    IF v_account.student_id <> p_student_id THEN
      RAISE EXCEPTION 'Fee account does not belong to specified student.';
    END IF;

    v_net_due := v_account.amount_due - v_account.discount_amount + v_account.fine_amount;
    v_remaining := v_net_due - v_account.amount_paid;

    IF p_amount > v_remaining THEN
      RAISE EXCEPTION 'Overpayment not permitted. Outstanding balance is % but attempted payment is %', v_remaining, p_amount;
    END IF;

    v_new_paid := v_account.amount_paid + p_amount;
    v_new_status := CASE WHEN (v_net_due - v_new_paid) <= 0 THEN 'PAID' ELSE 'PARTIAL' END;
  END IF;

  -- 6. Generate human-readable receipt number
  v_receipt_no := public.generate_receipt_number();

  -- 7. Insert payment record
  INSERT INTO public.student_fee_payments (
    student_id,
    fee_account_id,
    amount,
    payment_method,
    reference_number,
    payment_date,
    received_by,
    notes,
    receipt_number,
    status
  ) VALUES (
    p_student_id,
    p_fee_account_id,
    p_amount,
    p_payment_method,
    p_reference_number,
    timezone('utc', now()),
    v_admin_id,
    p_notes,
    v_receipt_no,
    'ACTIVE'
  ) RETURNING id INTO v_payment_id;

  -- 8. Transactionally update fee account balance & status
  IF p_fee_account_id IS NOT NULL THEN
    UPDATE public.student_fee_accounts
    SET amount_paid = v_new_paid,
        status = v_new_status,
        updated_at = timezone('utc', now())
    WHERE id = p_fee_account_id;
  END IF;

  -- 9. Record audit event
  INSERT INTO public.finance_audit_log (
    entity_type,
    entity_id,
    action,
    old_data,
    new_data,
    performed_by
  ) VALUES (
    'STUDENT_FEE_PAYMENT',
    v_payment_id::TEXT,
    'PAYMENT_RECORDED',
    NULL,
    jsonb_build_object(
      'payment_id', v_payment_id,
      'student_id', p_student_id,
      'fee_account_id', p_fee_account_id,
      'amount', p_amount,
      'receipt_number', v_receipt_no,
      'payment_method', p_payment_method,
      'new_account_status', v_new_status,
      'new_amount_paid', v_new_paid
    ),
    v_admin_id
  );

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'receipt_number', v_receipt_no,
    'amount', p_amount,
    'fee_account_id', p_fee_account_id,
    'amount_paid', v_new_paid,
    'remaining_balance', GREATEST(0, COALESCE(v_net_due, 0) - COALESCE(v_new_paid, 0)),
    'status', v_new_status
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 12. RPC: VOID STUDENT FEE PAYMENT (Atomic & Audited)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.void_student_fee_payment(
  p_payment_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_payment RECORD;
  v_account RECORD;
  v_total_active_paid NUMERIC(12,2) := 0.00;
  v_net_due NUMERIC(12,2);
  v_new_status TEXT;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  v_admin_id := COALESCE(auth.uid(), 'a0000000-0000-0000-0000-000000000001'::uuid);

  SELECT * INTO v_payment FROM public.student_fee_payments WHERE id = p_payment_id FOR UPDATE;
  IF v_payment IS NULL THEN
    RAISE EXCEPTION 'Fee payment record not found.';
  END IF;
  IF v_payment.status = 'VOID' THEN
    RAISE EXCEPTION 'This payment has already been voided.';
  END IF;

  -- 1. Void payment record
  UPDATE public.student_fee_payments
  SET status = 'VOID',
      voided_at = timezone('utc', now()),
      voided_by = v_admin_id,
      void_reason = p_reason
  WHERE id = p_payment_id;

  -- 2. Recompute fee account balance from remaining active payments
  IF v_payment.fee_account_id IS NOT NULL THEN
    SELECT * INTO v_account FROM public.student_fee_accounts WHERE id = v_payment.fee_account_id FOR UPDATE;

    SELECT COALESCE(SUM(amount), 0) INTO v_total_active_paid
    FROM public.student_fee_payments
    WHERE fee_account_id = v_payment.fee_account_id AND status = 'ACTIVE';

    v_net_due := v_account.amount_due - v_account.discount_amount + v_account.fine_amount;

    v_new_status := CASE
      WHEN v_total_active_paid = 0 THEN 'UNPAID'
      WHEN (v_net_due - v_total_active_paid) <= 0 THEN 'PAID'
      ELSE 'PARTIAL'
    END;

    UPDATE public.student_fee_accounts
    SET amount_paid = v_total_active_paid,
        status = v_new_status,
        updated_at = timezone('utc', now())
    WHERE id = v_payment.fee_account_id;
  END IF;

  -- 3. Log audit event
  INSERT INTO public.finance_audit_log (
    entity_type, entity_id, action, old_data, new_data, performed_by
  ) VALUES (
    'STUDENT_FEE_PAYMENT',
    p_payment_id::TEXT,
    'FEE_PAYMENT_VOIDED',
    jsonb_build_object('status', 'ACTIVE', 'amount', v_payment.amount),
    jsonb_build_object('status', 'VOID', 'reason', p_reason, 'recalculated_paid', v_total_active_paid),
    v_admin_id
  );

  RETURN jsonb_build_object(
    'payment_id', p_payment_id,
    'status', 'VOID',
    'void_reason', p_reason,
    'recalculated_paid', v_total_active_paid,
    'account_status', v_new_status
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 13. RPC: UPDATE STUDENT FEE ADJUSTMENT (Discount / Fine)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_student_fee_adjustment(
  p_fee_account_id UUID,
  p_discount_amount NUMERIC,
  p_fine_amount NUMERIC,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_account RECORD;
  v_net_due NUMERIC(12,2);
  v_new_status TEXT;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  v_admin_id := COALESCE(auth.uid(), 'a0000000-0000-0000-0000-000000000001'::uuid);

  SELECT * INTO v_account FROM public.student_fee_accounts WHERE id = p_fee_account_id FOR UPDATE;
  IF v_account IS NULL THEN
    RAISE EXCEPTION 'Fee account not found.';
  END IF;

  IF p_discount_amount < 0 OR p_fine_amount < 0 THEN
    RAISE EXCEPTION 'Discount and fine amounts cannot be negative.';
  END IF;

  v_net_due := v_account.amount_due - p_discount_amount + p_fine_amount;
  IF v_net_due < 0 THEN
    RAISE EXCEPTION 'Discount cannot exceed base fee amount.';
  END IF;
  IF v_net_due < v_account.amount_paid THEN
    RAISE EXCEPTION 'Net fee due cannot be reduced below the amount already collected (%).', v_account.amount_paid;
  END IF;

  v_new_status := CASE
    WHEN v_account.status = 'WAIVED' THEN 'WAIVED'
    WHEN (v_net_due - v_account.amount_paid) <= 0 THEN 'PAID'
    WHEN v_account.amount_paid > 0 THEN 'PARTIAL'
    ELSE 'UNPAID'
  END;

  UPDATE public.student_fee_accounts
  SET discount_amount = p_discount_amount,
      fine_amount = p_fine_amount,
      status = v_new_status,
      notes = CASE WHEN p_reason IS NOT NULL THEN COALESCE(notes || E'\n', '') || 'Adjustment: ' || p_reason ELSE notes END,
      updated_at = timezone('utc', now())
  WHERE id = p_fee_account_id;

  INSERT INTO public.finance_audit_log (
    entity_type, entity_id, action, old_data, new_data, performed_by
  ) VALUES (
    'STUDENT_FEE_ACCOUNT',
    p_fee_account_id::TEXT,
    'FEE_ADJUSTED',
    jsonb_build_object('discount', v_account.discount_amount, 'fine', v_account.fine_amount),
    jsonb_build_object('discount', p_discount_amount, 'fine', p_fine_amount, 'reason', p_reason),
    v_admin_id
  );

  RETURN jsonb_build_object(
    'fee_account_id', p_fee_account_id,
    'discount_amount', p_discount_amount,
    'fine_amount', p_fine_amount,
    'net_due', v_net_due,
    'status', v_new_status
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 14. RPC: WAIVE STUDENT FEE (Admin Only)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.waive_student_fee(
  p_fee_account_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_account RECORD;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  v_admin_id := COALESCE(auth.uid(), 'a0000000-0000-0000-0000-000000000001'::uuid);

  SELECT * INTO v_account FROM public.student_fee_accounts WHERE id = p_fee_account_id FOR UPDATE;
  IF v_account IS NULL THEN
    RAISE EXCEPTION 'Fee account not found.';
  END IF;

  UPDATE public.student_fee_accounts
  SET status = 'WAIVED',
      notes = COALESCE(notes || E'\n', '') || 'Waived by Admin: ' || p_reason,
      updated_at = timezone('utc', now())
  WHERE id = p_fee_account_id;

  INSERT INTO public.finance_audit_log (
    entity_type, entity_id, action, old_data, new_data, performed_by
  ) VALUES (
    'STUDENT_FEE_ACCOUNT',
    p_fee_account_id::TEXT,
    'FEE_WAIVED',
    jsonb_build_object('previous_status', v_account.status),
    jsonb_build_object('status', 'WAIVED', 'reason', p_reason),
    v_admin_id
  );

  RETURN jsonb_build_object(
    'fee_account_id', p_fee_account_id,
    'status', 'WAIVED',
    'reason', p_reason
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 15. RPC: RECORD FINANCE EXPENSE (General, Rent, Utilities, & Salary)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_finance_expense(
  p_category_code TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT 0,
  p_expense_date DATE DEFAULT CURRENT_DATE,
  p_payment_method TEXT DEFAULT 'CASH',
  p_reference_number TEXT DEFAULT NULL,
  p_payee_name TEXT DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL,
  p_receipt_url TEXT DEFAULT NULL,
  p_is_recurring BOOLEAN DEFAULT false,
  p_recurring_period TEXT DEFAULT NULL,
  p_salary_month INT DEFAULT NULL,
  p_salary_year INT DEFAULT NULL,
  p_salary_payment_type TEXT DEFAULT 'REGULAR',
  p_base_salary NUMERIC DEFAULT 0.00,
  p_bonus NUMERIC DEFAULT 0.00,
  p_deduction NUMERIC DEFAULT 0.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_category RECORD;
  v_teacher RECORD;
  v_teacher_name TEXT := NULL;
  v_expense_id UUID;
  v_salary_id UUID := NULL;
  v_net_salary NUMERIC(12,2);
  v_title TEXT := p_title;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  v_admin_id := COALESCE(auth.uid(), 'a0000000-0000-0000-0000-000000000001'::uuid);

  -- 1. Validate Category
  SELECT * INTO v_category FROM public.expense_categories WHERE code = p_category_code;
  IF v_category IS NULL THEN
    RAISE EXCEPTION 'Expense category "%" not found.', p_category_code;
  END IF;

  -- 2. Validate Amount
  IF p_amount <= 0 AND (p_category_code <> 'SALARY' OR (p_base_salary + p_bonus - p_deduction) <= 0) THEN
    RAISE EXCEPTION 'Expense amount must be greater than zero.';
  END IF;

  -- 3. Salary Specialization & Duplicate Protection
  IF p_category_code = 'SALARY' THEN
    IF p_teacher_id IS NULL THEN
      RAISE EXCEPTION 'Teacher selection is required for salary expenses.';
    END IF;

    SELECT * INTO v_teacher FROM public.profiles WHERE id = p_teacher_id AND role = 'TEACHER';
    IF v_teacher IS NULL THEN
      RAISE EXCEPTION 'Valid teacher profile not found.';
    END IF;
    v_teacher_name := v_teacher.display_name;

    IF p_salary_month IS NULL OR p_salary_month < 1 OR p_salary_month > 12 OR p_salary_year IS NULL THEN
      RAISE EXCEPTION 'Valid salary month (1-12) and year are required.';
    END IF;

    v_net_salary := p_base_salary + p_bonus - p_deduction;
    IF v_net_salary <= 0 THEN
      RAISE EXCEPTION 'Net salary amount must be greater than zero.';
    END IF;

    -- Enforce duplicate protection on REGULAR salary payments
    IF p_salary_payment_type = 'REGULAR' THEN
      IF EXISTS (
        SELECT 1 FROM public.teacher_salary_payments
        WHERE teacher_profile_id = p_teacher_id
          AND salary_month = p_salary_month
          AND salary_year = p_salary_year
          AND payment_type = 'REGULAR'
          AND status = 'ACTIVE'
      ) THEN
        RAISE EXCEPTION 'Duplicate regular salary: A salary payment has already been recorded for this teacher for %/%. Use ADJUSTMENT or BONUS for additional payouts.', p_salary_month, p_salary_year;
      END IF;
    END IF;

    IF v_title IS NULL OR trim(v_title) = '' THEN
      v_title := 'Salary - ' || v_teacher.display_name || ' (' || p_salary_month || '/' || p_salary_year || ')';
    END IF;
  END IF;

  -- 4. Insert expense register entry
  INSERT INTO public.finance_expenses (
    expense_category_id,
    category_code,
    title,
    description,
    amount,
    expense_date,
    payment_method,
    reference_number,
    payee_name,
    teacher_id,
    receipt_url,
    is_recurring,
    recurring_period,
    status,
    recorded_by
  ) VALUES (
    v_category.id,
    p_category_code,
    v_title,
    p_description,
    CASE WHEN p_category_code = 'SALARY' THEN v_net_salary ELSE p_amount END,
    p_expense_date,
    p_payment_method,
    p_reference_number,
    CASE WHEN p_category_code = 'SALARY' THEN v_teacher_name ELSE p_payee_name END,
    p_teacher_id,
    p_receipt_url,
    p_is_recurring,
    p_recurring_period,
    'ACTIVE',
    v_admin_id
  ) RETURNING id INTO v_expense_id;

  -- 5. Insert linked salary payment if applicable
  IF p_category_code = 'SALARY' THEN
    INSERT INTO public.teacher_salary_payments (
      teacher_profile_id,
      expense_id,
      salary_month,
      salary_year,
      payment_type,
      base_salary,
      bonus,
      deduction,
      net_paid,
      payment_date,
      notes,
      status
    ) VALUES (
      p_teacher_id,
      v_expense_id,
      p_salary_month,
      p_salary_year,
      p_salary_payment_type,
      p_base_salary,
      p_bonus,
      p_deduction,
      v_net_salary,
      p_expense_date,
      p_description,
      'ACTIVE'
    ) RETURNING id INTO v_salary_id;
  END IF;

  -- 6. Log audit event
  INSERT INTO public.finance_audit_log (
    entity_type, entity_id, action, old_data, new_data, performed_by
  ) VALUES (
    'FINANCE_EXPENSE',
    v_expense_id::TEXT,
    CASE WHEN p_category_code = 'SALARY' THEN 'SALARY_RECORDED' ELSE 'EXPENSE_CREATED' END,
    NULL,
    jsonb_build_object(
      'expense_id', v_expense_id,
      'category', p_category_code,
      'amount', CASE WHEN p_category_code = 'SALARY' THEN v_net_salary ELSE p_amount END,
      'payee', CASE WHEN p_category_code = 'SALARY' THEN v_teacher_name ELSE p_payee_name END,
      'salary_payment_id', v_salary_id
    ),
    v_admin_id
  );

  RETURN jsonb_build_object(
    'expense_id', v_expense_id,
    'salary_id', v_salary_id,
    'category_code', p_category_code,
    'amount', CASE WHEN p_category_code = 'SALARY' THEN v_net_salary ELSE p_amount END,
    'status', 'ACTIVE'
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 16. RPC: VOID FINANCE EXPENSE (Atomic & Audited)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.void_finance_expense(
  p_expense_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_expense RECORD;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  v_admin_id := COALESCE(auth.uid(), 'a0000000-0000-0000-0000-000000000001'::uuid);

  SELECT * INTO v_expense FROM public.finance_expenses WHERE id = p_expense_id FOR UPDATE;
  IF v_expense IS NULL THEN
    RAISE EXCEPTION 'Expense record not found.';
  END IF;
  IF v_expense.status = 'VOID' THEN
    RAISE EXCEPTION 'This expense is already voided.';
  END IF;

  -- 1. Void expense record
  UPDATE public.finance_expenses
  SET status = 'VOID',
      voided_at = timezone('utc', now()),
      voided_by = v_admin_id,
      void_reason = p_reason
  WHERE id = p_expense_id;

  -- 2. Void linked salary payment if present
  UPDATE public.teacher_salary_payments
  SET status = 'VOID'
  WHERE expense_id = p_expense_id;

  -- 3. Log audit event
  INSERT INTO public.finance_audit_log (
    entity_type, entity_id, action, old_data, new_data, performed_by
  ) VALUES (
    'FINANCE_EXPENSE',
    p_expense_id::TEXT,
    'EXPENSE_VOIDED',
    jsonb_build_object('amount', v_expense.amount, 'category', v_expense.category_code),
    jsonb_build_object('status', 'VOID', 'reason', p_reason),
    v_admin_id
  );

  RETURN jsonb_build_object(
    'expense_id', p_expense_id,
    'status', 'VOID',
    'void_reason', p_reason
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 17. RPC: GENERATE MONTHLY FEES (Batch Generation)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_monthly_fees(
  p_fee_month INT,
  p_fee_year INT,
  p_fee_period TEXT,
  p_fee_type TEXT DEFAULT 'MONTHLY',
  p_amount NUMERIC DEFAULT 0,
  p_due_date DATE DEFAULT NULL,
  p_force_id UUID DEFAULT NULL,
  p_course_id UUID DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_student RECORD;
  v_created_count INT := 0;
  v_skipped_count INT := 0;
  v_total_eligible INT := 0;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  v_admin_id := COALESCE(auth.uid(), 'a0000000-0000-0000-0000-000000000001'::uuid);

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Fee amount must be greater than zero.';
  END IF;

  FOR v_student IN
    SELECT s.id, s.target_course_id, be.batch_id
    FROM public.students s
    LEFT JOIN (
      SELECT DISTINCT ON (student_id) student_id, batch_id
      FROM public.batch_enrollments
      WHERE status = 'ACTIVE'
      ORDER BY student_id, enrolled_at DESC
    ) be ON be.student_id = s.id
    WHERE s.status = 'ACTIVE'
      AND (p_force_id IS NULL OR s.target_force_id = p_force_id)
      AND (p_course_id IS NULL OR s.target_course_id = p_course_id)
      AND (p_batch_id IS NULL OR be.batch_id = p_batch_id)
  LOOP
    v_total_eligible := v_total_eligible + 1;

    -- Avoid duplicate fee accounts for the same student + fee_type + month + year
    IF EXISTS (
      SELECT 1 FROM public.student_fee_accounts
      WHERE student_id = v_student.id
        AND fee_type = p_fee_type
        AND fee_month = p_fee_month
        AND fee_year = p_fee_year
    ) THEN
      v_skipped_count := v_skipped_count + 1;
    ELSE
      INSERT INTO public.student_fee_accounts (
        student_id,
        course_id,
        batch_id,
        fee_period,
        fee_month,
        fee_year,
        fee_type,
        amount_due,
        discount_amount,
        fine_amount,
        amount_paid,
        status,
        due_date,
        created_by
      ) VALUES (
        v_student.id,
        v_student.target_course_id,
        v_student.batch_id,
        p_fee_period,
        p_fee_month,
        p_fee_year,
        p_fee_type,
        p_amount,
        0.00,
        0.00,
        0.00,
        'UNPAID',
        p_due_date,
        v_admin_id
      );
      v_created_count := v_created_count + 1;
    END IF;
  END LOOP;

  INSERT INTO public.finance_audit_log (
    entity_type, entity_id, action, old_data, new_data, performed_by
  ) VALUES (
    'STUDENT_FEE_ACCOUNT',
    'BATCH_' || p_fee_year || '_' || p_fee_month,
    'FEES_GENERATED',
    NULL,
    jsonb_build_object(
      'created_count', v_created_count,
      'skipped_count', v_skipped_count,
      'fee_period', p_fee_period,
      'amount', p_amount
    ),
    v_admin_id
  );

  RETURN jsonb_build_object(
    'created_count', v_created_count,
    'skipped_count', v_skipped_count,
    'total_eligible', v_total_eligible,
    'period', p_fee_period
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 18. RPC: GET FINANCE SUMMARY (Authoritative Totals & Cash Flow)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_finance_summary(
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from DATE;
  v_to DATE;
  v_fees_collected NUMERIC(12,2) := 0.00;
  v_outstanding_fees NUMERIC(12,2) := 0.00;
  v_salary_expenses NUMERIC(12,2) := 0.00;
  v_rent_expenses NUMERIC(12,2) := 0.00;
  v_utility_expenses NUMERIC(12,2) := 0.00;
  v_other_expenses NUMERIC(12,2) := 0.00;
  v_total_expenses NUMERIC(12,2) := 0.00;
  v_net_cash_flow NUMERIC(12,2) := 0.00;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  -- Default to current calendar month if bounds omitted
  v_from := COALESCE(p_from, date_trunc('month', CURRENT_DATE)::DATE);
  v_to := COALESCE(p_to, (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::DATE);

  -- 1. Fees Collected in date range
  SELECT COALESCE(SUM(amount), 0.00) INTO v_fees_collected
  FROM public.student_fee_payments
  WHERE status = 'ACTIVE'
    AND payment_date::DATE >= v_from
    AND payment_date::DATE <= v_to;

  -- 2. Total Outstanding Fees across all active accounts
  SELECT COALESCE(SUM(amount_due - discount_amount + fine_amount - amount_paid), 0.00) INTO v_outstanding_fees
  FROM public.student_fee_accounts
  WHERE status IN ('UNPAID', 'PARTIAL');

  -- 3. Salary Expenses
  SELECT COALESCE(SUM(amount), 0.00) INTO v_salary_expenses
  FROM public.finance_expenses
  WHERE status = 'ACTIVE'
    AND category_code = 'SALARY'
    AND expense_date >= v_from
    AND expense_date <= v_to;

  -- 4. Rent Expenses
  SELECT COALESCE(SUM(amount), 0.00) INTO v_rent_expenses
  FROM public.finance_expenses
  WHERE status = 'ACTIVE'
    AND category_code = 'RENT'
    AND expense_date >= v_from
    AND expense_date <= v_to;

  -- 5. Utilities (Electricity, Gas, Internet, Water)
  SELECT COALESCE(SUM(amount), 0.00) INTO v_utility_expenses
  FROM public.finance_expenses
  WHERE status = 'ACTIVE'
    AND category_code IN ('ELECTRICITY', 'GAS', 'INTERNET', 'WATER')
    AND expense_date >= v_from
    AND expense_date <= v_to;

  -- 6. Other Expenses
  SELECT COALESCE(SUM(amount), 0.00) INTO v_other_expenses
  FROM public.finance_expenses
  WHERE status = 'ACTIVE'
    AND category_code NOT IN ('SALARY', 'RENT', 'ELECTRICITY', 'GAS', 'INTERNET', 'WATER')
    AND expense_date >= v_from
    AND expense_date <= v_to;

  -- 7. Total Expenses
  v_total_expenses := v_salary_expenses + v_rent_expenses + v_utility_expenses + v_other_expenses;

  -- 8. Net Cash Flow
  v_net_cash_flow := v_fees_collected - v_total_expenses;

  RETURN jsonb_build_object(
    'fees_collected', v_fees_collected,
    'outstanding_fees', v_outstanding_fees,
    'salary_expenses', v_salary_expenses,
    'rent_expenses', v_rent_expenses,
    'utility_expenses', v_utility_expenses,
    'other_expenses', v_other_expenses,
    'total_expenses', v_total_expenses,
    'net_cash_flow', v_net_cash_flow,
    'from_date', v_from,
    'to_date', v_to
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 19. RPC: GET FINANCE TRANSACTIONS (Unified Ledger)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_finance_transactions(
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from DATE;
  v_to DATE;
  v_transactions JSONB := '[]'::jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Admin role required.';
  END IF;

  v_from := COALESCE(p_from, date_trunc('month', CURRENT_DATE)::DATE);
  v_to := COALESCE(p_to, (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::DATE);

  WITH combined_ledger AS (
    -- Income Rows (Fee Payments)
    SELECT
      p.id AS transaction_id,
      'INCOME' AS transaction_type,
      COALESCE(fa.fee_type, 'FEE') AS category,
      COALESCE(ft.name, 'Student Fee') AS category_name,
      p.payment_date AS transaction_date,
      p.payment_date::DATE AS sort_date,
      prof.display_name AS party_name,
      s.roll_number AS party_ref,
      COALESCE(fa.fee_period, 'General Fee') AS description,
      p.amount,
      p.payment_method,
      p.reference_number,
      p.receipt_number,
      p.status,
      rec_prof.display_name AS recorded_by_name,
      p.created_at
    FROM public.student_fee_payments p
    JOIN public.students s ON s.id = p.student_id
    JOIN public.profiles prof ON prof.id = s.profile_id
    LEFT JOIN public.student_fee_accounts fa ON fa.id = p.fee_account_id
    LEFT JOIN public.fee_types ft ON ft.code = fa.fee_type
    LEFT JOIN public.profiles rec_prof ON rec_prof.id = p.received_by
    WHERE p.payment_date::DATE >= v_from AND p.payment_date::DATE <= v_to
      AND (p_type IS NULL OR p_type = 'INCOME')
      AND (p_category IS NULL OR fa.fee_type = p_category OR p_category = 'ALL')

    UNION ALL

    -- Expense Rows
    SELECT
      e.id AS transaction_id,
      'EXPENSE' AS transaction_type,
      e.category_code AS category,
      ec.name AS category_name,
      e.created_at AS transaction_date,
      e.expense_date AS sort_date,
      COALESCE(e.payee_name, tp.display_name, 'Vendor/Payee') AS party_name,
      COALESCE(t.service_number, e.reference_number, '-') AS party_ref,
      e.title AS description,
      e.amount,
      e.payment_method,
      e.reference_number,
      NULL AS receipt_number,
      e.status,
      rec_prof.display_name AS recorded_by_name,
      e.created_at
    FROM public.finance_expenses e
    JOIN public.expense_categories ec ON ec.code = e.category_code
    LEFT JOIN public.profiles tp ON tp.id = e.teacher_id
    LEFT JOIN public.teachers t ON t.profile_id = e.teacher_id
    LEFT JOIN public.profiles rec_prof ON rec_prof.id = e.recorded_by
    WHERE e.expense_date >= v_from AND e.expense_date <= v_to
      AND (p_type IS NULL OR p_type = 'EXPENSE')
      AND (p_category IS NULL OR e.category_code = p_category OR p_category = 'ALL')
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'transaction_id', cl.transaction_id,
        'transaction_type', cl.transaction_type,
        'category', cl.category,
        'category_name', cl.category_name,
        'date', cl.transaction_date,
        'sort_date', cl.sort_date,
        'party_name', cl.party_name,
        'party_ref', cl.party_ref,
        'description', cl.description,
        'amount', cl.amount,
        'payment_method', cl.payment_method,
        'reference_number', cl.reference_number,
        'receipt_number', cl.receipt_number,
        'status', cl.status,
        'recorded_by_name', cl.recorded_by_name
      )
      ORDER BY cl.sort_date DESC, cl.created_at DESC
    ),
    '[]'::jsonb
  ) INTO v_transactions
  FROM combined_ledger cl;

  RETURN v_transactions;
END;
$$;
