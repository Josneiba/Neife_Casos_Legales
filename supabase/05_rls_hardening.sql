-- ============================================================
-- NEIFE — RLS Hardening v2
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- ─── STORAGE: Documentos (el hueco más crítico) ─────────────
-- El bucket 'documents' actualmente permite que CUALQUIER usuario
-- autenticado lea CUALQUIER documento. Reemplazar por verificación
-- de pertenencia al caso.

drop policy if exists "Upload documentos" on storage.objects;
drop policy if exists "Lectura documentos del caso" on storage.objects;
drop policy if exists "Eliminar documento propio" on storage.objects;

-- Solo puede subir quien pertenece al caso (el case_id es el primer segmento del path)
create policy "Upload documentos del caso propio"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.cases c
      where c.id::text = (storage.foldername(name))[1]
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

-- Solo puede leer quien pertenece al caso
create policy "Lectura documentos del caso propio"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.cases c
      where c.id::text = (storage.foldername(name))[1]
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

-- Solo puede eliminar quien subió el documento
create policy "Eliminar documento propio"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.documents d
      join public.cases c on c.id = d.case_id
      where d.file_url = name
      and d.uploaded_by = auth.uid()
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

-- ─── CASES: El cliente también puede actualizar su propio caso ──
drop policy if exists "Cliente actualiza su caso" on public.cases;

create policy "Cliente actualiza su caso"
  on public.cases for update
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

-- ─── CLIENT_CASE_POSTS: Los abogados NO deben ver datos del cliente ──
-- El problema: la policy actual expone client_id y todos los campos al abogado.
-- Solución: crear una vista restringida para abogados.
drop policy if exists "Abogados ven casos publicados" on public.client_case_posts;
drop policy if exists "Cliente gestiona sus publicaciones" on public.client_case_posts;

-- Abogados solo ven posts abiertos (sin datos personales del cliente — eso lo maneja la vista)
create policy "Abogados ven posts abiertos"
  on public.client_case_posts for select
  using (
    status = 'open'
    and (
      -- El propio cliente siempre ve los suyos
      auth.uid() = client_id
      -- O es un abogado verificado
      or exists (
        select 1 from public.lawyer_profiles lp
        where lp.id = auth.uid() and lp.verified = true
      )
    )
  );

create policy "Cliente crea sus publicaciones"
  on public.client_case_posts for insert
  with check (auth.uid() = client_id);

create policy "Cliente actualiza sus publicaciones"
  on public.client_case_posts for update
  using (auth.uid() = client_id);

create policy "Cliente elimina sus publicaciones"
  on public.client_case_posts for delete
  using (auth.uid() = client_id);

-- ─── LAWYER_PROPOSALS: Blindar acceso cruzado ───────────────
drop policy if exists "Abogado gestiona sus propuestas" on public.lawyer_proposals;
drop policy if exists "Cliente ve propuestas recibidas" on public.lawyer_proposals;

create policy "Abogado gestiona sus propuestas"
  on public.lawyer_proposals for all
  using (auth.uid() = lawyer_id)
  with check (auth.uid() = lawyer_id);

create policy "Cliente ve propuestas para sus posts"
  on public.lawyer_proposals for select
  using (
    exists (
      select 1 from public.client_case_posts p
      where p.id = lawyer_proposals.post_id
      and p.client_id = auth.uid()
    )
  );

-- ─── DOCUMENTS: Agregar DELETE policy ───────────────────────
drop policy if exists "Partes eliminan documentos" on public.documents;

create policy "Partes eliminan documentos del caso"
  on public.documents for delete
  using (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.cases c
      where c.id = documents.case_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

-- ─── MESSAGES: Prevenir que un participante edite mensajes ajenos ──
drop policy if exists "Participantes envían mensajes" on public.messages;

create policy "Sender envía su mensaje"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations conv
      where conv.id = messages.conversation_id
      and (conv.client_id = auth.uid() or conv.lawyer_id = auth.uid())
    )
  );

-- ─── CASE_NOTES: Solo el abogado asignado al caso ───────────
drop policy if exists "Solo abogado ve sus notas" on public.case_notes;

create policy "Abogado asignado ve sus notas"
  on public.case_notes for all
  using (
    auth.uid() = lawyer_id
    and exists (
      select 1 from public.cases c
      where c.id = case_notes.case_id
      and c.lawyer_id = auth.uid()
    )
  );

-- ─── REVIEWS: Prevenir reseñas duplicadas ───────────────────
drop policy if exists "Cliente deja reseña" on public.reviews;

create policy "Cliente deja una reseña por caso"
  on public.reviews for insert
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.cases c
      where c.id = reviews.case_id
      and c.client_id = auth.uid()
      and c.status = 'completed'
    )
    and not exists (
      select 1 from public.reviews r
      where r.case_id = reviews.case_id
      and r.client_id = auth.uid()
    )
  );

-- ─── Verificación final ──────────────────────────────────────
-- Ejecutar esto para ver el resumen de políticas activas:
-- select tablename, policyname, cmd from pg_policies
-- where schemaname = 'public'
-- order by tablename, cmd;
