# Configuração do Supabase — HPSR

## 1. Criar o projeto

Crie um projeto no Supabase e guarde a senha do banco em local seguro.

## 2. Configurar o ambiente local

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

A variável `NEXT_PUBLIC_SUPABASE_ANON_KEY` também é aceita por compatibilidade.

Não coloque `service_role`, secret key ou senha do banco em variáveis `NEXT_PUBLIC_*`.

## 3. Executar as migrations

No SQL Editor, execute na ordem:

1. `supabase/migrations/20260710_000001_hpsr_initial.sql`
2. `supabase/migrations/20260710_000002_google_auth.sql`
3. `supabase/migrations/20260710_000003_access_approval_gate.sql`
4. `supabase/migrations/20260710_000004_registration_auth_sync.sql`
5. `supabase/migrations/20260710_000005_cleanup_and_public_queries.sql`

A quinta migration remove dados demonstrativos de versões anteriores e cria consultas públicas seguras para candidaturas e agendamentos.

## 4. Criar o primeiro administrador

Crie o usuário em **Authentication → Users** e confirme o e-mail. Depois, no SQL Editor:

```sql
update public.profiles
set
  name = 'NOME DO ADMINISTRADOR',
  role = 'Dev / Desenvolvedor do Sistema',
  access_status = 'Aprovado',
  updated_at = now()
where email = 'EMAIL DO ADMINISTRADOR';
```

Confira:

```sql
select id, name, email, role, access_status
from public.profiles
where email = 'EMAIL DO ADMINISTRADOR';
```

## 5. Configurar URLs de autenticação

Em **Authentication → URL Configuration**:

- Site URL local: `http://localhost:3000`
- Redirect URL local: `http://localhost:3000/auth/callback`
- Opcional no desenvolvimento: `http://localhost:3000/**`

Ao publicar, adicione também a URL de produção e o callback de produção.

## 6. Configurar Google

1. Ative o provedor Google em **Authentication → Providers**.
2. Configure o Client ID e Client Secret do Google Cloud.
3. No Google Cloud, use como URI autorizada do OAuth:
   `https://SEU-PROJETO.supabase.co/auth/v1/callback`
4. Mantenha `/auth/callback` entre as Redirect URLs do Supabase.

O Google valida a identidade e fornece o e-mail. Nome, passaporte e CRM continuam obrigatórios no cadastro do HPSR.

## 7. Storage

Crie buckets privados para:

- `medical-signatures`
- `clinical-attachments`

Defina políticas de acesso antes de armazenar dados reais.

## 8. Fluxo de aprovação

- cadastro novo: `Pendente`;
- dashboard bloqueado;
- solicitação visível em **Equipe → Cadastros médicos**;
- aprovação administrativa altera o perfil para `Aprovado`;
- recusa altera o perfil para `Recusado`;
- o usuário não pode se autoaprovar.

## 9. Produção

Antes de publicar:

- revise todas as políticas RLS;
- configure domínio e URLs de produção;
- mantenha secrets somente no ambiente do servidor;
- configure backups e retenção;
- teste cadastro, aprovação, login, logout e recuperação de sessão;
- valide permissões de cada cargo com contas separadas.
