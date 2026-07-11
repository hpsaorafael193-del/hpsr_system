# HPSR System

Sistema clínico e administrativo do Hospital São Rafael RP, desenvolvido com Next.js, TypeScript, Tailwind CSS e Supabase.

## Recursos principais

- autenticação por e-mail e Google;
- aprovação administrativa antes de liberar o dashboard;
- gestão de equipe, candidaturas e cadastros médicos;
- agendamentos, prontuários, convênios e gestão de leitos;
- exames e documentos com preview e exportação;
- calculadora, recibos e histórico financeiro;
- relatório de atividades para a Direção.

## Requisitos

- Node.js 20 ou superior;
- npm 10 ou superior;
- projeto configurado no Supabase.

## Instalação

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`.

No Windows PowerShell, a cópia do arquivo pode ser feita com:

```powershell
Copy-Item .env.example .env.local
```

## Variáveis de ambiente

Preencha `.env.local` sem enviar esse arquivo ao GitHub:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Projetos antigos também podem usar `NEXT_PUBLIC_SUPABASE_ANON_KEY` no lugar da publishable key.

Nunca exponha a senha do banco, a chave `service_role` ou qualquer secret key no frontend.

## Configuração do banco

Execute as migrations de `supabase/migrations` no SQL Editor, nesta ordem:

1. `20260710_000001_hpsr_initial.sql`
2. `20260710_000002_google_auth.sql`
3. `20260710_000003_access_approval_gate.sql`
4. `20260710_000004_registration_auth_sync.sql`
5. `20260710_000005_cleanup_and_public_queries.sql`

As instruções completas estão em [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).

## Scripts

```bash
npm run dev        # desenvolvimento
npm run typecheck  # validação TypeScript
npm run lint       # lint
npm run build      # build de produção
npm run start      # execução do build
```

## Rotas principais

### Públicas

- `/`
- `/agendar`
- `/consultar-agendamento`
- `/trabalhe-conosco`
- `/consultar-candidatura`
- `/auth/callback`

### Internas

As rotas em `/dashboard` exigem usuário autenticado e aprovado.

- `/dashboard`
- `/dashboard/agendamento`
- `/dashboard/prontuarios`
- `/dashboard/convenios`
- `/dashboard/guia-farmaceutico`
- `/dashboard/calculadora`
- `/dashboard/exames`
- `/dashboard/documentos`
- `/dashboard/traumatologia`
- `/dashboard/banco-de-sangue`
- `/dashboard/gestao-de-leitos`
- `/dashboard/financeiro`
- `/dashboard/equipe`
- `/dashboard/direcao`

## Fluxo de acesso

1. O profissional cria uma conta.
2. O perfil é registrado como **Pendente**.
3. A solicitação aparece em **Equipe → Cadastros médicos**.
4. Um administrador aprova ou recusa.
5. O dashboard é liberado somente após a aprovação.

## Segurança do repositório

O `.gitignore` exclui arquivos de ambiente, dependências, builds, caches e logs. Antes de cada push, confirme que `.env.local` não foi adicionado ao Git:

```bash
git status
```
