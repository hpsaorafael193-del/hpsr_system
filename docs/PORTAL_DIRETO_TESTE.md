# Portal Direto — versão alternativa de teste

Esta cópia não pertence à cadeia oficial de versões do HPSR.

## Acesso

O paciente informa somente o passaporte. O servidor procura o cadastro nas seguintes fontes:

- `patient_portal_access`;
- `clinical_records.patient_passport`;
- `appointments.passport`.

Quando o paciente existe em prontuários ou consultas, mas ainda não possui uma linha em
`patient_portal_access`, a versão de teste cria automaticamente essa liberação interna.

## Variáveis obrigatórias

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`PATIENT_PORTAL_CODE_SECRET` permanece aceito, mas nesta variante o hash da sessão pode usar
`SUPABASE_SERVICE_ROLE_KEY` como fallback, pois o acesso por código está desativado.

## Banco

As migrations do Portal do Paciente precisam ter sido aplicadas, especialmente a que cria:

- `patient_portal_access`;
- `patient_portal_sessions`.
