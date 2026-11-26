-- Safe, additive migration to create the public.orders table with strict ownership RLS
-- Does NOT modify, drop, or recreate any existing tables.

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number text NOT NULL UNIQUE,
  reference text,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  amount numeric,
  delivery_fee numeric DEFAULT 0,
  installation_fee numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'paystack',
  payment_status text NOT NULL DEFAULT 'pending',
  delivery_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery_notes text,
  tracking_history jsonb DEFAULT '[]'::jsonb,
  service_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public select on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all modifications on orders" ON public.orders;

DROP POLICY IF EXISTS "Orders: own or admin select" ON public.orders;
CREATE POLICY "Orders: own or admin select"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'administrator')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND lower(coalesce(p.role::text, '')) IN ('admin', 'administrator')
    )
  );

DROP POLICY IF EXISTS "Orders: authenticated own or guest insert" ON public.orders;
CREATE POLICY "Orders: authenticated own or guest insert"
  ON public.orders FOR INSERT
  WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'administrator')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND lower(coalesce(p.role::text, '')) IN ('admin', 'administrator')
    )
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

DROP POLICY IF EXISTS "Orders: admin update" ON public.orders;
CREATE POLICY "Orders: admin update"
  ON public.orders FOR UPDATE
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'administrator')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND lower(coalesce(p.role::text, '')) IN ('admin', 'administrator')
    )
  )
  WITH CHECK (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'administrator')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND lower(coalesce(p.role::text, '')) IN ('admin', 'administrator')
    )
  );

DROP POLICY IF EXISTS "Orders: admin delete" ON public.orders;
CREATE POLICY "Orders: admin delete"
  ON public.orders FOR DELETE
  USING (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'administrator')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND lower(coalesce(p.role::text, '')) IN ('admin', 'administrator')
    )
  );
