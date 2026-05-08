-- PostgreSQL/Supabase-ready schema for STACKFAST.
create type project_status as enum ('draft', 'planning', 'building', 'testing', 'deploying', 'live', 'failed');
create type pipeline_status as enum ('pending', 'running', 'complete', 'failed');

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  prompt text not null,
  status project_status not null default 'draft',
  current_step integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pipeline_steps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text not null,
  status pipeline_status not null default 'pending',
  logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pipeline_steps_project_id_idx on pipeline_steps(project_id);
