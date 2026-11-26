-- =====================================================================
-- AJMANTECH SERVICES - NON-DESTRUCTIVE ADMIN & CUSTOMER ORDER RLS FIX
-- Safe to run and retry on live Supabase databases.
-- NO DROP commands. NO DELETE commands. Preserves all existing data & UUIDs.
-- Casts enum columns (e.g. public.profiles.role::text) explicitly to text.
-- =====================================================================

-- 1. Ensure public.orders has reliable customer ownership column (user_id)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- 2. Safest historical order-to-user association:
--    NEVER trust unverified customer_email alone.
--    Only backfill user_id for legacy rows where user_id IS NULL AND the matching
--    Supabase Auth account has a verified/confirmed email address.
UPDATE public.orders o
SET user_id = u.id
FROM auth.users u
WHERE o.user_id IS NULL
  AND u.deleted_at IS NULL
  AND u.email_confirmed_at IS NOT NULL
  AND o.customer_email IS NOT NULL
  AND lower(trim(o.customer_email::text)) = lower(trim(u.email::text));

-- 3. Server-verified Admin helper:
--    Checks BOTH server-controlled JWT app_metadata.role AND the protected
--    public.profiles.role column (explicitly cast ::text for user_role enum safety).
--    NEVER inspects client-writable user_metadata.
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

-- 4. Prevent regular customers from escalating their own role in public.profiles
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new.role::text IS DISTINCT FROM old.role::text THEN
    IF NOT public.is_admin()
       AND current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
      RAISE EXCEPTION 'Unauthorized: profile role cannot be modified by non-administrator';
    END IF;
  END IF;
  RETURN new;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_prevent_role_self_escalation'
      AND tgrelid = 'public.profiles'::regclass
  ) THEN
    CREATE TRIGGER trg_prevent_role_self_escalation
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_self_escalation();
  END IF;
END $$;

-- 5. Enable Row Level Security (never disabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 6. Neutralize known legacy overly permissive policies on profiles & orders WITHOUT DROP
--    (Existing policies outside this legacy list remain untouched.)
DO $$
DECLARE
  pol record;
BEGIN
  -- Neutralize legacy permissive policies on public.orders
  FOR pol IN
    SELECT policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname IN (
        'Allow public select on orders',
        'Allow public insert on orders',
        'Allow all modifications on orders',
        'Enable read access for all users',
        'Enable insert for all users'
      )
  LOOP
    IF pol.cmd = 'SELECT' THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.orders USING (auth.uid() = user_id OR public.is_admin())',
        pol.policyname
      );
    ELSIF pol.cmd = 'INSERT' THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.orders WITH CHECK (public.is_admin() OR (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR (auth.uid() IS NULL AND user_id IS NULL))',
        pol.policyname
      );
    ELSIF pol.cmd = 'DELETE' THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.orders USING (public.is_admin())',
        pol.policyname
      );
    ELSE
      -- Handles UPDATE and ALL
      EXECUTE format(
        'ALTER POLICY %I ON public.orders USING (public.is_admin()) WITH CHECK (public.is_admin())',
        pol.policyname
      );
    END IF;
  END LOOP;

  -- Neutralize legacy permissive policies on public.profiles
  FOR pol IN
    SELECT policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname IN (
        'Allow users to view own profile',
        'Allow users to update own profile',
        'Allow insert on profiles',
        'Public profiles are viewable by everyone.'
      )
  LOOP
    IF pol.cmd = 'SELECT' THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.profiles USING (auth.uid() = id OR public.is_admin())',
        pol.policyname
      );
    ELSIF pol.cmd = 'INSERT' THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.profiles WITH CHECK (auth.uid() = id AND lower(coalesce(role::text, ''customer'')) = ''customer'')',
        pol.policyname
      );
    ELSIF pol.cmd = 'DELETE' THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.profiles USING (public.is_admin())',
        pol.policyname
      );
    ELSE
      -- Handles UPDATE and ALL
      EXECUTE format(
        'ALTER POLICY %I ON public.profiles USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin())',
        pol.policyname
      );
    END IF;
  END LOOP;
END $$;

-- 7. Ensure canonical strict RLS policies exist on public.profiles & public.orders (idempotent)
DO $$
BEGIN
  -- Profiles SELECT
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles: own or admin select') THEN
    ALTER POLICY "Profiles: own or admin select" ON public.profiles
      USING (auth.uid() = id OR public.is_admin());
  ELSE
    CREATE POLICY "Profiles: own or admin select" ON public.profiles
      FOR SELECT USING (auth.uid() = id OR public.is_admin());
  END IF;

  -- Profiles INSERT (casts role::text so user_role enum comparisons are safe)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles: own insert') THEN
    ALTER POLICY "Profiles: own insert" ON public.profiles
      WITH CHECK (auth.uid() = id AND lower(coalesce(role::text, 'customer')) = 'customer');
  ELSE
    CREATE POLICY "Profiles: own insert" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id AND lower(coalesce(role::text, 'customer')) = 'customer');
  END IF;

  -- Profiles UPDATE
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles: own or admin update') THEN
    ALTER POLICY "Profiles: own or admin update" ON public.profiles
      USING (auth.uid() = id OR public.is_admin())
      WITH CHECK (auth.uid() = id OR public.is_admin());
  ELSE
    CREATE POLICY "Profiles: own or admin update" ON public.profiles
      FOR UPDATE USING (auth.uid() = id OR public.is_admin())
      WITH CHECK (auth.uid() = id OR public.is_admin());
  END IF;

  -- Orders SELECT: authenticated users see ONLY their own orders (by user_id), admins see all
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Orders: own or admin select') THEN
    ALTER POLICY "Orders: own or admin select" ON public.orders
      USING (auth.uid() = user_id OR public.is_admin());
  ELSE
    CREATE POLICY "Orders: own or admin select" ON public.orders
      FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
  END IF;

  -- Orders INSERT: authenticated users insert with their own user_id; guest checkout inserts with user_id IS NULL
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Orders: authenticated own or guest insert') THEN
    ALTER POLICY "Orders: authenticated own or guest insert" ON public.orders
      WITH CHECK (
        public.is_admin()
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR (auth.uid() IS NULL AND user_id IS NULL)
      );
  ELSE
    CREATE POLICY "Orders: authenticated own or guest insert" ON public.orders
      FOR INSERT WITH CHECK (
        public.is_admin()
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR (auth.uid() IS NULL AND user_id IS NULL)
      );
  END IF;

  -- Orders UPDATE: administrators ONLY
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Orders: admin update') THEN
    ALTER POLICY "Orders: admin update" ON public.orders
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  ELSE
    CREATE POLICY "Orders: admin update" ON public.orders
      FOR UPDATE USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  -- Orders DELETE: administrators ONLY
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Orders: admin delete') THEN
    ALTER POLICY "Orders: admin delete" ON public.orders
      USING (public.is_admin());
  ELSE
    CREATE POLICY "Orders: admin delete" ON public.orders
      FOR DELETE USING (public.is_admin());
  END IF;
END $$;

-- 8. Lock down track_order_secure RPC to verified ADMINISTRATORS ONLY
--    Prevents customers or unauthenticated visitors from querying another customer's order
--    by guessing or entering an order reference + email.
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
    o.order_number::text,
    o.customer_name::text,
    o.customer_email::text,
    o.customer_phone::text,
    o.items::jsonb,
    o.total_amount::numeric,
    o.delivery_fee::numeric,
    o.installation_fee::numeric,
    o.status::text,
    o.payment_method::text,
    o.payment_status::text,
    o.reference::text,
    o.delivery_address::jsonb,
    o.delivery_notes::text,
    o.tracking_history::jsonb,
    o.created_at
  FROM public.orders o
  WHERE lower(trim(coalesce(o.order_number::text, ''))) = lower(trim(coalesce(p_order_number, '')))
     OR (
       coalesce(trim(p_email_or_token), '') <> ''
       AND (
         lower(trim(coalesce(o.customer_email::text, ''))) = lower(trim(p_email_or_token))
         OR lower(trim(coalesce(o.reference::text, ''))) = lower(trim(p_email_or_token))
       )
     )
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.track_order_secure(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.track_order_secure(text, text) TO authenticated;
