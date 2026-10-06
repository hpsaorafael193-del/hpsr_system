-- HPSR v1.1.16-test.30
-- SECURITY DEFINER RPCs administrativos são APIs internas: somente usuários autenticados podem invocá-las.

revoke execute on function public.hpsr_internal_correct_record_metadata(text, text, text) from public, anon;
revoke execute on function public.hpsr_internal_set_record_visibility(text, boolean, text) from public, anon;
revoke execute on function public.set_clinical_record_confidentiality(text, boolean) from public, anon;

grant execute on function public.hpsr_internal_correct_record_metadata(text, text, text) to authenticated;
grant execute on function public.hpsr_internal_set_record_visibility(text, boolean, text) to authenticated;
grant execute on function public.set_clinical_record_confidentiality(text, boolean) to authenticated;
