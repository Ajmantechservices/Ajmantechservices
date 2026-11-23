-- ==========================================================
-- AJMANTECH ELECTRICAL & LIGHTING STORE - SUPABASE SCHEMA
-- Non-destructive, idempotent schema + strict RLS access control
-- ==========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Supabase Auth User Profiles & Role Management)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  phone text,
  default_address jsonb default '{}'::jsonb,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists default_address jsonb default '{}'::jsonb;

-- Verified admin helper: strictly inspects JWT app_metadata.role (server-controlled).
-- NEVER trusts user_metadata or client-supplied role claims.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin';
$$;

-- Prevent non-admin users from escalating their own role in public.profiles
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public.is_admin() and current_user not in ('postgres', 'supabase_admin', 'service_role') then
      raise exception 'Unauthorized: role cannot be modified by non-administrator';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_self_escalation on public.profiles;
create trigger trg_prevent_role_self_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_role_self_escalation();

-- Automatic trigger to create a profile row whenever a new user signs up in auth.users.
-- Strictly derives role ONLY from raw_app_meta_data (never raw_user_meta_data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  if lower(coalesce(new.email, '')) = 'joshuaajayi0148@gmail.com'
     or coalesce(new.raw_app_meta_data->>'role', '') = 'admin' then
    assigned_role := 'admin';
  else
    assigned_role := 'customer';
  end if;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    assigned_role
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
      phone = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
      role = case
        when lower(coalesce(excluded.email, '')) = 'joshuaajayi0148@gmail.com'
             or coalesce(new.raw_app_meta_data->>'role', '') = 'admin' then 'admin'
        else public.profiles.role
      end,
      updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Ensure designated primary owner carries app_metadata.role = 'admin' if already registered
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
where lower(email) = 'joshuaajayi0148@gmail.com';

-- 2. CATEGORIES TABLE
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  image_url text,
  item_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories add column if not exists image_url text;

-- 3. PRODUCTS TABLE
create table if not exists public.products (
  id text primary key,
  name text not null,
  slug text,
  category_id text references public.categories(id) on delete set null,
  category_name text not null,
  price numeric not null check (price >= 0),
  original_price numeric,
  rating numeric default 5.0,
  review_count integer default 0,
  stock integer default 10,
  brand text default 'Generic',
  is_featured boolean default false,
  is_best_seller boolean default false,
  is_new boolean default false,
  is_energy_saving boolean default false,
  voltage text default '220V-240V',
  warranty text default '1 Year',
  image text not null,
  gallery jsonb default '[]'::jsonb,
  short_description text not null,
  full_description text not null,
  specifications jsonb default '{}'::jsonb,
  features jsonb default '[]'::jsonb,
  variants jsonb default '[]'::jsonb,
  tags jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists is_active boolean default true;

update public.products set image_url = image where image_url is null and image is not null;
update public.products set description = full_description where description is null and full_description is not null;
update public.products set category = category_name where category is null and category_name is not null;

-- 4. PRODUCT GALLERY TABLE
create table if not exists public.product_gallery (
  id uuid default uuid_generate_v4() primary key,
  product_id text references public.products(id) on delete cascade,
  image_url text not null,
  caption text,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ORDERS TABLE (Customer-owned via user_id)
create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  order_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric not null,
  amount numeric,
  reference text,
  service_name text,
  delivery_fee numeric default 0,
  installation_fee numeric default 0,
  status text not null default 'pending',
  payment_method text not null default 'bank_transfer',
  payment_status text not null default 'pending',
  delivery_address jsonb not null default '{}'::jsonb,
  delivery_notes text,
  tracking_history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now()) not null;
create index if not exists idx_orders_user_id on public.orders(user_id);

-- 6. SERVICE REQUESTS TABLE (Customer-owned via user_id)
create table if not exists public.service_requests (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  ticket_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  service_type text not null,
  service_name text not null,
  service_tier text,
  description text not null,
  location jsonb not null default '{}'::jsonb,
  preferred_date text,
  preferred_time text,
  is_emergency boolean default false,
  status text not null default 'submitted',
  assigned_technician text,
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.service_requests add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists idx_service_requests_user_id on public.service_requests(user_id);

-- 7. CUSTOMER ADDRESSES TABLE (Strictly customer-owned via user_id)
create table if not exists public.customer_addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Home',
  full_name text,
  street_address text not null,
  city text not null,
  state text not null,
  phone text not null,
  is_default boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_customer_addresses_user_id on public.customer_addresses(user_id);

-- 8. CUSTOMER WISHLISTS TABLE (Strictly customer-owned via user_id)
create table if not exists public.customer_wishlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

create index if not exists idx_customer_wishlists_user_id on public.customer_wishlists(user_id);

-- 9. REVIEWS & PRODUCT REVIEWS TABLES
create table if not exists public.reviews (
  id text primary key,
  product_id text,
  customer_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  date text not null,
  comment text not null,
  verified_purchase boolean default true,
  helpful_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.product_reviews (
  id text primary key,
  product_id text not null,
  author_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  verified_purchase boolean default true,
  helpful_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. STORE SETTINGS TABLE
create table if not exists public.store_settings (
  id text primary key default 'primary_settings',
  store_name text not null default 'AjmanTech Services',
  tagline text default '“Let There Be Light”',
  phone_number text not null default '+234 802 345 6789',
  alt_phone text,
  whatsapp_number text not null default '2348023456789',
  email text not null default 'support@ajmantech.ng',
  address text not null default 'Folabi Oyeyemi, Royalty Road, Ikota Villa Estate, Lekki, Lagos, Nigeria',
  opening_hours text default 'Mon - Sat: 8:00 AM - 6:00 PM',
  delivery_fee_lagos numeric default 2500,
  delivery_fee_other_states numeric default 6000,
  default_delivery_fee numeric default 4500,
  free_delivery_threshold numeric default 50000,
  delivery_rates jsonb default '{}'::jsonb,
  bank_details jsonb not null default '{"bankName": "Guaranty Trust Bank (GTBank)", "accountNumber": "0123456789", "accountName": "AjmanTech Electrical Services Ltd"}'::jsonb,
  promo_codes jsonb default '[]'::jsonb,
  social_links jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.store_settings add column if not exists tagline text;
alter table public.store_settings add column if not exists alt_phone text;
alter table public.store_settings add column if not exists opening_hours text;
alter table public.store_settings add column if not exists default_delivery_fee numeric default 4500;
alter table public.store_settings add column if not exists delivery_rates jsonb default '{}'::jsonb;
alter table public.store_settings add column if not exists promo_codes jsonb default '[]'::jsonb;
alter table public.store_settings add column if not exists social_links jsonb default '{}'::jsonb;

-- Note: Blog and technical articles have moved to external WordPress.
drop table if exists public.posts cascade;
drop table if exists public.blog_posts cascade;

-- ==========================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES - STRICT ACCESS CONTROL
-- ==========================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_gallery enable row level security;
alter table public.orders enable row level security;
alter table public.service_requests enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.customer_wishlists enable row level security;
alter table public.reviews enable row level security;
alter table public.product_reviews enable row level security;
alter table public.store_settings enable row level security;

-- Drop legacy overly-permissive policies
drop policy if exists "Allow users to view own profile" on public.profiles;
drop policy if exists "Allow users to update own profile" on public.profiles;
drop policy if exists "Allow insert on profiles" on public.profiles;
drop policy if exists "Allow public insert on orders" on public.orders;
drop policy if exists "Allow public select on orders" on public.orders;
drop policy if exists "Allow all modifications on orders" on public.orders;
drop policy if exists "Allow public insert on service_requests" on public.service_requests;
drop policy if exists "Allow public select on service_requests" on public.service_requests;
drop policy if exists "Allow all modifications on service_requests" on public.service_requests;
drop policy if exists "Allow all modifications on categories" on public.categories;
drop policy if exists "Allow all modifications on products" on public.products;
drop policy if exists "Allow all modifications on product_gallery" on public.product_gallery;
drop policy if exists "Allow all modifications on reviews" on public.reviews;
drop policy if exists "Allow all modifications on product_reviews" on public.product_reviews;
drop policy if exists "Allow all modifications on store_settings" on public.store_settings;

-- Profiles: users read/update own profile; admins manage all profiles
drop policy if exists "Profiles: own or admin select" on public.profiles;
create policy "Profiles: own or admin select"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Profiles: own insert" on public.profiles;
create policy "Profiles: own insert"
  on public.profiles for insert
  with check (auth.uid() = id and role = 'customer');

drop policy if exists "Profiles: own or admin update" on public.profiles;
create policy "Profiles: own or admin update"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Public Storefront Catalog (Read-only for public, Admin-only write)
drop policy if exists "Allow public read on categories" on public.categories;
create policy "Allow public read on categories"
  on public.categories for select using (true);

drop policy if exists "Categories: admin write" on public.categories;
create policy "Categories: admin write"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Allow public read on products" on public.products;
create policy "Allow public read on products"
  on public.products for select using (true);

drop policy if exists "Products: admin write" on public.products;
create policy "Products: admin write"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Allow public read on product_gallery" on public.product_gallery;
create policy "Allow public read on product_gallery"
  on public.product_gallery for select using (true);

drop policy if exists "Product Gallery: admin write" on public.product_gallery;
create policy "Product Gallery: admin write"
  on public.product_gallery for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Allow public read on store_settings" on public.store_settings;
create policy "Allow public read on store_settings"
  on public.store_settings for select using (true);

drop policy if exists "Store Settings: admin write" on public.store_settings;
create policy "Store Settings: admin write"
  on public.store_settings for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Allow public read on reviews" on public.reviews;
create policy "Allow public read on reviews"
  on public.reviews for select using (true);

drop policy if exists "Allow public insert on reviews" on public.reviews;
create policy "Allow public insert on reviews"
  on public.reviews for insert with check (true);

drop policy if exists "Reviews: admin write" on public.reviews;
create policy "Reviews: admin write"
  on public.reviews for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Reviews: admin delete" on public.reviews;
create policy "Reviews: admin delete"
  on public.reviews for delete using (public.is_admin());

drop policy if exists "Allow public read on product_reviews" on public.product_reviews;
create policy "Allow public read on product_reviews"
  on public.product_reviews for select using (true);

drop policy if exists "Allow public insert on product_reviews" on public.product_reviews;
create policy "Allow public insert on product_reviews"
  on public.product_reviews for insert with check (true);

drop policy if exists "Product Reviews: admin write" on public.product_reviews;
create policy "Product Reviews: admin write"
  on public.product_reviews for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Product Reviews: admin delete" on public.product_reviews;
create policy "Product Reviews: admin delete"
  on public.product_reviews for delete using (public.is_admin());

-- Orders: Customer owns their own orders (by auth.uid()), Guest checkout can insert with user_id is null, Admins manage all
drop policy if exists "Orders: own or admin select" on public.orders;
create policy "Orders: own or admin select"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Orders: authenticated own or guest insert" on public.orders;
create policy "Orders: authenticated own or guest insert"
  on public.orders for insert
  with check (
    public.is_admin()
    or (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null)
  );

drop policy if exists "Orders: admin update" on public.orders;
create policy "Orders: admin update"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Orders: admin delete" on public.orders;
create policy "Orders: admin delete"
  on public.orders for delete
  using (public.is_admin());

-- Service Requests: Customer owns their own requests (by auth.uid()), Guest booking can insert with user_id is null, Admins manage all
drop policy if exists "Service Requests: own or admin select" on public.service_requests;
create policy "Service Requests: own or admin select"
  on public.service_requests for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Service Requests: authenticated own or guest insert" on public.service_requests;
create policy "Service Requests: authenticated own or guest insert"
  on public.service_requests for insert
  with check (
    public.is_admin()
    or (auth.uid() is not null and user_id = auth.uid())
    or (auth.uid() is null and user_id is null)
  );

drop policy if exists "Service Requests: admin update" on public.service_requests;
create policy "Service Requests: admin update"
  on public.service_requests for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Service Requests: admin delete" on public.service_requests;
create policy "Service Requests: admin delete"
  on public.service_requests for delete
  using (public.is_admin());

-- Customer Addresses: Customer full CRUD on own rows ONLY, Admin read-only for fulfillment
drop policy if exists "Addresses: own or admin select" on public.customer_addresses;
create policy "Addresses: own or admin select"
  on public.customer_addresses for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Addresses: own insert" on public.customer_addresses;
create policy "Addresses: own insert"
  on public.customer_addresses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Addresses: own update" on public.customer_addresses;
create policy "Addresses: own update"
  on public.customer_addresses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Addresses: own delete" on public.customer_addresses;
create policy "Addresses: own delete"
  on public.customer_addresses for delete
  using (auth.uid() = user_id);

-- Customer Wishlists: Customer full CRUD on own rows ONLY, Admin read-only visibility
drop policy if exists "Wishlists: own or admin select" on public.customer_wishlists;
create policy "Wishlists: own or admin select"
  on public.customer_wishlists for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Wishlists: own insert" on public.customer_wishlists;
create policy "Wishlists: own insert"
  on public.customer_wishlists for insert
  with check (auth.uid() = user_id);

drop policy if exists "Wishlists: own delete" on public.customer_wishlists;
create policy "Wishlists: own delete"
  on public.customer_wishlists for delete
  using (auth.uid() = user_id);

-- Privacy-preserving Order Tracking RPC (requires matching order number AND email or payment reference)
create or replace function public.track_order_secure(
  p_order_number text,
  p_email_or_token text
)
returns table (
  id text,
  order_number text,
  customer_name text,
  customer_email text,
  customer_phone text,
  items jsonb,
  total_amount numeric,
  delivery_fee numeric,
  installation_fee numeric,
  status text,
  payment_method text,
  payment_status text,
  reference text,
  delivery_address jsonb,
  delivery_notes text,
  tracking_history jsonb,
  created_at timestamp with time zone
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id::text,
    o.order_number,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.items,
    o.total_amount,
    o.delivery_fee,
    o.installation_fee,
    o.status,
    o.payment_method,
    o.payment_status,
    o.reference,
    o.delivery_address,
    o.delivery_notes,
    o.tracking_history,
    o.created_at
  from public.orders o
  where lower(trim(o.order_number)) = lower(trim(p_order_number))
    and (
      lower(trim(o.customer_email)) = lower(trim(p_email_or_token))
      or lower(trim(coalesce(o.reference, ''))) = lower(trim(p_email_or_token))
    )
  limit 1;
$$;

grant execute on function public.track_order_secure(text, text) to anon, authenticated;
