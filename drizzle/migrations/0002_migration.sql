revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.is_staff(uuid) from public, anon;
revoke execute on function public.can_access_processo(uuid, uuid) from public, anon;
revoke execute on function public.can_access_processo_path(uuid, text) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_staff(uuid) to authenticated;
grant execute on function public.can_access_processo(uuid, uuid) to authenticated;
grant execute on function public.can_access_processo_path(uuid, text) to authenticated;