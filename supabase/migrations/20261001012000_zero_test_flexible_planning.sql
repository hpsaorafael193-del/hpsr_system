-- v1.0.431 — flexibilidade orientativa + isolamento de observação médica + cenário Zero Teste.
begin;

alter table public.clinical_followup_occurrences
  add column if not exists medical_observation_text text;

comment on column public.clinical_followup_occurrences.medical_observation_text is
  'Observação médica interna e exclusiva da consulta/etapa. Não compõe o PNG integral nem snapshot liberado ao paciente.';

-- O paciente de desenvolvimento é identificado exclusivamente pelo passaporte 000.
-- Corrige somente o nome de apresentação desse cadastro de teste.
update public.patient_registry
   set name = 'Zero Teste'
 where passport = '000';

-- Cenários de desenvolvimento: coexistência Gestacional + FIV para o mesmo paciente.
do $block$
declare
  v_doctor uuid;
  v_doctor_name text;
  v_gest uuid;
  v_fiv uuid;
  v_occ uuid;
  v_now timestamptz := now();
begin
  select pdl.doctor_id, p.name into v_doctor, v_doctor_name
    from public.patient_doctor_links pdl
    join public.profiles p on p.id = pdl.doctor_id
   where pdl.patient_passport = '000'
   order by (p.role = 'Vice Diretor / Dev') desc, pdl.started_at
   limit 1;

  if v_doctor is null then
    raise notice 'Paciente de teste 000 não encontrado ou sem médico vinculado; cenário de teste não foi semeado.';
  else

  select id into v_gest from public.clinical_followup_plans
   where patient_passport='000' and doctor_id=v_doctor and plan_type='gestacional' and start_date='2026-10-01'
   order by created_at limit 1;
  if v_gest is null then
    insert into public.clinical_followup_plans(
      doctor_id,doctor_name,patient_passport,patient_name,specialty,frequency,interval_days,start_date,end_date,total_consultations,total_weeks,status,
      planning_notes,consultation_schedule,plan_type,schedule_confirmed_at,updated_at
    ) values (
      v_doctor,v_doctor_name,'000','Zero Teste','Obstetra','Personalizada',7,'2026-10-01','2026-12-03',5,40,'Ativo',
      'Cenário controlado de desenvolvimento. Cronologia e quantidade propositalmente comprimidas para teste.',
      jsonb_build_array(
        jsonb_build_object('number',1,'title','Consulta 1','marker','12 semanas','week',12,'date','2026-10-01','planned_text','Avaliação inicial, sinais vitais, histórico gestacional e orientações iniciais.','description','Avaliação inicial, sinais vitais, histórico gestacional e orientações iniciais.'),
        jsonb_build_object('number',2,'title','Consulta 2','marker','16 semanas','week',16,'date','2026-10-15','planned_text','Avaliação da evolução gestacional e revisão de exames.','description','Avaliação da evolução gestacional e revisão de exames.'),
        jsonb_build_object('number',3,'title','Consulta 3','marker','20 semanas','week',20,'date','2026-10-29','planned_text','Avaliação clínica e acompanhamento do desenvolvimento fetal.','description','Avaliação clínica e acompanhamento do desenvolvimento fetal.'),
        jsonb_build_object('number',4,'title','Consulta 4','marker','24 semanas','week',24,'date','2026-11-12','planned_text','Acompanhamento materno-fetal e orientações de rotina.','description','Acompanhamento materno-fetal e orientações de rotina.'),
        jsonb_build_object('number',5,'title','Consulta 5','marker','28 semanas','week',28,'date','2026-11-26','planned_text','Avaliação final do período de teste e revisão do planejamento.','description','Avaliação final do período de teste e revisão do planejamento.')
      ),'gestacional',v_now,v_now
    ) returning id into v_gest;
  end if;

  insert into public.clinical_followup_occurrences(plan_id,doctor_id,patient_passport,patient_name,specialty,planned_date,status,step_number,rp_marker,step_title,planned_text,evolution_text,medical_observation_text,conduct_text,updated_at)
  select v_gest,v_doctor,'000','Zero Teste','Obstetra',x.d,'Planejada',x.n,x.m,'Consulta '||x.n,x.p,
         case when x.n=1 then 'Paciente comparece para início de acompanhamento gestacional. Encontra-se estável, sem intercorrências relatadas durante a avaliação de teste.' end,
         case when x.n=1 then 'Primeira consulta do planejamento gestacional do paciente de testes. Registro criado para validação da persistência e individualização das observações.' end,
         case when x.n=1 then 'Manter acompanhamento conforme planejamento estabelecido e reavaliar na próxima consulta.' end,v_now
    from (values
      (1,'2026-10-01'::date,'12 semanas','Avaliação inicial, sinais vitais, histórico gestacional e orientações iniciais.'),
      (2,'2026-10-15'::date,'16 semanas','Avaliação da evolução gestacional e revisão de exames.'),
      (3,'2026-10-29'::date,'20 semanas','Avaliação clínica e acompanhamento do desenvolvimento fetal.'),
      (4,'2026-11-12'::date,'24 semanas','Acompanhamento materno-fetal e orientações de rotina.'),
      (5,'2026-11-26'::date,'28 semanas','Avaliação final do período de teste e revisão do planejamento.')
    ) x(n,d,m,p)
  on conflict (plan_id,planned_date) do update set step_number=excluded.step_number,rp_marker=excluded.rp_marker,step_title=excluded.step_title,planned_text=excluded.planned_text,
    evolution_text=coalesce(public.clinical_followup_occurrences.evolution_text,excluded.evolution_text),medical_observation_text=coalesce(public.clinical_followup_occurrences.medical_observation_text,excluded.medical_observation_text),conduct_text=coalesce(public.clinical_followup_occurrences.conduct_text,excluded.conduct_text),updated_at=v_now;

  select id into v_fiv from public.clinical_followup_plans
   where patient_passport='000' and doctor_id=v_doctor and plan_type='in_vitro' and start_date='2026-10-01'
   order by created_at limit 1;
  if v_fiv is null then
    insert into public.clinical_followup_plans(
      doctor_id,doctor_name,patient_passport,patient_name,specialty,frequency,interval_days,start_date,end_date,total_consultations,total_weeks,status,
      planning_notes,consultation_schedule,plan_type,schedule_confirmed_at,updated_at
    ) values (
      v_doctor,v_doctor_name,'000','Zero Teste','Ginecologia','Personalizada',7,'2026-10-01','2026-11-12',7,7,'Ativo',
      'Cenário controlado de desenvolvimento. Sete etapas intencionais para validar flexibilidade do FIV.',
      jsonb_build_array(
        jsonb_build_object('number',1,'title','Avaliação inicial','marker','Avaliação inicial','week',1,'date','2026-10-01','planned_text','Avaliação clínica e definição inicial do protocolo.','description','Avaliação clínica e definição inicial do protocolo.'),
        jsonb_build_object('number',2,'title','Preparação','marker','Preparação','week',2,'date','2026-10-08','planned_text','Preparação para início do protocolo.','description','Preparação para início do protocolo.'),
        jsonb_build_object('number',3,'title','Estimulação e monitoramento','marker','Estimulação e monitoramento','week',3,'date','2026-10-15','planned_text','Acompanhamento da resposta ao protocolo.','description','Acompanhamento da resposta ao protocolo.'),
        jsonb_build_object('number',4,'title','Coleta e fertilização','marker','Coleta e fertilização','week',4,'date','2026-10-22','planned_text','Procedimentos de coleta e fertilização.','description','Procedimentos de coleta e fertilização.'),
        jsonb_build_object('number',5,'title','Transferência','marker','Transferência','week',5,'date','2026-10-29','planned_text','Transferência embrionária e orientações posteriores.','description','Transferência embrionária e orientações posteriores.'),
        jsonb_build_object('number',6,'title','Avaliação posterior','marker','Avaliação posterior','week',6,'date','2026-11-05','planned_text','Avaliação pós-transferência.','description','Avaliação pós-transferência.'),
        jsonb_build_object('number',7,'title','β-hCG','marker','β-hCG','week',7,'date','2026-11-12','planned_text','Avaliação do resultado do protocolo.','description','Avaliação do resultado do protocolo.')
      ),'in_vitro',v_now,v_now
    ) returning id into v_fiv;
  end if;

  insert into public.clinical_followup_occurrences(plan_id,doctor_id,patient_passport,patient_name,specialty,planned_date,status,step_number,rp_marker,step_title,planned_text,evolution_text,medical_observation_text,conduct_text,updated_at)
  select v_fiv,v_doctor,'000','Zero Teste','Ginecologia',x.d,'Planejada',x.n,x.t,x.t,x.p,
         case when x.n=1 then 'Paciente de teste avaliado para início do planejamento de FIV. Sem intercorrências registradas durante esta etapa.' end,
         case when x.n=1 then 'Primeira observação individual do planejamento de FIV. Registro destinado à validação de isolamento entre observações das diferentes etapas e entre os modelos Gestacional e FIV.' end,
         case when x.n=1 then 'Prosseguir para etapa de preparação conforme cronograma definido pelo médico.' end,v_now
    from (values
      (1,'2026-10-01'::date,'Avaliação inicial','Avaliação clínica e definição inicial do protocolo.'),
      (2,'2026-10-08'::date,'Preparação','Preparação para início do protocolo.'),
      (3,'2026-10-15'::date,'Estimulação e monitoramento','Acompanhamento da resposta ao protocolo.'),
      (4,'2026-10-22'::date,'Coleta e fertilização','Procedimentos de coleta e fertilização.'),
      (5,'2026-10-29'::date,'Transferência','Transferência embrionária e orientações posteriores.'),
      (6,'2026-11-05'::date,'Avaliação posterior','Avaliação pós-transferência.'),
      (7,'2026-11-12'::date,'β-hCG','Avaliação do resultado do protocolo.')
    ) x(n,d,t,p)
  on conflict (plan_id,planned_date) do update set step_number=excluded.step_number,rp_marker=excluded.rp_marker,step_title=excluded.step_title,planned_text=excluded.planned_text,
    evolution_text=coalesce(public.clinical_followup_occurrences.evolution_text,excluded.evolution_text),medical_observation_text=coalesce(public.clinical_followup_occurrences.medical_observation_text,excluded.medical_observation_text),conduct_text=coalesce(public.clinical_followup_occurrences.conduct_text,excluded.conduct_text),updated_at=v_now;

  end if;
end
$block$;

commit;
notify pgrst, 'reload schema';
