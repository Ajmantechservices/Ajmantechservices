-- ==========================================================
-- AJMANTECH SERVICES - NON-DESTRUCTIVE RLS & ACCESS CONTROL MIGRATION
-- Safe to run on existing live Supabase databases. Preserves all existing data.
-- ==========================================================

-- 1. Add customer ownership & profile columns without touching existing data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_address jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);

ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS alt_phone text;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS opening_hours text;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS default_delivery_fee numeric DEFAULT 4500;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS delivery_rates jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS promo_codes jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- 2. Backfill user_id on historical orders & service_requests only where the auth user email is confirmed
UPDATE public.orders o
SET user_id = u.id
FROM auth.users u
WHERE o.user_id IS NULL
  AND u.email_confirmed_at IS NOT NULL
  AND o.customer_email IS NOT NULL
  AND lower(trim(o.customer_email)) = lower(trim(u.email));

UPDATE public.service_requests s
SET user_id = u.id
FROM auth.users u
WHERE s.user_id IS NULL
  AND u.email_confirmed_at IS NOT NULL
  AND s.customer_email IS NOT NULL
  AND lower(trim(s.customer_email)) = lower(trim(u.email));

-- 3. Create customer-owned addresses and wishlists tables
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Home',
  full_name text,
  street_address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  phone text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON public.customer_addresses(user_id);

CREATE TABLE IF NOT EXISTS public.customer_wishlists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_wishlists_user_id ON public.customer_wishlists(user_id);

-- 4. Server-verified Admin helper checking JWT app_metadata.role OR protected public.profiles.role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lower(coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '')) IN ('admin', 'administrator')
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role::text, '')) IN ('admin', 'administrator')
    );
$$;

-- Ensure designated primary owner carries app_metadata.role = 'admin' in auth.users
UPDATE auth.users
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE lower(email) = 'joshuaajayi0148@gmail.com';

-- 5. Harden triggers to prevent client-side role spoofing or self-escalation
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.role::text IS DISTINCT FROM old.role::text THEN
    IF NOT public.is_admin() AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
      RAISE EXCEPTION 'Unauthorized: role cannot be modified by non-administrator';
    END IF;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_self_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_self_escalation();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role text;
BEGIN
  IF lower(coalesce(new.email, '')) = 'joshuaajayi0148@gmail.com'
     OR coalesce(new.raw_app_meta_data->>'role', '') = 'admin' THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE
  SET email = excluded.email,
      full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
      phone = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
      role = CASE
        WHEN lower(coalesce(excluded.email, '')) = 'joshuaajayi0148@gmail.com'
             OR coalesce(new.raw_app_meta_data->>'role', '') = 'admin' THEN 'admin'
        ELSE public.profiles.role
      END,
      updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$;

-- 6. Enable RLS on all customer, store & admin tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policies
DROP POLICY IF EXISTS "Allow users to view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public select on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all modifications on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert on service_requests" ON public.service_requests;
DROP POLICY IF EXISTS "Allow public select on service_requests" ON public.service_requests;
DROP POLICY IF EXISTS "Allow all modifications on service_requests" ON public.service_requests;
DROP POLICY IF EXISTS "Allow all modifications on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all modifications on products" ON public.products;
DROP POLICY IF EXISTS "Allow all modifications on product_gallery" ON public.product_gallery;
DROP POLICY IF EXISTS "Allow all modifications on store_settings" ON public.store_settings;

-- Profiles
DROP POLICY IF EXISTS "Profiles: own or admin select" ON public.profiles;
CREATE POLICY "Profiles: own or admin select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles: own insert" ON public.profiles;
CREATE POLICY "Profiles: own insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND lower(coalesce(role::text, 'customer')) = 'customer');

DROP POLICY IF EXISTS "Profiles: own or admin update" ON public.profiles;
CREATE POLICY "Profiles: own or admin update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Storefront catalog (public read, admin-only write)
DROP POLICY IF EXISTS "Allow public read on categories" ON public.categories;
CREATE POLICY "Allow public read on categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Categories: admin write" ON public.categories;
CREATE POLICY "Categories: admin write" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow public read on products" ON public.products;
CREATE POLICY "Allow public read on products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Products: admin write" ON public.products;
CREATE POLICY "Products: admin write" ON public.products FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow public read on product_gallery" ON public.product_gallery;
CREATE POLICY "Allow public read on product_gallery" ON public.product_gallery FOR SELECT USING (true);
DROP POLICY IF EXISTS "Product Gallery: admin write" ON public.product_gallery;
CREATE POLICY "Product Gallery: admin write" ON public.product_gallery FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow public read on store_settings" ON public.store_settings;
CREATE POLICY "Allow public read on store_settings" ON public.store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Store Settings: admin write" ON public.store_settings;
CREATE POLICY "Store Settings: admin write" ON public.store_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Orders
DROP POLICY IF EXISTS "Orders: own or admin select" ON public.orders;
CREATE POLICY "Orders: own or admin select"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Orders: authenticated own or guest insert" ON public.orders;
CREATE POLICY "Orders: authenticated own or guest insert"
  ON public.orders FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

DROP POLICY IF EXISTS "Orders: admin update" ON public.orders;
CREATE POLICY "Orders: admin update"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Orders: admin delete" ON public.orders;
CREATE POLICY "Orders: admin delete"
  ON public.orders FOR DELETE
  USING (public.is_admin());

-- Service Requests
DROP POLICY IF EXISTS "Service Requests: own or admin select" ON public.service_requests;
CREATE POLICY "Service Requests: own or admin select"
  ON public.service_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Service Requests: authenticated own or guest insert" ON public.service_requests;
CREATE POLICY "Service Requests: authenticated own or guest insert"
  ON public.service_requests FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

DROP POLICY IF EXISTS "Service Requests: admin update" ON public.service_requests;
CREATE POLICY "Service Requests: admin update"
  ON public.service_requests FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Service Requests: admin delete" ON public.service_requests;
CREATE POLICY "Service Requests: admin delete"
  ON public.service_requests FOR DELETE
  USING (public.is_admin());

-- Customer Addresses
DROP POLICY IF EXISTS "Addresses: own or admin select" ON public.customer_addresses;
CREATE POLICY "Addresses: own or admin select"
  ON public.customer_addresses FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Addresses: own insert" ON public.customer_addresses;
CREATE POLICY "Addresses: own insert"
  ON public.customer_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Addresses: own update" ON public.customer_addresses;
CREATE POLICY "Addresses: own update"
  ON public.customer_addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Addresses: own delete" ON public.customer_addresses;
CREATE POLICY "Addresses: own delete"
  ON public.customer_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Customer Wishlists
DROP POLICY IF EXISTS "Wishlists: own or admin select" ON public.customer_wishlists;
CREATE POLICY "Wishlists: own or admin select"
  ON public.customer_wishlists FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Wishlists: own insert" ON public.customer_wishlists;
CREATE POLICY "Wishlists: own insert"
  ON public.customer_wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Wishlists: own delete" ON public.customer_wishlists;
CREATE POLICY "Wishlists: own delete"
  ON public.customer_wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- Administrator-Only Order Lookup RPC (restricted to verified admins)
CREATE OR REPLACE FUNCTION public.track_order_secure(
  p_order_number text,
  p_email_or_token text DEFAULT ''
)
RETURNS TABLE (
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Administrator access is required to look up orders.';
  END IF;

  RETURN QUERY
  SELECT
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
  FROM public.orders o
  WHERE lower(trim(o.order_number)) = lower(trim(p_order_number))
     OR (
       coalesce(trim(p_email_or_token), '') <> ''
       AND (
         lower(trim(o.customer_email)) = lower(trim(p_email_or_token))
         OR lower(trim(coalesce(o.reference, ''))) = lower(trim(p_email_or_token))
       )
     )
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.track_order_secure(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.track_order_secure(text, text) TO authenticated;
