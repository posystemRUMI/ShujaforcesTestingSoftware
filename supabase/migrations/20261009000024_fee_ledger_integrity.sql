BEGIN;
CREATE FUNCTION finance_admin_id() RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM profiles WHERE id=uid AND role='ADMIN' AND status='ACTIVE') THEN RAISE EXCEPTION 'Active authenticated admin required'; END IF;
 RETURN uid;
END $$;
REVOKE ALL ON FUNCTION finance_admin_id() FROM PUBLIC,anon,authenticated;
ALTER TABLE student_fee_accounts ADD CONSTRAINT fee_account_owner UNIQUE(id,student_id);
ALTER TABLE student_fee_payments ADD CONSTRAINT fee_payment_owner FOREIGN KEY(fee_account_id,student_id) REFERENCES student_fee_accounts(id,student_id);
CREATE UNIQUE INDEX fee_monthly_unique ON student_fee_accounts(student_id,fee_type,fee_month,fee_year) WHERE fee_month IS NOT NULL;
CREATE FUNCTION fee_account_ledger_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE paid numeric; net numeric;
BEGIN
 IF NEW.amount_due IS NULL OR NEW.discount_amount IS NULL OR NEW.fine_amount IS NULL OR NEW.amount_due<0 OR NEW.discount_amount<0 OR NEW.fine_amount<0 THEN RAISE EXCEPTION 'Fee amounts must be nonnegative'; END IF;
 SELECT coalesce(sum(amount),0) INTO paid FROM student_fee_payments WHERE fee_account_id=NEW.id AND status='ACTIVE';
 net:=NEW.amount_due-NEW.discount_amount+NEW.fine_amount;
 IF net<paid THEN RAISE EXCEPTION 'Net fee cannot be lower than collected payments'; END IF;
 NEW.amount_paid:=paid;
 IF NEW.status<>'WAIVED' THEN NEW.status:=CASE WHEN net=paid THEN 'PAID' WHEN paid>0 THEN 'PARTIAL' ELSE 'UNPAID' END; END IF;
 IF NEW.fee_month IS NOT NULL AND NEW.fee_month NOT BETWEEN 1 AND 12 THEN RAISE EXCEPTION 'Invalid fee month'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER fee_account_ledger_guard BEFORE INSERT OR UPDATE ON student_fee_accounts FOR EACH ROW EXECUTE FUNCTION fee_account_ledger_guard();
CREATE FUNCTION fee_payment_ledger_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE account student_fee_accounts%ROWTYPE; paid numeric;
BEGIN
 IF NEW.fee_account_id IS NULL THEN RAISE EXCEPTION 'Payment requires a designated fee account'; END IF;
 SELECT * INTO account FROM student_fee_accounts WHERE id=NEW.fee_account_id FOR UPDATE;
 IF account.id IS NULL OR account.student_id<>NEW.student_id THEN RAISE EXCEPTION 'Payment/account student mismatch'; END IF;
 IF NEW.amount IS NULL OR NEW.amount<=0 THEN RAISE EXCEPTION 'Payment must be positive'; END IF;
 IF TG_OP='UPDATE' AND (NEW.amount<>OLD.amount OR NEW.student_id<>OLD.student_id OR NEW.fee_account_id<>OLD.fee_account_id OR NEW.receipt_number<>OLD.receipt_number OR (OLD.status='VOID' AND NEW.status<>'VOID')) THEN RAISE EXCEPTION 'Payment history is immutable; void and record a correction'; END IF;
 IF NEW.status='ACTIVE' THEN
  IF account.status='WAIVED' THEN RAISE EXCEPTION 'Waived fee cannot receive new payments'; END IF;
  SELECT coalesce(sum(amount),0) INTO paid FROM student_fee_payments WHERE fee_account_id=account.id AND status='ACTIVE' AND id<>NEW.id;
  IF paid+NEW.amount>account.amount_due-account.discount_amount+account.fine_amount THEN RAISE EXCEPTION 'Overpayment rejected'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER fee_payment_ledger_guard BEFORE INSERT OR UPDATE ON student_fee_payments FOR EACH ROW EXECUTE FUNCTION fee_payment_ledger_guard();
CREATE FUNCTION fee_payment_reconcile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE aid uuid; BEGIN aid:=CASE WHEN TG_OP='DELETE' THEN OLD.fee_account_id ELSE NEW.fee_account_id END;
 UPDATE student_fee_accounts SET amount_paid=amount_paid WHERE id=aid; RETURN NULL; END $$;
CREATE TRIGGER fee_payment_reconcile AFTER INSERT OR UPDATE OR DELETE ON student_fee_payments FOR EACH ROW EXECUTE FUNCTION fee_payment_reconcile();
UPDATE student_fee_accounts SET amount_paid=amount_paid;
CREATE FUNCTION fee_effective_due(a student_fee_accounts) RETURNS numeric LANGUAGE sql IMMUTABLE AS $$ SELECT CASE WHEN a.status='WAIVED' THEN a.amount_paid ELSE a.amount_due-a.discount_amount+a.fine_amount END $$;

CREATE FUNCTION finance_student_fee_data(p_student_id uuid DEFAULT NULL,p_status text DEFAULT NULL,p_fee_account_id uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE sid uuid:=p_student_id; accounts jsonb; payments jsonb; totals jsonb;
BEGIN
 IF is_student() THEN sid:=portal_student_id(); IF p_student_id IS NOT NULL AND p_student_id<>sid THEN RAISE EXCEPTION 'Fee ownership denied'; END IF;
 ELSE PERFORM finance_admin_id(); END IF;
 IF p_fee_account_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM student_fee_accounts WHERE id=p_fee_account_id AND (sid IS NULL OR student_id=sid)) THEN RAISE EXCEPTION 'Fee account ownership denied'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(a)||jsonb_build_object('student_name',p.display_name,'roll_number',s.roll_number,'course_name',c.name,'batch_name',b.name,'net_due',fee_effective_due(a),'remaining_balance',fee_effective_due(a)-a.amount_paid) ORDER BY a.created_at DESC),'[]') INTO accounts
 FROM student_fee_accounts a JOIN students s ON s.id=a.student_id JOIN profiles p ON p.id=s.profile_id LEFT JOIN courses c ON c.id=a.course_id LEFT JOIN batches b ON b.id=a.batch_id
 WHERE (sid IS NULL OR a.student_id=sid) AND (p_status IS NULL OR p_status='ALL' OR a.status=p_status) AND (p_fee_account_id IS NULL OR a.id=p_fee_account_id);
 SELECT coalesce(jsonb_agg(to_jsonb(pay)||jsonb_build_object('student_name',p.display_name,'roll_number',s.roll_number,'fee_type',a.fee_type,'received_by_name',receiver.display_name) ORDER BY pay.payment_date DESC),'[]') INTO payments
 FROM student_fee_payments pay JOIN students s ON s.id=pay.student_id JOIN profiles p ON p.id=s.profile_id JOIN student_fee_accounts a ON a.id=pay.fee_account_id LEFT JOIN profiles receiver ON receiver.id=pay.received_by
 WHERE (sid IS NULL OR pay.student_id=sid) AND (p_fee_account_id IS NULL OR pay.fee_account_id=p_fee_account_id);
 SELECT jsonb_build_object('total_fee',sum(fee_effective_due(a)),'paid_fee',coalesce(sum(a.amount_paid),0),'remaining_fee',sum(fee_effective_due(a)-a.amount_paid)) INTO totals FROM student_fee_accounts a WHERE sid IS NULL OR a.student_id=sid;
 RETURN jsonb_build_object('accounts',accounts,'payments',payments,'totals',totals);
END $$;
CREATE FUNCTION finance_students_fee_overview(p_search text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE rows jsonb; BEGIN PERFORM finance_admin_id();
 SELECT coalesce(jsonb_agg(jsonb_build_object('student_id',s.id,'id',s.id,'profile_id',s.profile_id,'display_name',p.display_name,'roll_number',s.roll_number,'father_name',s.father_name,'email',p.email,'course_id',c.id,'course_name',c.name,'force_name',f.name,
 'total_due',coalesce(a.due,0),'total_paid',coalesce(a.paid,0),'total_discount',coalesce(a.discount,0),'total_fine',coalesce(a.fine,0),'balance',coalesce(a.due-a.paid,0),'status',CASE WHEN coalesce(a.due-a.paid,0)=0 THEN 'PAID' WHEN a.paid>0 THEN 'PARTIAL' ELSE 'UNPAID' END,'accounts_count',coalesce(a.accounts,0),'unpaid_count',coalesce(a.unpaid,0)) ORDER BY s.created_at DESC),'[]') INTO rows
 FROM students s JOIN profiles p ON p.id=s.profile_id LEFT JOIN courses c ON c.id=s.target_course_id LEFT JOIN forces f ON f.id=s.target_force_id LEFT JOIN LATERAL(SELECT sum(fee_effective_due(fa)) due,sum(fa.amount_paid) paid,sum(fa.discount_amount) discount,sum(fa.fine_amount) fine,count(*) accounts,count(*) FILTER(WHERE fee_effective_due(fa)>fa.amount_paid) unpaid FROM student_fee_accounts fa WHERE fa.student_id=s.id)a ON true
 WHERE p_search IS NULL OR p.display_name ILIKE '%'||p_search||'%' OR s.roll_number ILIKE '%'||p_search||'%' OR p.email ILIKE '%'||p_search||'%';
 RETURN rows;
END $$;
CREATE FUNCTION finance_update_fee_account(p_account_id uuid,p_updates jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor uuid:=finance_admin_id(); oldrow student_fee_accounts%ROWTYPE; BEGIN
 SELECT * INTO oldrow FROM student_fee_accounts WHERE id=p_account_id FOR UPDATE; IF oldrow.id IS NULL THEN RAISE EXCEPTION 'Fee account not found'; END IF;
 UPDATE student_fee_accounts SET amount_due=coalesce((p_updates->>'amount_due')::numeric,amount_due),discount_amount=coalesce((p_updates->>'discount_amount')::numeric,discount_amount),fine_amount=coalesce((p_updates->>'fine_amount')::numeric,fine_amount),
 due_date=CASE WHEN p_updates?'due_date' THEN (p_updates->>'due_date')::date ELSE due_date END,status=coalesce(p_updates->>'status',status) WHERE id=p_account_id;
 INSERT INTO finance_audit_log(entity_type,entity_id,action,old_data,new_data,performed_by) VALUES('STUDENT_FEE_ACCOUNT',p_account_id::text,'ACCOUNT_UPDATED',to_jsonb(oldrow),p_updates,actor);
END $$;
CREATE POLICY fee_own_account_read ON student_fee_accounts FOR SELECT TO authenticated USING(student_id=portal_student_id());
CREATE POLICY fee_own_payment_read ON student_fee_payments FOR SELECT TO authenticated USING(student_id=portal_student_id());
-- Avoid calling the strict student helper for admin rows in permissive policies.
ALTER POLICY fee_own_account_read ON student_fee_accounts USING(EXISTS(SELECT 1 FROM students s WHERE s.id=student_id AND s.profile_id=auth.uid()));
ALTER POLICY fee_own_payment_read ON student_fee_payments USING(EXISTS(SELECT 1 FROM students s WHERE s.id=student_id AND s.profile_id=auth.uid()));
REVOKE ALL ON FUNCTION fee_account_ledger_guard(),fee_payment_ledger_guard(),fee_payment_reconcile(),fee_effective_due(student_fee_accounts) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION fee_effective_due(student_fee_accounts) TO authenticated;
REVOKE ALL ON FUNCTION finance_student_fee_data(uuid,text,uuid),finance_students_fee_overview(text),finance_update_fee_account(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION finance_student_fee_data(uuid,text,uuid),finance_students_fee_overview(text),finance_update_fee_account(uuid,jsonb) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
