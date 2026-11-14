-- KEEP A STORE: run this in Supabase SQL Editor.
-- IMPORTANT: review this schema before production deployment.

create extension if not exists pgcrypto;

create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  store_name text not null default 'Keepa',
  tagline text default 'A little something beautiful.',
  whatsapp_number text default '',
  instagram_url text default '',
  contact_email text default '',
  currency text not null default 'INR',
  announcement text default 'A little luxury, every day.',
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text default '',
  price numeric(12,2) not null check (price >= 0),
  sale_price numeric(12,2) check (sale_price is null or (sale_price >= 0 and sale_price <= price)),
  stock integer not null default 0 check (stock >= 0),
  image_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_created_idx on public.products (is_active, created_at desc);
create index if not exists products_category_idx on public.products (category);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  pincode text not null,
  notes text default '',
  total numeric(12,2) not null check (total >= 0),
  status text not null default 'new'
    check (status in ('new','contacted','confirmed','processing','shipped','delivered','cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0)
);

create table if not exists public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  change_amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_at timestamptz not null default now()
);

-- Admin role is checked from app_metadata, which users cannot edit themselves.
create or replace function public.is_admin()
returns boolean
language sql stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

alter table public.store_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.order_status_history enable row level security;

-- Public can read only public store information and active products.
create policy "public read store settings" on public.store_settings for select using (true);
create policy "admin manage store settings" on public.store_settings for all using (public.is_admin()) with check (public.is_admin());

create policy "public read categories" on public.categories for select using (true);
create policy "admin manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "public read active products" on public.products for select using (is_active = true or public.is_admin());
create policy "admin manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- Customers must create orders through the create-order Edge Function.
-- No anonymous direct insert/select/update policies are granted on orders or order_items.
create policy "admin manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage order items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read inventory logs" on public.inventory_logs for select using (public.is_admin());
create policy "admin insert inventory logs" on public.inventory_logs for insert with check (public.is_admin());
create policy "admin read order history" on public.order_status_history for select using (public.is_admin());
create policy "admin insert order history" on public.order_status_history for insert with check (public.is_admin());

-- Storage bucket for product images. Public read; authenticated admin writes only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public view product images" on storage.objects
for select using (bucket_id = 'product-images');

create policy "admin upload product images" on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

create policy "admin update product images" on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

create policy "admin delete product images" on storage.objects
for delete to authenticated
using (bucket_id = 'product-images' and public.is_admin());

-- Add initial category examples.
insert into public.categories(name) values
('Cosmetics'), ('Bangles'), ('Hair Accessories'), ('Jewellery'), ('Beauty Tools'), ('Gift Sets')
on conflict (name) do nothing;
