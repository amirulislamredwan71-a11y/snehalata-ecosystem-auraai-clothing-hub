-- ============================================================================
-- Neural Grid A3 (semantic + visual search) + A6 (trust/governance)
-- Run once in the Supabase SQL editor. Project: tfavcmbbtpgapqdnblzq (snehalata)
-- Safe to re-run (IF NOT EXISTS / OR REPLACE).
-- ============================================================================

-- ---- A3: pgvector semantic + visual "search by photo" -----------------------
create extension if not exists vector;

-- Gemini text-embedding-004 = 768 dims.
alter table public.products add column if not exists embedding vector(768);

-- HNSW cosine index (no training step needed; good for small + growing catalogs).
create index if not exists idx_products_embedding
  on public.products using hnsw (embedding vector_cosine_ops);

-- Nearest-neighbour search over active products (cosine similarity, 0..1).
create or replace function public.match_products(
  query_embedding vector(768),
  match_count int default 12
) returns table (id bigint, similarity float)
language sql stable
set search_path = public
as $$
  select p.id, 1 - (p.embedding <=> query_embedding) as similarity
  from public.products p
  where p.embedding is not null
    and (p.is_active is null or p.is_active = true)
  order by p.embedding <=> query_embedding
  limit match_count;
$$;

-- ---- A6: governance columns -------------------------------------------------
-- Listing moderation (Aura "Neural Verified" signal).
alter table public.products add column if not exists moderation_score int;
alter table public.products add column if not exists moderation_note  text;

-- COD-fraud risk scoring per order.
alter table public.orders   add column if not exists fraud_score  int;
alter table public.orders   add column if not exists fraud_reason text;

-- Done. Next: hit POST /api/admin/embeddings/backfill (admin key) to embed the
-- existing catalog, after which semantic + photo search go live.
