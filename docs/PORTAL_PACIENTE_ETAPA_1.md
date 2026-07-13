# Portal do Paciente — Etapa 1

Esta etapa cria apenas a fundação de banco e segurança.

## Incluído

- cadastro separado de passaporte e e-mail para acesso ao portal;
- códigos temporários armazenados somente como hash;
- validade prevista de 15 minutos, uso único, limite de tentativas e intervalo para reenvio;
- sessões temporárias próprias do portal, sem criar usuários no Supabase Auth;
- sigilo individual em cada registro de `clinical_records`;
- função autenticada para colocar/remover sigilo com registro no histórico;
- tabelas de códigos e sessões bloqueadas para acesso direto pelo navegador.

## Não incluído nesta etapa

- telas públicas;
- envio pelo Resend;
- geração e validação do código;
- consulta pública de exames/documentos;
- agendamento no portal.

## Aplicação

Execute no SQL Editor do Supabase:

`supabase/migrations/20260712_000009_patient_portal_foundation.sql`

Registros clínicos existentes permanecem em sigilo por padrão. Nenhum item será exposto ao paciente até uma liberação explícita.
