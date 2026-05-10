-- Migration: Add case_documents and case_document_versions tables for workspace collaboration
-- Purpose: Extends the document management system with versioning, digital signatures, and enhanced collaboration

create table public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null,
  description text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_document_versions (
  id uuid primary key default gen_random_uuid(),
  case_document_id uuid not null references public.case_documents(id) on delete cascade,
  file_name text not null,
  file_type text,
  file_size text,
  storage_path text not null unique,
  version_number integer not null,
  uploaded_by uuid,
  uploaded_by_role text,
  signed_storage_path text unique,
  signed_by uuid,
  signed_by_role text,
  signed_at timestamptz,
  encrypted boolean not null default true,
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index idx_case_documents_case_id on public.case_documents(case_id);
create index idx_case_documents_archived on public.case_documents(archived);
create index idx_case_document_versions_document_id on public.case_document_versions(case_document_id);
create index idx_case_document_versions_created_at on public.case_document_versions(created_at);
create index idx_case_document_versions_storage_path on public.case_document_versions(storage_path);

-- Update case_activities to include new workspace activity types
-- Note: case_activities table already exists, no changes needed
-- The application will insert activity records with type values like:
-- - 'workspace_document_uploaded'
-- - 'workspace_document_signed'
-- - 'workspace_document_archived'

-- Ensure RLS is enabled
alter table public.case_documents enable row level security;
alter table public.case_document_versions enable row level security;

-- RLS policies will be handled in 02_rls.sql
