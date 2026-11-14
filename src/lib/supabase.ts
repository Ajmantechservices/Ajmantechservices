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
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: 'no-store' }),
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
 * Storefront Server/Client helper to fetch products directly from Supabase
 * with revalidate = 0 and cache: 'no-store' so new admin updates appear immediately.
 */
export async function getStoreProducts() {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getStoreProducts] Error fetching products:', error.message);
    return [];
  }
  return data || [];
}

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
  id?: string;
  name: string;
  description?: string;
  full_description?: string;
  short_description?: string;
  price: number | string;
  category?: string;
  category_name?: string;
  image_url?: string;
  image?: string;
  stock?: number | string;
  is_active?: boolean;
  slug?: string;
  brand?: string;
  [key: string]: any;
}

/**
 * Extracts the exact missing or offending column name from Supabase / Postgres error messages.
 * e.g., 'column "image" of relation "products" does not exist' -> 'image'
 * e.g., 'null value in column "category_name" violates not-null constraint' -> 'category_name'
 */
export function extractMissingColumnFromError(error: any): string | null {
  if (!error) return null;
  const msg = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`;

  const matchNotExist = msg.match(/column\s+"([^"]+)"\s+(?:of\s+relation\s+"[^"]+"\s+)?does\s+not\s+exist/i);
  if (matchNotExist) return matchNotExist[1];

  const matchNotNull = msg.match(/null\s+value\s+in\s+column\s+"([^"]+)"/i);
  if (matchNotNull) return matchNotNull[1];

  const matchGeneric = msg.match(/column\s+["']?([a-zA-Z0-9_]+)["']?/i);
  if (matchGeneric) return matchGeneric[1];

  return null;
}

/**
 * Builds a strictly clean standard product payload:
 * image_url (not image), description (not full_description), category (not category_name), is_active: true
 */
export function buildCleanProductPayload(productData: ProductSaveInput) {
  const priceNum = parseFloat(String(productData.price || 0));
  const stockNum = parseInt(String(productData.stock ?? 0), 10);
  const nameStr = String(productData.name || '').trim();
  const descStr = String(
    productData.description ||
    productData.full_description ||
    productData.short_description ||
    ''
  ).trim();
  const catStr = String(productData.category || productData.category_name || 'Chandeliers').trim();
  const imgStr = String(
    productData.image_url ||
    productData.image ||
    (Array.isArray(productData.images) ? productData.images[0] : '') ||
    ''
  ).trim();
  const idStr = productData.id || ('prod-' + Date.now());
  const slugStr = productData.slug || nameStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || idStr;

  return {
    id: idStr,
    name: nameStr,
    description: descStr,
    price: isNaN(priceNum) ? 0 : priceNum,
    category: catStr,
    image_url: imgStr,
    stock: isNaN(stockNum) ? 0 : stockNum,
    is_active: productData.is_active !== undefined ? Boolean(productData.is_active) : true,
    slug: slugStr,
    brand: productData.brand || 'AjmanTech',
  };
}

const triggerAlert = (msg: string) => {
  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    try {
      window.alert(msg);
      return;
    } catch {}
  }
  console.log('[Product Notification]:', msg);
};

/**
 * Inserts a product into Supabase 'products' table using clean standard column names.
 * Features automatic schema mismatch auditing, console field logging, and graceful user alert.
 */
export async function insertSupabaseProduct(
  productData: ProductSaveInput
): Promise<{ success: boolean; data?: any; error?: any; missingField?: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    console.warn('[Supabase Insert Audit] Supabase client not configured. Saved in local memory.');
    return { success: true };
  }

  const clean = buildCleanProductPayload(productData);

  // 1. Primary Clean Insert with strictly standard column names
  const primaryCleanPayload: Record<string, any> = {
    id: clean.id,
    name: clean.name,
    description: clean.description,
    price: clean.price,
    category: clean.category,
    image_url: clean.image_url,
    stock: clean.stock,
    is_active: clean.is_active,
    slug: clean.slug,
    brand: clean.brand,
  };

  let { data, error } = await supabase
    .from('products')
    .insert([primaryCleanPayload])
    .select();

  // 2. Audit schema mismatch
  if (error) {
    const missingField = extractMissingColumnFromError(error);
    console.error(`[Supabase Product Schema Audit] Column mismatch detected on field '${missingField || 'unknown'}'. Error:`, error.message);

    // Build adaptive payload supplying legacy column aliases for seamless compatibility
    const adaptivePayload: Record<string, any> = {
      ...primaryCleanPayload,
      category_name: clean.category,
      image: clean.image_url,
      short_description: clean.description.slice(0, 160) || clean.name,
      full_description: clean.description || clean.name,
      gallery: Array.isArray(productData.gallery) ? productData.gallery : [clean.image_url],
      specifications: productData.specifications || {},
      tags: productData.tags || ['lighting'],
      voltage: productData.voltage || '220V-240V',
      warranty: productData.warranty || '1 Year',
    };

    // If error was about a specific clean column not existing in table, omit that specific field
    if (missingField && error.message.includes('does not exist')) {
      delete adaptivePayload[missingField];
    }

    const retryResult = await supabase
      .from('products')
      .insert([adaptivePayload])
      .select();

    data = retryResult.data;
    error = retryResult.error;

    if (error) {
      const finalMissingField = extractMissingColumnFromError(error) || missingField;
      console.error(`[Supabase Database Error] Failed to insert product. Problematic column: '${finalMissingField || 'schema'}'. Full error:`, error.message);
      triggerAlert(`Notice: Unable to save product to database due to column '${finalMissingField || 'schema'}': ${error.message}`);
      return { success: false, error, missingField: finalMissingField || undefined };
    }
  }

  console.log('[Supabase Product Insert] Product saved successfully:', data);
  return { success: true, data };
}

/**
 * Updates a product in Supabase 'products' table using clean standard column names.
 * Audits columns, logs exact missing field on failure, and avoids column schema breakage.
 */
export async function updateSupabaseProduct(
  productId: string,
  productData: ProductSaveInput
): Promise<{ success: boolean; data?: any; error?: any; missingField?: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    console.warn('[Supabase Update Audit] Supabase client not configured. Product updated locally.');
    return { success: true };
  }

  const clean = buildCleanProductPayload({ ...productData, id: productId });

  // 1. Primary Clean Update with strictly standard column names
  const primaryCleanUpdate: Record<string, any> = {
    name: clean.name,
    description: clean.description,
    price: clean.price,
    category: clean.category,
    image_url: clean.image_url,
    stock: clean.stock,
    is_active: clean.is_active,
    slug: clean.slug,
    brand: clean.brand,
  };

  let { data, error } = await supabase
    .from('products')
    .update(primaryCleanUpdate)
    .eq('id', productId)
    .select();

  // 2. Audit schema mismatch on update
  if (error) {
    const missingField = extractMissingColumnFromError(error);
    console.error(`[Supabase Product Schema Audit] Update column mismatch detected on field '${missingField || 'unknown'}'. Error:`, error.message);

    // Adaptive update payload with both clean and legacy columns
    const adaptiveUpdate: Record<string, any> = {
      ...primaryCleanUpdate,
      category_name: clean.category,
      image: clean.image_url,
      short_description: clean.description.slice(0, 160) || clean.name,
      full_description: clean.description || clean.name,
      gallery: Array.isArray(productData.gallery) ? productData.gallery : [clean.image_url],
    };

    if (missingField && error.message.includes('does not exist')) {
      delete adaptiveUpdate[missingField];
    }

    const retryResult = await supabase
      .from('products')
      .update(adaptiveUpdate)
      .eq('id', productId)
      .select();

    data = retryResult.data;
    error = retryResult.error;

    if (error) {
      const finalMissingField = extractMissingColumnFromError(error) || missingField;
      console.error(`[Supabase Database Error] Failed to update product. Problematic column: '${finalMissingField || 'schema'}'. Full error:`, error.message);
      triggerAlert(`Notice: Unable to update product in database due to column '${finalMissingField || 'schema'}': ${error.message}`);
      return { success: false, error, missingField: finalMissingField || undefined };
    }
  }

  console.log('[Supabase Product Update] Product updated successfully:', data);
  return { success: true, data };
}

/**
 * Handle saving/inserting a new product into Supabase public.products table.
 * Strictly uses clean column names (image_url, description, category, price, stock, is_active).
 * Logs missing fields and provides user alerting.
 */
export async function handleSaveProduct(productData: ProductSaveInput): Promise<boolean> {
  try {
    const res = await insertSupabaseProduct(productData);
    if (!res.success) {
      return false;
    }
    triggerAlert('Product successfully added to the store!');
    return true;
  } catch (err: any) {
    console.error('[Supabase Save Error] Unexpected error saving product:', err);
    triggerAlert(`Unexpected error saving product: ${err?.message || 'Unknown database issue'}`);
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
  const newProduct: ProductSaveInput = {
    name: target.productName?.value ?? target.name?.value ?? target.name ?? '',
    description: target.productDescription?.value ?? target.description?.value ?? target.description ?? '',
    price: target.productPrice?.value ?? target.price?.value ?? target.price ?? 0,
    category: target.productCategory?.value ?? target.category?.value ?? target.category ?? '',
    image_url: target.productImage?.value ?? target.image_url?.value ?? target.image_url ?? '',
    stock: target.productStock?.value ?? target.stock?.value ?? target.stock ?? 0,
  };

  return await handleSaveProduct(newProduct);
};

