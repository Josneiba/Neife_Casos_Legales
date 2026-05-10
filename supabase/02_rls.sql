-- Row Level Security — ejecutar después de 01_schema.sql

alter table public.profiles enable row level security;
alter table public.lawyer_profiles enable row level security;
alter table public.cases enable row level security;
alter table public.case_requests enable row level security;
alter table public.case_activities enable row level security;
alter table public.case_notes enable row level security;
alter table public.next_steps enable row level security;
alter table public.documents enable row level security;
alter table public.case_documents enable row level security;
alter table public.case_document_versions enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.client_case_posts enable row level security;
alter table public.lawyer_proposals enable row level security;
alter table public.lawyer_experience enable row level security;

create policy "Perfil propio" on public.profiles
  for all using (auth.uid() = id);

create policy "Abogados visibles" on public.profiles
  for select using (
    exists (select 1 from public.lawyer_profiles lp where lp.id = profiles.id)
  );

create policy "Lectura pública abogados" on public.lawyer_profiles
  for select using (true);

create policy "Abogado edita su perfil" on public.lawyer_profiles
  for update using (auth.uid() = id);

create policy "Cliente ve sus casos" on public.cases
  for select using (auth.uid() = client_id);

create policy "Abogado ve sus casos" on public.cases
  for select using (auth.uid() = lawyer_id);

create policy "Cliente crea casos" on public.cases
  for insert with check (auth.uid() = client_id);

create policy "Abogado actualiza estado" on public.cases
  for update using (auth.uid() = lawyer_id)
  with check (auth.uid() = lawyer_id);

create policy "Abogado ve solicitudes entrantes" on public.case_requests
  for select using (auth.uid() = lawyer_id);

create policy "Cliente ve sus solicitudes" on public.case_requests
  for select using (auth.uid() = client_id);

create policy "Cliente envía solicitud" on public.case_requests
  for insert with check (auth.uid() = client_id);

create policy "Abogado responde solicitud" on public.case_requests
  for update using (auth.uid() = lawyer_id);

create policy "Solo abogado ve sus notas" on public.case_notes
  for all using (auth.uid() = lawyer_id);

create policy "Partes ven documentos del caso" on public.documents
  for select using (
    exists (
      select 1 from public.cases c
      where c.id = documents.case_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Partes suben documentos" on public.documents
  for insert with check (auth.uid() = uploaded_by);

create policy "Participantes ven documentos de workspace" on public.case_documents
  for select using (
    exists (
      select 1 from public.cases c
      where c.id = case_documents.case_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Participantes insertan documentos de workspace" on public.case_documents
  for insert with check (
    exists (
      select 1 from public.cases c
      where c.id = case_documents.case_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Participantes actualizan documentos de workspace" on public.case_documents
  for update using (
    exists (
      select 1 from public.cases c
      where c.id = case_documents.case_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Participantes borran documentos de workspace" on public.case_documents
  for delete using (
    exists (
      select 1 from public.cases c
      where c.id = case_documents.case_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Participantes ven versiones de documentos" on public.case_document_versions
  for select using (
    exists (
      select 1 from public.case_documents d
      join public.cases c on c.id = d.case_id
      where d.id = case_document_versions.case_document_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Participantes insertan versiones de documentos" on public.case_document_versions
  for insert with check (
    exists (
      select 1 from public.case_documents d
      join public.cases c on c.id = d.case_id
      where d.id = case_document_versions.case_document_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
    and uploaded_by = auth.uid()
  );

create policy "Participantes actualizan versiones de documentos" on public.case_document_versions
  for update using (
    exists (
      select 1 from public.case_documents d
      join public.cases c on c.id = d.case_id
      where d.id = case_document_versions.case_document_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Participantes borran versiones de documentos" on public.case_document_versions
  for delete using (
    exists (
      select 1 from public.case_documents d
      join public.cases c on c.id = d.case_id
      where d.id = case_document_versions.case_document_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Participantes ven conversación" on public.conversations
  for select using (auth.uid() = client_id or auth.uid() = lawyer_id);

create policy "Crear conversación" on public.conversations
  for insert with check (auth.uid() = client_id or auth.uid() = lawyer_id);

create policy "Participantes actualizan conversación" on public.conversations
  for update using (auth.uid() = client_id or auth.uid() = lawyer_id);

create policy "Participantes ven mensajes" on public.messages
  for select using (
    exists (
      select 1 from public.conversations conv
      where conv.id = messages.conversation_id
      and (conv.client_id = auth.uid() or conv.lawyer_id = auth.uid())
    )
  );

create policy "Participantes envían mensajes" on public.messages
  for insert with check (auth.uid() = sender_id);

create policy "Abogados ven casos publicados" on public.client_case_posts
  for select using (status = 'open');

create policy "Cliente gestiona sus publicaciones" on public.client_case_posts
  for all using (auth.uid() = client_id);

create policy "Abogado gestiona sus propuestas" on public.lawyer_proposals
  for all using (auth.uid() = lawyer_id);

create policy "Cliente ve propuestas recibidas" on public.lawyer_proposals
  for select using (auth.uid() = client_id);

create policy "Reseñas visibles públicamente" on public.reviews
  for select using (true);

create policy "Cliente deja reseña" on public.reviews
  for insert with check (auth.uid() = client_id);

-- Políticas añadidas (tablas con RLS sin políticas en la plantilla original)

create policy "Participantes ven actividades del caso" on public.case_activities
  for select using (
    exists (
      select 1 from public.cases c
      where c.id = case_activities.case_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Participantes crean actividades" on public.case_activities
  for insert with check (
    exists (
      select 1 from public.cases c
      where c.id = case_activities.case_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
    and created_by = auth.uid()
  );

create policy "Participantes leen próximos pasos" on public.next_steps
  for select using (
    exists (
      select 1 from public.cases c
      where c.id = next_steps.case_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Participantes insertan próximos pasos" on public.next_steps
  for insert with check (
    exists (
      select 1 from public.cases c
      where c.id = next_steps.case_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Participantes actualizan próximos pasos" on public.next_steps
  for update using (
    exists (
      select 1 from public.cases c
      where c.id = next_steps.case_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Participantes borran próximos pasos" on public.next_steps
  for delete using (
    exists (
      select 1 from public.cases c
      where c.id = next_steps.case_id
      and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())
    )
  );

create policy "Experiencia laboral de abogados es pública" on public.lawyer_experience
  for select using (true);

create policy "Abogado inserta experiencia" on public.lawyer_experience
  for insert with check (auth.uid() = lawyer_id);

create policy "Abogado actualiza experiencia" on public.lawyer_experience
  for update using (auth.uid() = lawyer_id);

create policy "Abogado borra experiencia" on public.lawyer_experience
  for delete using (auth.uid() = lawyer_id);
