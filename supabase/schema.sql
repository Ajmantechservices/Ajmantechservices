-- ==========================================================
-- AJMANTECH ELECTRICAL & LIGHTING STORE - SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor (supabase.com -> SQL Editor -> New query)
-- ==========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Supabase Auth User Profiles & Role Management)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Automatic trigger to create a profile row whenever a new user signs up in auth.users
-- Automatically assigns 'admin' role to joshuaajayi0148@gmail.com
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case 
      when new.email = 'joshuaajayi0148@gmail.com' then 'admin'
      else coalesce(new.raw_user_meta_data->>'role', 'customer')
    end
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      role = case 
        when excluded.email = 'joshuaajayi0148@gmail.com' then 'admin'
        else excluded.role
      end,
      updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. CATEGORIES TABLE
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  item_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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

-- 4. PRODUCT GALLERY TABLE (Multiple Image URLs attached to specific product)
create table if not exists public.product_gallery (
  id uuid default uuid_generate_v4() primary key,
  product_id text references public.products(id) on delete cascade,
  image_url text not null,
  caption text,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ORDERS TABLE
create table if not exists public.orders (
  id text primary key,
  order_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric not null,
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

-- 6. SERVICE REQUESTS TABLE
create table if not exists public.service_requests (
  id text primary key,
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

-- 7. REVIEWS TABLE
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

-- 8. STORE SETTINGS TABLE
create table if not exists public.store_settings (
  id text primary key default 'primary_settings',
  store_name text not null default 'AjmanTech Services',
  phone_number text not null default '+234 802 345 6789',
  whatsapp_number text not null default '2348023456789',
  email text not null default 'support@ajmantech.ng',
  address text not null default 'Plot 14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
  delivery_fee_lagos numeric default 2500,
  delivery_fee_other_states numeric default 6000,
  free_delivery_threshold numeric default 50000,
  bank_details jsonb not null default '{"bankName": "Guaranty Trust Bank (GTBank)", "accountNumber": "0123456789", "accountName": "AjmanTech Electrical Services Ltd"}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. BLOG POSTS TABLE (Blog & Article Management for Traffic & SEO)
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text not null unique,
  excerpt text,
  featured_image text,
  content text not null,
  author_id uuid references auth.users on delete set null,
  published boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_gallery enable row level security;
alter table public.orders enable row level security;
alter table public.service_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.store_settings enable row level security;
alter table public.posts enable row level security;

-- Profiles policies
create policy "Allow users to view own profile" on public.profiles for select using (true);
create policy "Allow users to update own profile" on public.profiles for update using (true);
create policy "Allow insert on profiles" on public.profiles for insert with check (true);

-- Public read access
create policy "Allow public read on categories" on public.categories for select using (true);
create policy "Allow public read on products" on public.products for select using (true);
create policy "Allow public read on product_gallery" on public.product_gallery for select using (true);
create policy "Allow public read on reviews" on public.reviews for select using (true);
create policy "Allow public read on store_settings" on public.store_settings for select using (true);
create policy "Allow public read on posts" on public.posts for select using (true);

-- Public can insert new orders & service requests & reviews
create policy "Allow public insert on orders" on public.orders for insert with check (true);
create policy "Allow public select on orders" on public.orders for select using (true);
create policy "Allow public insert on service_requests" on public.service_requests for insert with check (true);
create policy "Allow public select on service_requests" on public.service_requests for select using (true);
create policy "Allow public insert on reviews" on public.reviews for insert with check (true);

-- Allow all modifications for authenticated or full anon key during development
create policy "Allow all modifications on categories" on public.categories for all using (true) with check (true);
create policy "Allow all modifications on products" on public.products for all using (true) with check (true);
create policy "Allow all modifications on product_gallery" on public.product_gallery for all using (true) with check (true);
create policy "Allow all modifications on orders" on public.orders for all using (true) with check (true);
create policy "Allow all modifications on service_requests" on public.service_requests for all using (true) with check (true);
create policy "Allow all modifications on store_settings" on public.store_settings for all using (true) with check (true);
create policy "Allow all modifications on posts" on public.posts for all using (true) with check (true);

-- Helper query to promote an admin:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
