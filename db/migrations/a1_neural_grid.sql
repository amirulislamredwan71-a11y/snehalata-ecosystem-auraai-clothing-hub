-- ============================================================================
-- Neural Grid A1 — event capture + product stats (run once in Supabase SQL editor)
-- Project: tfavcmbbtpgapqdnblzq  (snehalata)
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / ON CONFLICT throughout.
-- Only the server (service_role) touches these tables; RLS on, no public policy.
-- ============================================================================

-- Raw interaction log — the actual "grid".
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  event_type  text   not null,            -- view | search | add_to_cart | purchase | try_on
  product_id  bigint,
  vendor_id   bigint,
  session_id  text,
  meta        jsonb  not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_events_type_time on public.events (event_type, created_at desc);
create index if not exists idx_events_product   on public.events (product_id);
create index if not exists idx_events_session   on public.events (session_id);

-- Rolling per-product aggregates (real-time, bumped by the API; recomputable by cron later).
create table if not exists public.product_stats (
  product_id   bigint primary key,
  views        bigint  not null default 0,
  add_to_cart  bigint  not null default 0,
  purchases    bigint  not null default 0,
  revenue      numeric not null default 0,
  trend_score  numeric not null default 0,
  updated_at   timestamptz not null default now()
);

-- Lock down: server-only. (service_role bypasses RLS; enabling it blocks anon/auth.)
alter table public.events        enable row level security;
alter table public.product_stats enable row level security;

-- Atomic increment used by /api/events and /api/orders (weights: view 1, cart 3, purchase 8).
create or replace function public.bump_product_stats(
  p_product_id  bigint,
  p_views       bigint  default 0,
  p_add_to_cart bigint  default 0,
  p_purchases   bigint  default 0,
  p_revenue     numeric default 0
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.product_stats as ps
    (product_id, views, add_to_cart, purchases, revenue, trend_score, updated_at)
  values
    (p_product_id, p_views, p_add_to_cart, p_purchases, p_revenue,
     (p_views + 3*p_add_to_cart + 8*p_purchases), now())
  on conflict (product_id) do update set
    views       = ps.views       + excluded.views,
    add_to_cart = ps.add_to_cart + excluded.add_to_cart,
    purchases   = ps.purchases   + excluded.purchases,
    revenue     = ps.revenue     + excluded.revenue,
    trend_score = (ps.views + excluded.views)
                + 3*(ps.add_to_cart + excluded.add_to_cart)
                + 8*(ps.purchases   + excluded.purchases),
    updated_at  = now();
$$;

-- ---------------------------------------------------------------------------
-- Backfill from real history so the Grid is alive from day one.
-- ---------------------------------------------------------------------------
insert into public.product_stats (product_id, purchases, revenue, trend_score, updated_at)
select oi.product_id,
       coalesce(sum(oi.quantity), 0)   as purchases,
       coalesce(sum(oi.line_total), 0) as revenue,
       8 * coalesce(sum(oi.quantity), 0) as trend_score,
       now()
from public.order_items oi
where oi.product_id is not null
group by oi.product_id
on conflict (product_id) do update set
  purchases   = excluded.purchases,
  revenue     = excluded.revenue,
  trend_score = public.product_stats.views
              + 3*public.product_stats.add_to_cart
              + 8*excluded.purchases,
  updated_at  = now();

insert into public.events (event_type, product_id, vendor_id, session_id, meta, created_at)
select 'purchase', oi.product_id, oi.vendor_id, 'backfill',
       jsonb_build_object('order_id', oi.order_id, 'qty', oi.quantity), now()
from public.order_items oi
where oi.product_id is not null;

-- Done. /api/events now ingests live events and /api/stats reflects real numbers.
