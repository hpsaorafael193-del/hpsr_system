create policy "legacy staff archive denied to clients"
on public.staff_unlinked_legacy
for select
to authenticated
using (false);

revoke all on function public.admin_update_team_member(uuid, jsonb) from public, anon;
grant execute on function public.admin_update_team_member(uuid, jsonb) to authenticated;

revoke all on function public.admin_deactivate_team_member(uuid, text) from public, anon;
grant execute on function public.admin_deactivate_team_member(uuid, text) to authenticated;
