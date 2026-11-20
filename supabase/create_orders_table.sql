-- Safe, additive migration to create the missing public.orders table
-- Does NOT modify, drop, or recreate any existing tables.

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Allow public insert on orders'
  ) THEN
    CREATE POLICY "Allow public insert on orders"
      ON public.orders FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Allow public select on orders'
  ) THEN
    CREATE POLICY "Allow public select on orders"
      ON public.orders FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Allow all modifications on orders'
  ) THEN
    CREATE POLICY "Allow all modifications on orders"
      ON public.orders FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
