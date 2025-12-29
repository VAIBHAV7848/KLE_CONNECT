-- Enable pgvector extension
create extension if not exists vector;

-- Subject hierarchy (denormalized for simplicity)
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  semester text not null,
  course text not null,
  unit text not null,
  topic text not null,
  created_at timestamptz default now()
);

-- Materials uploaded (one row per file)
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subject_id uuid references subjects(id) on delete cascade,
  title text not null,
  file_type text not null, -- pdf | image | doc | txt
  storage_path text not null, -- path in Supabase storage
  page_count int default 0,
  created_at timestamptz default now()
);

-- Extracted chunks from materials
create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references materials(id) on delete cascade,
  subject_id uuid references subjects(id) on delete cascade,
  page_number int,
  ordinal int, -- order within a page
  content text not null,
  created_at timestamptz default now()
);

-- Embeddings for chunks
create table if not exists embeddings (
  chunk_id uuid primary key references chunks(id) on delete cascade,
  embedding vector(1536) -- adjust dimension to model used
);

-- Generated assets (summaries, mcq, flashcards)
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) on delete cascade,
  material_id uuid references materials(id) on delete cascade,
  kind text not null, -- summary | mcq | flashcards | short-answers
  payload jsonb not null,
  created_at timestamptz default now()
);
