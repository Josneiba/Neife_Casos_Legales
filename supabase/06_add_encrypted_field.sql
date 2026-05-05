-- Agregar columna encrypted a documents
alter table public.documents 
  add column if not exists encrypted boolean default false;

-- Marcar documentos existentes como no encriptados (son los anteriores a esta migración)
update public.documents set encrypted = false where encrypted is null;
