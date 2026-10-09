-- Only owner-executed RPC implementations may use these internal helpers.
REVOKE EXECUTE ON FUNCTION public.generate_receipt_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit_event(text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
