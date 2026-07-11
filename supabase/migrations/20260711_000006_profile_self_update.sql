-- Permite que cada usuário autenticado mantenha os próprios dados pessoais.
-- A administração continua podendo atualizar perfis pelas políticas existentes.

drop policy if exists "profile self update" on public.profiles;

create policy "profile self update"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
