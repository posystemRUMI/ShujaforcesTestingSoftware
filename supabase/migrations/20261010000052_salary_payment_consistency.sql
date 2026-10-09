BEGIN;
ALTER TABLE public.teacher_salary_payments ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS teacher_salary_one_active_month ON teacher_salary_payments(teacher_profile_id,salary_year,salary_month) WHERE status='ACTIVE';

CREATE OR REPLACE FUNCTION public.salary_payment_validate() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.salary_year<1900 OR NEW.salary_year>9999 THEN RAISE EXCEPTION 'Valid salary year required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM profiles p WHERE p.id=NEW.teacher_profile_id AND (p.role='TEACHER' OR EXISTS(SELECT 1 FROM teachers t WHERE t.profile_id=p.id))) THEN RAISE EXCEPTION 'Valid faculty profile required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM finance_expenses WHERE id=NEW.expense_id AND category_code='SALARY' AND teacher_id=NEW.teacher_profile_id) THEN RAISE EXCEPTION 'Matching linked salary expense required'; END IF;
 NEW.net_paid:=NEW.base_salary+NEW.bonus-NEW.deduction;
 IF NEW.net_paid<=0 THEN RAISE EXCEPTION 'Net payable salary must be greater than zero'; END IF;
 IF NEW.status='ACTIVE' AND EXISTS(SELECT 1 FROM teacher_salary_payments WHERE teacher_profile_id=NEW.teacher_profile_id AND salary_month=NEW.salary_month AND salary_year=NEW.salary_year AND status='ACTIVE' AND id<>NEW.id) THEN
  RAISE EXCEPTION 'This teacher is already paid for %/%. Edit the saved salary payment instead.',NEW.salary_month,NEW.salary_year;
 END IF;
 NEW.updated_at:=clock_timestamp();RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS salary_payment_validate ON teacher_salary_payments;
CREATE TRIGGER salary_payment_validate BEFORE INSERT OR UPDATE ON teacher_salary_payments FOR EACH ROW EXECUTE FUNCTION salary_payment_validate();

CREATE OR REPLACE FUNCTION public.salary_payment_sync_expense() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE finance_expenses SET amount=NEW.net_paid,description=NEW.notes,status=NEW.status,expense_date=NEW.payment_date
 WHERE id=NEW.expense_id AND (amount,description,status,expense_date) IS DISTINCT FROM (NEW.net_paid,NEW.notes,NEW.status,NEW.payment_date);
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS salary_payment_sync_expense ON teacher_salary_payments;
CREATE TRIGGER salary_payment_sync_expense AFTER INSERT OR UPDATE ON teacher_salary_payments FOR EACH ROW EXECUTE FUNCTION salary_payment_sync_expense();

CREATE OR REPLACE FUNCTION public.salary_expense_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM teacher_salary_payments WHERE expense_id=NEW.id AND (NEW.category_code<>'SALARY' OR teacher_profile_id IS DISTINCT FROM NEW.teacher_id)) THEN
  RAISE EXCEPTION 'The linked salary expense must retain its salary category and teacher';
 END IF;
 IF EXISTS(SELECT 1 FROM teacher_salary_payments WHERE expense_id=NEW.id AND net_paid IS DISTINCT FROM NEW.amount) THEN
  RAISE EXCEPTION 'Edit the linked salary payment to change its amount';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS salary_expense_guard ON finance_expenses;
CREATE TRIGGER salary_expense_guard BEFORE UPDATE OF amount,category_code,teacher_id ON finance_expenses FOR EACH ROW EXECUTE FUNCTION salary_expense_guard();

CREATE OR REPLACE FUNCTION public.salary_expense_sync() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE teacher_salary_payments SET status=NEW.status,payment_date=NEW.expense_date,notes=NEW.description
 WHERE expense_id=NEW.id AND (status,payment_date,notes) IS DISTINCT FROM (NEW.status,NEW.expense_date,NEW.description);
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS salary_expense_sync ON finance_expenses;
CREATE TRIGGER salary_expense_sync AFTER UPDATE OF status,expense_date,description ON finance_expenses FOR EACH ROW EXECUTE FUNCTION salary_expense_sync();

CREATE OR REPLACE FUNCTION public.finance_update_salary_payment(p_salary_id uuid,p_updates jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE old_row teacher_salary_payments%ROWTYPE; new_row teacher_salary_payments%ROWTYPE; eid uuid; admin_id uuid;
BEGIN
 admin_id:=finance_admin_id();
 SELECT expense_id INTO eid FROM teacher_salary_payments WHERE id=p_salary_id;
 IF eid IS NULL THEN RAISE EXCEPTION 'Salary payment not found'; END IF;
 PERFORM 1 FROM finance_expenses WHERE id=eid FOR UPDATE;
 SELECT * INTO old_row FROM teacher_salary_payments WHERE id=p_salary_id FOR UPDATE;
 IF old_row.status<>'ACTIVE' THEN RAISE EXCEPTION 'Voided salary payments cannot be edited'; END IF;
 IF p_updates ? 'status' AND p_updates->>'status' IS DISTINCT FROM old_row.status THEN RAISE EXCEPTION 'Use the expense void workflow to change payment status'; END IF;
 UPDATE teacher_salary_payments SET
  base_salary=CASE WHEN p_updates ? 'base_salary' THEN (p_updates->>'base_salary')::numeric ELSE base_salary END,
  bonus=CASE WHEN p_updates ? 'bonus' THEN (p_updates->>'bonus')::numeric ELSE bonus END,
  deduction=CASE WHEN p_updates ? 'deduction' THEN (p_updates->>'deduction')::numeric ELSE deduction END,
  payment_type=CASE WHEN p_updates ? 'payment_type' THEN p_updates->>'payment_type' ELSE payment_type END,
  notes=CASE WHEN p_updates ? 'notes' THEN p_updates->>'notes' ELSE notes END
 WHERE id=p_salary_id RETURNING * INTO new_row;
 INSERT INTO finance_audit_log(entity_type,entity_id,action,old_data,new_data,performed_by)
 VALUES('TEACHER_SALARY',p_salary_id::text,'SALARY_UPDATED',to_jsonb(old_row),to_jsonb(new_row),admin_id);
 RETURN to_jsonb(new_row);
END $$;
REVOKE ALL ON FUNCTION finance_update_salary_payment(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION finance_update_salary_payment(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.finance_salary_eligible_teachers(p_year integer DEFAULT NULL,p_month integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM finance_admin_id();
 IF (p_year IS NULL) IS DISTINCT FROM (p_month IS NULL) OR (p_month IS NOT NULL AND (p_month<1 OR p_month>12 OR p_year<1900 OR p_year>9999)) THEN RAISE EXCEPTION 'Valid salary year and month required'; END IF;
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'display_name',p.display_name,'email',p.email,'service_number',t.service_number,'rank',t.rank) ORDER BY p.display_name,p.id),'[]')
 FROM profiles p LEFT JOIN teachers t ON t.profile_id=p.id
 WHERE (p.role='TEACHER' OR t.id IS NOT NULL) AND NOT EXISTS(SELECT 1 FROM teacher_salary_payments s WHERE s.teacher_profile_id=p.id AND s.status='ACTIVE' AND s.salary_year=p_year AND s.salary_month=p_month));
END $$;
REVOKE ALL ON FUNCTION finance_salary_eligible_teachers(integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION finance_salary_eligible_teachers(integer,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_teacher_salaries(p_year integer,p_month integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='TEACHER' AND status='ACTIVE') THEN RAISE EXCEPTION 'Active teacher authentication required'; END IF;
 IF p_year<1900 OR p_year>9999 OR (p_month IS NOT NULL AND (p_month<1 OR p_month>12)) THEN RAISE EXCEPTION 'Valid salary period required'; END IF;
 RETURN (SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY salary_month DESC,payment_date DESC,created_at DESC),'[]') FROM teacher_salary_payments s WHERE teacher_profile_id=auth.uid() AND salary_year=p_year AND (p_month IS NULL OR salary_month=p_month));
END $$;
REVOKE ALL ON FUNCTION get_my_teacher_salaries(integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION get_my_teacher_salaries(integer,integer) TO authenticated;
DROP POLICY IF EXISTS teacher_salary_own_read ON teacher_salary_payments;
CREATE POLICY teacher_salary_own_read ON teacher_salary_payments FOR SELECT TO authenticated USING(teacher_profile_id=auth.uid() AND EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='TEACHER' AND status='ACTIVE'));

-- Payroll accepts real teacher profiles including legacy faculty without a docket.
DO $$ DECLARE d text; BEGIN
 SELECT pg_get_functiondef(oid) INTO d FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='record_finance_expense';
 d:=replace(d,'WHERE id = p_teacher_id AND role = ''TEACHER''','WHERE id = p_teacher_id AND (role = ''TEACHER'' OR EXISTS(SELECT 1 FROM teachers WHERE profile_id=p_teacher_id))');
 d:=replace(d,'Duplicate regular salary: A salary payment has already been recorded for this teacher for %/%. Use ADJUSTMENT or BONUS for additional payouts.','This teacher is already paid for %/%. Edit the saved salary payment instead.');
 EXECUTE d;
END $$;
REVOKE ALL ON FUNCTION salary_payment_validate(),salary_payment_sync_expense(),salary_expense_guard(),salary_expense_sync() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
