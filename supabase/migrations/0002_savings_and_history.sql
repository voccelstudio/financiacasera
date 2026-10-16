-- ============================================================
-- Financia Casera - Migración 0002
-- Metas de ahorro + historial de pagos de cuentas fijas
-- (aporta a las funciones nuevas: metas, logros e historial)
-- ============================================================

-- ---------- METAS DE AHORRO ----------
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  emoji text not null default '🎯',
  target_amount numeric(18,2) not null check (target_amount > 0),
  currency text not null default 'PYG' check (currency in ('PYG','USD')),
  pyg_rate numeric(12,2) not null default 1,
  deadline date,
  archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index savings_goals_family_idx on public.savings_goals(family_id);

-- ---------- APORTES A LAS METAS ----------
-- amount se guarda en la moneda de la meta (currency = moneda de la meta).
create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.family_members(id) on delete set null,
  amount numeric(18,2) not null check (amount > 0),
  currency text not null default 'PYG' check (currency in ('PYG','USD')),
  pyg_rate numeric(12,2) not null default 1,
  note text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);
create index goal_contributions_goal_idx on public.goal_contributions(goal_id);
create index goal_contributions_family_idx on public.goal_contributions(family_id);

-- ---------- HISTORIAL DE PAGOS DE CUENTAS FIJAS ----------
-- Cada «Pagar» deja registro acá: permite ver si la tarifa subió mes a mes.
create table public.bill_payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.recurring_bills(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  amount numeric(18,2) not null check (amount > 0),
  currency text not null default 'PYG' check (currency in ('PYG','USD')),
  pyg_rate numeric(12,2) not null default 1,
  paid_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index bill_payments_bill_idx on public.bill_payments(bill_id, paid_at desc);
create index bill_payments_family_idx on public.bill_payments(family_id);

-- ---------- RLS ----------
alter table public.savings_goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.bill_payments enable row level security;

create policy "goals_all" on public.savings_goals
  for all using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

create policy "goal_contributions_all" on public.goal_contributions
  for all using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

create policy "bill_payments_all" on public.bill_payments
  for all using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));
