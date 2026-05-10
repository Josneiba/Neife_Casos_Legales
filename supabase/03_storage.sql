-- Storage buckets y políticas — ejecutar después de 02_rls.sql

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Upload documentos" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.cases c
      where c.id = split_part(name, '/', 1)
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Lectura documentos del caso" on storage.objects
  for select using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.cases c
      where c.id = split_part(name, '/', 1)
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Avatar público" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Upload avatar propio" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
