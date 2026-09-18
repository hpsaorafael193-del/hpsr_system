revoke all on function public.audit_clinical_record_delete() from public, anon, authenticated;
grant execute on function public.audit_clinical_record_delete() to service_role;
