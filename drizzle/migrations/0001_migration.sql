create policy "Pasta digital: ler arquivos do processo" on storage.objects for select to authenticated
  using (bucket_id = 'pastas-digitais' and public.can_access_processo_path(auth.uid(), (storage.foldername(name))[1]));
create policy "Pasta digital: enviar arquivos ao processo" on storage.objects for insert to authenticated
  with check (bucket_id = 'pastas-digitais' and public.is_staff(auth.uid())
    and public.can_access_processo_path(auth.uid(), (storage.foldername(name))[1]));
create policy "Pasta digital: admin remove arquivos" on storage.objects for delete to authenticated
  using (bucket_id = 'pastas-digitais' and public.has_role(auth.uid(), 'admin'));

revoke execute on function public.handle_new_user() from public, anon, authenticated;