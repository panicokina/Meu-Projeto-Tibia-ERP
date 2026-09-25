-- Execute no SQL Editor do Supabase para habilitar a sincronização dos preços.
alter table public.tibia_dashboard
add column if not exists imbuement_prices jsonb;
