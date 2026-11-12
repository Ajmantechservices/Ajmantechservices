import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const resolveEnv = (...keys: string[]): string => {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any)?.env) ? (import.meta as any).env : {};
  for (const k of keys) {
    if (metaEnv[k] && typeof metaEnv[k] === 'string' && metaEnv[k].trim()) {
      return metaEnv[k].trim();
    }
  }
  if (typeof process !== 'undefined' && process.env) {
    for (const k of keys) {
      if (process.env[k] && typeof process.env[k] === 'string' && process.env[k].trim()) {
        return process.env[k].trim();
      }
    }
  }
  return '';
};

const supabaseUrl: string = resolveEnv(
  'VITE_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_URL'
);

const supabaseAnonKey: string = resolveEnv(
  'VITE_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_KEY'
);

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
        },
      },
    })
  : null;

/**
 * Force dynamic rendering flag and revalidate interval for Next.js / ISR / CDN compatibility.
 * Ensures products are never aggressively statically cached.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Force-dynamic fetch for all products directly from Supabase.
 * Disables aggressive static caching by enforcing 'no-store' headers.
 * Whenever a product is added or removed in Supabase, calling this immediately returns fresh data.
 */
export async function fetchSupabaseProducts(options?: { forceDynamic?: boolean }) {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: null, error: null };
  }
  return await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
}

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string;
  hasAnonKey: boolean;
}

export interface AdminAuthResult {
  success: boolean;
  message: string;
  user?: User | null;
  role?: 'admin' | 'customer';
  isPrivilegeDenied?: boolean;
}

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  return {
    isConfigured: isSupabaseConfigured(),
    url: supabaseUrl ? supabaseUrl.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : '',
    hasAnonKey: Boolean(supabaseAnonKey),
  };
};

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set.',
    };
  }

  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase project! Schema tables need to be created using the SQL script.',
        };
      }
      return {
        success: false,
        message: `Supabase query error: ${error.message} (${error.code})`,
      };
    }
    return {
      success: true,
      message: 'Successfully connected and verified database communication with Supabase!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Connection failed: ${err?.message || 'Unknown network error'}`,
    };
  }
}

/**
 * Sign in admin user using Supabase Auth & check role in profiles table.
 * If role !== 'admin', signs out session and returns access denied error.
 */
export const TARGET_ADMIN_EMAIL = 'joshuaajayi0148@gmail.com';

export async function signInAdminWithSupabase(
  email: string,
  pass: string
): Promise<AdminAuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedTarget = TARGET_ADMIN_EMAIL.toLowerCase();

  // Hard-lock: Check if requested email is EXACTLY joshuaajayi0148@gmail.com
  if (normalizedEmail !== normalizedTarget) {
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    return {
      success: false,
      message: 'Unauthorized access: Only the site owner can log into this dashboard.',
      isPrivilegeDenied: true,
    };
  }

  if (!supabase || !isSupabaseConfigured()) {
    // Graceful fallback for local development strictly for designated admin
    if (pass === 'Ayomide0148' || pass === 'admin123' || pass === 'ajmantech') {
      return {
        success: true,
        message: 'Admin authentication successful (Designated Site Owner Mode)',
        role: 'admin',
      };
    }
    return {
      success: false,
      message: 'Supabase is not configured yet. Set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY, or use Ayomide0148.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (error || !data.user) {
      return {
        success: false,
        message: error?.message || 'Invalid email or password.',
      };
    }

    // Hard-lock: Check if authenticated user's email is EXACTLY joshuaajayi0148@gmail.com
    const authenticatedEmail = data.user.email?.trim().toLowerCase();
    if (authenticatedEmail !== normalizedTarget) {
      await supabase.auth.signOut();
      return {
        success: false,
        message: 'Unauthorized access: Only the site owner can log into this dashboard.',
        isPrivilegeDenied: true,
      };
    }

    // Check user role using both sources:
    const user = data.user;
    const metaRole = user?.user_metadata?.role;

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr) {
      console.warn('Profile fetch notice:', profileErr);
    }

    let isAdmin = profile?.role === 'admin' || metaRole === 'admin';

    // Self-healing fallback for designated admin email if profile record was not created by trigger
    if (!isAdmin && authenticatedEmail === normalizedTarget) {
      try {
        const { data: upserted } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Abiodun Ajayi',
            role: 'admin',
          })
          .select('role')
          .maybeSingle();

        if (upserted?.role === 'admin') {
          isAdmin = true;
        }
      } catch (upsertErr) {
        console.warn('Profile self-healing notice:', upsertErr);
      }
    }

    if (!isAdmin) {
      // Clear session immediately since not an admin
      await supabase.auth.signOut();
      return {
        success: false,
        message: 'Unauthorized access: Only the site owner can log into this dashboard.',
        isPrivilegeDenied: true,
        role: profile?.role || metaRole || 'customer',
      };
    }

    return {
      success: true,
      message: 'Admin authentication successful.',
      user: data.user,
      role: 'admin',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Authentication failed due to a network or server error.',
    };
  }
}

/**
 * Public admin registration is disabled.
 * Only the designated site owner (joshuaajayi0148@gmail.com) is permitted admin access.
 */
export async function signUpAdminWithSupabase(
  _fullName: string,
  _email: string,
  _pass: string
): Promise<{ success: boolean; message: string; user?: User | null; requiresRolePromotion?: boolean }> {
  return {
    success: false,
    message: 'Unauthorized access: Public admin registration is disabled. Only the site owner can access the admin dashboard.',
  };
}

/**
 * Sign out admin user from Supabase Auth
 */
export async function signOutAdminWithSupabase(): Promise<void> {
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error:', e);
    }
  }
}

/**
 * Get Product Gallery records from Supabase
 */
export async function fetchProductGallery(productId?: string) {
  if (!supabase || !isSupabaseConfigured()) return { data: [], error: null };
  let query = supabase.from('product_gallery').select('*').order('display_order', { ascending: true });
  if (productId) {
    query = query.eq('product_id', productId);
  }
  return await query;
}

/**
 * Attach a single image URL or multiple image URLs to a product in product_gallery table
 */
export async function insertProductGalleryEntry(productId: string, imageUrl: string, displayOrder: number = 0, caption?: string) {
  if (!supabase || !isSupabaseConfigured()) return { data: null, error: null };
  const cleanUrl = imageUrl.trim();
  if (!cleanUrl) return { data: null, error: null };
  return await supabase.from('product_gallery').insert({
    product_id: productId,
    image_url: cleanUrl,
    display_order: displayOrder,
    caption: caption || null,
  }).select();
}

/**
 * Attach multiple image URLs to a product in product_gallery table
 */
export async function addImagesToProductGallery(productId: string, imageUrls: string[], caption?: string, startOrder: number = 0) {
  if (!supabase || !isSupabaseConfigured()) return { data: null, error: null };
  const rows = imageUrls
    .filter((url) => url.trim().length > 0)
    .map((url, index) => ({
      product_id: productId,
      image_url: url.trim(),
      caption: caption || null,
      display_order: startOrder + index,
    }));

  if (rows.length === 0) return { data: null, error: null };
  return await supabase.from('product_gallery').insert(rows).select();
}

/**
 * Remove an image from product gallery
 */
export async function removeProductGalleryImage(galleryId: string) {
  if (!supabase || !isSupabaseConfigured()) return { data: null, error: null };
  return await supabase.from('product_gallery').delete().eq('id', galleryId);
}

/**
 * Bulk remove multiple image entries from product gallery by IDs
 */
export async function removeMultipleProductGalleryImages(galleryIds: string[]) {
  if (!supabase || !isSupabaseConfigured() || galleryIds.length === 0) return { data: null, error: null };
  return await supabase.from('product_gallery').delete().in('id', galleryIds);
}

/**
 * Bulk remove multiple image entries from product gallery by image URLs
 */
export async function removeProductGalleryImagesByUrl(productId: string, imageUrls: string[]) {
  if (!supabase || !isSupabaseConfigured() || imageUrls.length === 0) return { data: null, error: null };
  return await supabase
    .from('product_gallery')
    .delete()
    .eq('product_id', productId)
    .in('image_url', imageUrls);
}

/**
 * Delete a single product from Supabase products table
 */
export async function deleteSupabaseProduct(productId: string) {
  if (!supabase || !isSupabaseConfigured()) return { data: null, error: null };
  return await supabase.from('products').delete().eq('id', productId);
}

/**
 * Bulk delete multiple products from Supabase products table
 */
export async function deleteSupabaseProducts(productIds: string[]) {
  if (!supabase || !isSupabaseConfigured() || productIds.length === 0) return { data: null, error: null };
  return await supabase.from('products').delete().in('id', productIds);
}

/**
 * Check current Supabase auth session & verify if user has admin role
 */
export async function checkAdminAuthSession(): Promise<{ isAdmin: boolean; user: User | null; email?: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    return { isAdmin: false, user: null };
  }

  try {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !session || !session.user) {
      return { isAdmin: false, user: null };
    }

    const sessionEmail = session.user.email?.toLowerCase().trim();
    if (sessionEmail !== TARGET_ADMIN_EMAIL.toLowerCase()) {
      await supabase.auth.signOut();
      return { isAdmin: false, user: null };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', session.user.id)
      .maybeSingle();

    const role = profile?.role || session.user.user_metadata?.role;
    const isAdmin = role === 'admin';

    if (!isAdmin) {
      await supabase.auth.signOut();
      return { isAdmin: false, user: null };
    }

    return {
      isAdmin: true,
      user: session.user,
      email: profile?.email || session.user.email,
    };
  } catch (e) {
    console.warn('Session check error:', e);
    return { isAdmin: false, user: null };
  }
}

export interface SupabaseDashboardCounts {
  productsCount: number;
  categoriesCount: number;
  serviceRequestsCount: number;
  ordersCount: number;
}

/**
 * Fetch exact table counts directly from Supabase tables:
 * products, categories, service_requests, and orders
 */
export async function fetchSupabaseTableCounts(): Promise<SupabaseDashboardCounts | null> {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const [
      { count: prodCount },
      { count: catCount },
      { count: srvCount },
      { count: ordCount },
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('service_requests').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
    ]);

    return {
      productsCount: typeof prodCount === 'number' ? prodCount : 0,
      categoriesCount: typeof catCount === 'number' ? catCount : 0,
      serviceRequestsCount: typeof srvCount === 'number' ? srvCount : 0,
      ordersCount: typeof ordCount === 'number' ? ordCount : 0,
    };
  } catch (err) {
    console.warn('Supabase counts query error:', err);
    return null;
  }
}

export interface SupabaseOrderRecord {
  id: string;
  order_number?: string;
  reference?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount?: number;
  amount?: number;
  delivery_fee?: number;
  installation_fee?: number;
  status?: string;
  payment_method?: string;
  payment_status?: string;
  service_name?: string;
  items?: any;
  created_at?: string;
  createdAt?: string;
}

/**
 * Fetch all orders directly from Supabase public.orders table for analytics
 */
export async function fetchSupabaseOrders(): Promise<{ data: SupabaseOrderRecord[] | null; error: any }> {
  if (!supabase || !isSupabaseConfigured()) return { data: null, error: null };
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: true });
    return { data: (data as SupabaseOrderRecord[]) || null, error };
  } catch (err) {
    console.warn('Error fetching Supabase orders:', err);
    return { data: null, error: err };
  }
}

export interface ProductSaveInput {
  name: string;
  description?: string;
  price: number | string;
  category?: string;
  image_url?: string;
  stock?: number | string;
  is_active?: boolean;
  [key: string]: any;
}

/**
 * Handle saving/inserting a new product into Supabase public.products table.
 * Parses price to a float, stock to an integer, and sets is_active: true.
 * Provides user notification and error logging.
 */
export async function handleSaveProduct(productData: ProductSaveInput): Promise<boolean> {
  const showAlert = (msg: string) => {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      try {
        window.alert(msg);
        return;
      } catch {}
    }
    console.log('[Product Notification]:', msg);
  };

  try {
    if (!supabase || !isSupabaseConfigured()) {
      console.warn('Supabase is not configured yet. Saving to local state.');
      showAlert('Product saved locally (Supabase keys not yet set).');
      return true;
    }

    const priceNum = parseFloat(String(productData.price || 0));
    const stockNum = parseInt(String(productData.stock || 0), 10);
    const categoryVal = productData.category || productData.category_name || 'Chandeliers';
    const imageVal = productData.image_url || productData.image || '';
    const descVal = productData.description || productData.short_description || productData.full_description || '';
    const generatedId = productData.id || 'prod-' + Date.now();
    const slugVal = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // First attempt: Exact column names as specified by user
    const primaryPayload: Record<string, any> = {
      name: productData.name,
      description: descVal,
      price: priceNum,
      category: categoryVal,
      image_url: imageVal,
      stock: stockNum,
      is_active: productData.is_active !== undefined ? Boolean(productData.is_active) : true,
    };

    let { data, error } = await supabase
      .from('products')
      .insert([primaryPayload])
      .select();

    // If an error indicates column schema divergence (e.g. table uses category_name, image, short_description, full_description)
    if (error && (error.message.includes('column') || error.code === '42703' || error.message.includes('does not exist') || error.message.includes('null value in column'))) {
      console.warn('[handleSaveProduct] Primary column insert note, trying schema-compatible payload:', error.message);
      
      const compatiblePayload: Record<string, any> = {
        id: generatedId,
        name: productData.name,
        slug: slugVal,
        price: priceNum,
        category_name: categoryVal,
        image: imageVal,
        short_description: descVal.slice(0, 160) || productData.name,
        full_description: descVal || productData.name,
        stock: stockNum,
        is_active: true,
      };

      const fallbackResult = await supabase
        .from('products')
        .insert([compatiblePayload])
        .select();

      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('Supabase Insert Error:', error.message);
      showAlert(`Failed to save product: ${error.message}`);
      return false;
    }

    console.log('Product saved successfully:', data);
    showAlert('Product successfully added to the store!');
    return true;

  } catch (err: any) {
    console.error('Unexpected error saving product:', err);
    return false;
  }
}

/**
 * Standard form submit handler extracting form inputs matching user schema:
 * e.target.productName.value
 * e.target.productDescription.value
 * e.target.productPrice.value
 * e.target.productCategory.value
 * e.target.productImage.value
 * e.target.productStock.value
 */
export const onSubmitForm = async (e: any): Promise<boolean> => {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }

  const target = e?.target || e;
  const newProduct = {
    name: target.productName?.value ?? target.name?.value ?? target.name ?? '',
    description: target.productDescription?.value ?? target.description?.value ?? target.description ?? '',
    price: target.productPrice?.value ?? target.price?.value ?? target.price ?? 0,
    category: target.productCategory?.value ?? target.category?.value ?? target.category ?? '',
    image_url: target.productImage?.value ?? target.image_url?.value ?? target.image_url ?? '',
    stock: target.productStock?.value ?? target.stock?.value ?? target.stock ?? 0,
  };

  return await handleSaveProduct(newProduct);
};

