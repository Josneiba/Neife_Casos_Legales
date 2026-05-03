-- NEIFE — ejecutar primero en SQL Editor (Supabase)
-- Orden: 01_schema → 02_rls → 03_storage → 04_realtime (opcional)

create extension if not exists "uuid-ossp";

create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  role          text not null check (role in ('client', 'lawyer')),
  full_name     text not null,
  email         text not null,
  phone         text,
  city          text,
  bio           text,
  avatar_url    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table public.lawyer_profiles (
  id                  uuid references public.profiles(id) on delete cascade primary key,
  title               text,
  license_number      text,
  experience_years    int default 0,
  success_rate        int default 0,
  verified            boolean default false,
  hourly_rate         numeric(10,2),
  fixed_rate          numeric(10,2),
  monthly_retainer    numeric(10,2),
  contingency_rate    int,
  free_consult        boolean default false,
  payment_plan        boolean default false,
  contingency         boolean default false,
  min_client_budget   numeric(10,2),
  rating              numeric(3,2) default 0,
  review_count        int default 0,
  available           boolean default true,
  specialties         text[] default '{}',
  availability_grid   jsonb default '{}',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table public.lawyer_experience (
  id          uuid default uuid_generate_v4() primary key,
  lawyer_id   uuid references public.lawyer_profiles(id) on delete cascade,
  company     text not null,
  role        text not null,
  period      text,
  description text,
  created_at  timestamptz default now()
);

create table public.cases (
  id              uuid default uuid_generate_v4() primary key,
  title           text not null,
  type            text not null,
  description     text,
  status          text not null default 'waiting'
                    check (status in ('waiting','active','pending','inProgress','completed','rejected')),
  priority        text default 'medium' check (priority in ('low','medium','high')),
  progress        int default 0 check (progress between 0 and 100),
  budget          numeric(10,2),
  next_action     text,
  client_id       uuid references public.profiles(id) on delete cascade,
  lawyer_id       uuid references public.profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table public.case_requests (
  id            uuid default uuid_generate_v4() primary key,
  case_id       uuid references public.cases(id) on delete cascade,
  client_id     uuid references public.profiles(id),
  lawyer_id     uuid references public.profiles(id),
  message       text,
  status        text default 'pending' check (status in ('pending','accepted','rejected')),
  created_at    timestamptz default now(),
  responded_at  timestamptz
);

create table public.case_activities (
  id          uuid default uuid_generate_v4() primary key,
  case_id     uuid references public.cases(id) on delete cascade,
  type        text not null,
  title       text not null,
  description text,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);

create table public.case_notes (
  id          uuid default uuid_generate_v4() primary key,
  case_id     uuid references public.cases(id) on delete cascade,
  lawyer_id   uuid references public.profiles(id),
  content     text,
  updated_at  timestamptz default now()
);

create table public.next_steps (
  id            uuid default uuid_generate_v4() primary key,
  case_id       uuid references public.cases(id) on delete cascade,
  text          text not null,
  completed     boolean default false,
  due_date      date,
  assigned_to   text check (assigned_to in ('client','lawyer')),
  created_at    timestamptz default now()
);

create table public.documents (
  id            uuid default uuid_generate_v4() primary key,
  case_id       uuid references public.cases(id) on delete cascade,
  name          text not null,
  file_type     text,
  file_url      text not null,
  file_size     text,
  uploaded_by   uuid references public.profiles(id),
  uploaded_by_role text,
  created_at    timestamptz default now()
);

create table public.conversations (
  id            uuid default uuid_generate_v4() primary key,
  client_id     uuid references public.profiles(id),
  lawyer_id     uuid references public.profiles(id),
  case_id       uuid references public.cases(id),
  last_message  text,
  last_message_at timestamptz default now(),
  created_at    timestamptz default now(),
  unique(client_id, lawyer_id)
);

create table public.messages (
  id              uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id       uuid references public.profiles(id),
  sender_role     text check (sender_role in ('client','lawyer')),
  text            text not null,
  read            boolean default false,
  created_at      timestamptz default now()
);

create table public.reviews (
  id          uuid default uuid_generate_v4() primary key,
  lawyer_id   uuid references public.profiles(id),
  client_id   uuid references public.profiles(id),
  case_id     uuid references public.cases(id),
  rating      int check (rating between 1 and 5),
  text        text,
  created_at  timestamptz default now()
);

create table public.client_case_posts (
  id              uuid default uuid_generate_v4() primary key,
  client_id       uuid references public.profiles(id),
  title           text not null,
  type            text not null,
  urgency         text default 'normal' check (urgency in ('normal','urgent','very-urgent')),
  budget_min      numeric(10,2),
  budget_max      numeric(10,2),
  city            text,
  client_type     text default 'Particular' check (client_type in ('Particular','Empresa')),
  description     text,
  case_type       text,
  response_needed text,
  status          text default 'open' check (status in ('open','taken','closed')),
  created_at      timestamptz default now()
);

create table public.lawyer_proposals (
  id              uuid default uuid_generate_v4() primary key,
  post_id         uuid references public.client_case_posts(id) on delete cascade,
  lawyer_id       uuid references public.profiles(id),
  client_id       uuid references public.profiles(id),
  message         text,
  proposed_rate   numeric(10,2),
  estimated_time  text,
  status          text default 'pending' check (status in ('pending','accepted','rejected')),
  created_at      timestamptz default now()
);

create index on public.cases(client_id);
create index on public.cases(lawyer_id);
create index on public.cases(status);
create index on public.case_requests(lawyer_id, status);
create index on public.messages(conversation_id, created_at);
create index on public.conversations(client_id);
create index on public.conversations(lawyer_id);
create index on public.client_case_posts(status, type);
create index on public.lawyer_profiles(verified, available);

create or replace function public.update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.lawyer_profiles
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.cases
  for each row execute function public.update_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );

  if new.raw_user_meta_data->>'role' = 'lawyer' then
    insert into public.lawyer_profiles (id) values (new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.update_lawyer_rating()
returns trigger as $$
begin
  update public.lawyer_profiles
  set
    rating = (select avg(rating)::numeric(3,2) from public.reviews where lawyer_id = new.lawyer_id),
    review_count = (select count(*)::int from public.reviews where lawyer_id = new.lawyer_id)
  where id = new.lawyer_id;
  return new;
end;
$$ language plpgsql;

create trigger on_review_added
  after insert on public.reviews
  for each row execute function public.update_lawyer_rating();
