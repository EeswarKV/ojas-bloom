-- ============================================================
-- Ojas Bloom Studio Manager — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ---------- students ----------
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  type text not null check (type in ('Online', 'Offline')) default 'Offline',
  timing text,
  fee numeric(10,2) not null,
  next_due_date date not null,
  created_at timestamptz not null default now()
);

-- ---------- payments (income ledger, one row per fee collected) ----------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete set null,
  student_name text not null,       -- snapshot so history survives student deletion
  amount numeric(10,2) not null,
  date date not null,
  created_at timestamptz not null default now()
);

-- ---------- expenses (paid entries + pending bills, one-time or recurring) ----------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  amount numeric(10,2) not null,
  status text not null check (status in ('paid', 'pending')) default 'paid',
  date date not null,               -- date the expense was entered / incurred
  paid_date date,                   -- set when status = 'paid'
  due_date date,                    -- set when status = 'pending'
  recurrence text not null check (recurrence in ('one-time', 'monthly')) default 'one-time',
  note text,
  created_at timestamptz not null default now()
);

-- ---------- notes ----------
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists idx_students_next_due on students(next_due_date);
create index if not exists idx_payments_date on payments(date);
create index if not exists idx_expenses_date on expenses(date);
create index if not exists idx_expenses_paid_date on expenses(paid_date);
create index if not exists idx_expenses_due_date on expenses(due_date);
create index if not exists idx_expenses_status on expenses(status);

-- ============================================================
-- Row Level Security
-- Model: single shared studio workspace — any signed-in staff
-- member can read/write everything (matches the current app).
-- If you later add multiple studios, swap these for per-studio
-- scoping using a studio_id column + auth.jwt() claims.
-- ============================================================
alter table students enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table notes    enable row level security;

create policy "staff full access - students" on students
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "staff full access - payments" on payments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "staff full access - expenses" on expenses
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "staff full access - notes" on notes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- Convenience views — mirror the app's "overdue" logic in SQL
-- so you can sanity-check numbers straight from the SQL editor.
-- ============================================================
create or replace view v_overdue_students as
  select * from students where next_due_date <= current_date;

create or replace view v_overdue_bills as
  select * from expenses where status = 'pending' and due_date <= current_date;

create or replace view v_monthly_income as
  select to_char(date, 'YYYY-MM') as month_key, sum(amount) as total
  from payments
  group by 1
  order by 1 desc;

create or replace view v_monthly_expense as
  select to_char(coalesce(paid_date, date), 'YYYY-MM') as month_key, sum(amount) as total
  from expenses
  where status = 'paid'
  group by 1
  order by 1 desc;
