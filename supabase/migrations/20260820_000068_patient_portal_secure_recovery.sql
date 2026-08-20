-- HPSR v1.0.287
-- Recuperação segura do Portal do Paciente sem troca automática de e-mail.
-- Reutiliza patient_access_codes: nenhuma segunda fonte de códigos é criada.

alter table public.patient_access_codes
  add column if not exists purpose text;

update public.patient_access_codes
set purpose = 'legacy_access'
where purpose is null or btrim(purpose) = '';

alter table public.patient_access_codes
  alter column purpose set default 'legacy_access',
  alter column purpose set not null;

alter table public.patient_access_codes
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.patient_access_codes
  drop constraint if exists patient_access_codes_purpose_valid;

alter table public.patient_access_codes
  add constraint patient_access_codes_purpose_valid
  check (purpose in ('legacy_access', 'self_recovery', 'assisted_recovery'));

create index if not exists idx_patient_access_codes_access_purpose_sent
  on public.patient_access_codes (portal_access_id, purpose, sent_at desc);

comment on column public.patient_access_codes.purpose is
  'Finalidade do código: legado, recuperação pessoal ou recuperação assistida.';

comment on column public.patient_access_codes.created_by is
  'Usuário interno que emitiu o código quando a recuperação é assistida.';
