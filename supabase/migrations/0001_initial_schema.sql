-- ============================================================
-- Financia Casera - Esquema inicial
-- Aplicación de finanzas familiares (Paraguay - PYG/USD)
-- ============================================================

-- ---------- FAMILIAS ----------
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------- PERFILES (1:1 con auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- ---------- MIEMBROS DE LA FAMILIA ----------
-- user_id nullable: permite miembros sin cuenta (ej: niños, pareja sin login).
-- active = false cuando alguien se va de la familia (historial conservado).
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  color text not null default '#64748b',
  role text not null default 'member' check (role in ('admin','member')),
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  left_at timestamptz
);
create index family_members_family_idx on public.family_members(family_id);
create unique index family_members_user_active_idx
  on public.family_members(family_id, user_id) where user_id is not null and active;

-- ---------- CATEGORÍAS ----------
create table public.category_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('income','expense')),
  icon text not null default '📌',
  color text not null default '#94a3b8'
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  icon text not null default '📌',
  color text not null default '#94a3b8',
  created_at timestamptz not null default now()
);
create index categories_family_idx on public.categories(family_id);

-- ---------- MOVIMIENTOS (ingresos y gastos) ----------
-- currency: PYG o USD. pyg_rate = tasa USD->PYG al momento de registrar,
-- para poder unificar totales en guaraníes.
-- scope: 'family' = gasto de la familia en general,
--        'members' = asignado a miembros específicos (ver transaction_members).
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  amount numeric(18,2) not null check (amount > 0),
  currency text not null default 'PYG' check (currency in ('PYG','USD')),
  pyg_rate numeric(12,2) not null default 1,
  category_id uuid references public.categories(id) on delete set null,
  description text,
  date date not null default current_date,
  scope text not null default 'family' check (scope in ('family','members')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index transactions_family_date_idx on public.transactions(family_id, date desc);
create index transactions_category_idx on public.transactions(category_id);

-- Reparto del movimiento entre miembros (para gastos personales/asignados)
create table public.transaction_members (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  member_id uuid not null references public.family_members(id) on delete cascade,
  amount numeric(18,2) not null check (amount >= 0),
  primary key (transaction_id, member_id)
);

-- ---------- PRESUPUESTOS MENSUALES ----------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month char(7) not null, -- 'YYYY-MM'
  amount numeric(18,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (family_id, category_id, month)
);
create index budgets_family_month_idx on public.budgets(family_id, month);

-- ---------- CUENTAS FIJAS (gastos recurrentes) ----------
create table public.recurring_bills (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  amount numeric(18,2) not null check (amount > 0),
  currency text not null default 'PYG' check (currency in ('PYG','USD')),
  pyg_rate numeric(12,2) not null default 1,
  category_id uuid references public.categories(id) on delete set null,
  due_day int not null check (due_day between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index recurring_bills_family_idx on public.recurring_bills(family_id);

-- ---------- CUENTAS POR PAGAR / DEUDAS ----------
-- direction: 'owe' = debemos (préstamo, cuota), 'lent' = nos deben
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  direction text not null default 'owe' check (direction in ('owe','lent')),
  counterparty text,
  total_amount numeric(18,2) not null check (total_amount > 0),
  paid_amount numeric(18,2) not null default 0,
  currency text not null default 'PYG' check (currency in ('PYG','USD')),
  pyg_rate numeric(12,2) not null default 1,
  due_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index debts_family_idx on public.debts(family_id);

-- ---------- TASA DE CAMBIO USD -> PYG ----------
create table public.fx_rates (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  day date not null default current_date,
  rate numeric(12,2) not null check (rate > 0),
  created_at timestamptz not null default now(),
  unique (family_id, day)
);

-- ============================================================
-- SEGURIDAD (Row Level Security)
-- ============================================================

create or replace function public.is_family_member(fam uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from family_members m
    where m.family_id = fam and m.user_id = auth.uid() and m.active
  );
$$;

create or replace function public.is_family_admin(fam uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from family_members m
    where m.family_id = fam and m.user_id = auth.uid()
      and m.active and m.role = 'admin'
  );
$$;

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.family_members enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_members enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_bills enable row level security;
alter table public.debts enable row level security;
alter table public.fx_rates enable row level security;
alter table public.category_templates enable row level security;

create policy "families_read" on public.families
  for select using (public.is_family_member(id));
create policy "families_update_admin" on public.families
  for update using (public.is_family_admin(id));

create policy "profiles_read_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

create policy "members_read" on public.family_members
  for select using (public.is_family_member(family_id));
create policy "members_insert_admin" on public.family_members
  for insert with check (public.is_family_admin(family_id));
create policy "members_update_admin" on public.family_members
  for update using (public.is_family_admin(family_id));
create policy "members_delete_admin" on public.family_members
  for delete using (public.is_family_admin(family_id));

create policy "categories_read" on public.categories
  for select using (public.is_family_member(family_id));
create policy "categories_write" on public.categories
  for insert with check (public.is_family_member(family_id));
create policy "categories_update" on public.categories
  for update using (public.is_family_member(family_id));
create policy "categories_delete" on public.categories
  for delete using (public.is_family_member(family_id));

create policy "transactions_read" on public.transactions
  for select using (public.is_family_member(family_id));
create policy "transactions_write" on public.transactions
  for insert with check (public.is_family_member(family_id));
create policy "transactions_update" on public.transactions
  for update using (public.is_family_member(family_id));
create policy "transactions_delete" on public.transactions
  for delete using (public.is_family_member(family_id));

create policy "tx_members_all" on public.transaction_members
  for all using (
    exists (select 1 from transactions t where t.id = transaction_id
            and public.is_family_member(t.family_id))
  )
  with check (
    exists (select 1 from transactions t where t.id = transaction_id
            and public.is_family_member(t.family_id))
  );

create policy "budgets_all" on public.budgets
  for all using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

create policy "bills_all" on public.recurring_bills
  for all using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

create policy "debts_all" on public.debts
  for all using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

create policy "fx_read" on public.fx_rates
  for select using (public.is_family_member(family_id));
create policy "fx_write" on public.fx_rates
  for insert with check (public.is_family_member(family_id));
create policy "fx_update" on public.fx_rates
  for update using (public.is_family_member(family_id));

-- ============================================================
-- FUNCIONES DE APLICACIÓN
-- ============================================================

-- Genera un código de invitación legible (sin caracteres confusos)
create or replace function public.gen_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
begin
  for i in 1..6 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

-- Crea una familia nueva: familia + admin + categorías por defecto
create or replace function public.create_family(p_name text)
returns public.families
language plpgsql security definer set search_path = public
as $$
declare
  fam public.families;
  uid uuid := auth.uid();
  uname text;
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;

  select full_name into uname from profiles where id = uid;

  insert into families (name, invite_code, created_by)
  values (trim(p_name), gen_invite_code(), uid)
  returning * into fam;

  insert into family_members (family_id, user_id, name, color, role)
  values (fam.id, uid, coalesce(nullif(uname,''), 'Yo'), '#16a34a', 'admin');

  insert into categories (family_id, name, type, icon, color)
  select fam.id, name, type, icon, color from category_templates;

  return fam;
end;
$$;

-- Se une a una familia con código de invitación
create or replace function public.join_family(p_code text)
returns public.families
language plpgsql security definer set search_path = public
as $$
declare
  fam public.families;
  uid uuid := auth.uid();
  uname text;
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;

  select * into fam from families
  where invite_code = upper(trim(p_code));

  if not found then
    raise exception 'Código inválido';
  end if;

  -- Reactivar membresía si antes estuvo en esta familia
  update family_members set active = true, left_at = null, user_id = uid
  where family_id = fam.id and user_id = uid and not active;

  if not found then
    select full_name into uname from profiles where id = uid;
    insert into family_members (family_id, user_id, name, color, role)
    values (fam.id, uid, coalesce(nullif(uname,''), 'Miembro'), '#16a34a', 'member')
    on conflict do nothing;
  end if;

  return fam;
end;
$$;

-- Permite que cualquier miembro se retire de su familia actual por su cuenta
create or replace function public.leave_family()
returns void
language plpgsql security definer set search_path = public
as $$
declare fam uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  select family_id into fam from family_members
  where user_id = auth.uid() and active
  limit 1;

  if fam is null then
    return;
  end if;

  update family_members
  set active = false, left_at = now(), user_id = null
  where family_id = fam and user_id = auth.uid() and active;

  -- Si era el último admin, promover al miembro activo más antiguo
  if not exists (
    select 1 from family_members where family_id = fam and active and role = 'admin'
  ) then
    update family_members set role = 'admin'
    where id = (
      select id from family_members where family_id = fam and active
      order by joined_at limit 1
    );
  end if;
end;
$$;

-- ============================================================
-- SEED: categorías por defecto (contexto paraguayo)
-- ============================================================
insert into public.category_templates (name, type, icon, color) values
  -- Gastos
  ('Mercado',            'expense', '🛒', '#f59e0b'),
  ('Luz (ANDE)',         'expense', '💡', '#eab308'),
  ('Agua (ESSAP)',       'expense', '💧', '#3b82f6'),
  ('Gas',                'expense', '🔥', '#f97316'),
  ('Internet',           'expense', '📶', '#06b6d4'),
  ('Teléfono',           'expense', '📱', '#8b5cf6'),
  ('Cable / TV',         'expense', '📺', '#64748b'),
  ('Alquiler',           'expense', '🏠', '#ef4444'),
  ('Transporte',         'expense', '🚌', '#10b981'),
  ('Gasolina',           'expense', '⛽', '#84cc16'),
  ('Salud',              'expense', '🏥', '#ec4899'),
  ('Educación',          'expense', '🎒', '#14b8a6'),
  ('Ropa',               'expense', '👕', '#6366f1'),
  ('Hogar',              'expense', '🧽', '#78716c'),
  ('Regalos y fiestas',  'expense', '🎁', '#e879f9'),
  ('Salidas',            'expense', '🍽️', '#fb923c'),
  ('Ahorro',             'expense', '🐖', '#22c55e'),
  ('Otros gastos',       'expense', '📌', '#94a3b8'),
  -- Ingresos
  ('Sueldo',             'income', '💼', '#16a34a'),
  ('Negocio / Extra',    'income', '🧾', '#0d9488'),
  ('Venta',              'income', '🏷️', '#2563eb'),
  ('Bono / Beneficio',   'income', '🎉', '#d946ef'),
  ('Otros ingresos',     'income', '💰', '#65a30d');

-- ============================================================
-- PERFIL AUTOMÁTICO al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
