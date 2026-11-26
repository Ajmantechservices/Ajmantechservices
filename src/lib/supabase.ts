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

/**
 * Generates an RFC 4122 v4 UUID so records written to uuid-typed Postgres columns
 * never fail with 22P02 invalid input syntax.
 */
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Strictly verifies admin privileges using server-controlled app_metadata.role
 * or the protected public.profiles.role column (admin / administrator).
 * NEVER trusts user_metadata or client-supplied role values.
 */
export function isUserVerifiedAdmin(user?: User | null, profileRole?: string | null): boolean {
  if (!user) return false;
  const appRole = String((user.app_metadata as Record<string, any> | undefined)?.role || '')
    .trim()
    .toLowerCase();
  const dbRole = String(profileRole || '')
    .trim()
    .toLowerCase();
  return (
    appRole === 'admin' ||
    appRole === 'administrator' ||
    dbRole === 'admin' ||
    dbRole === 'administrator'
  );
}

export interface CustomerAuthResult {
  success: boolean;
  message: string;
  user?: User | null;
  profile?: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    role: 'customer' | 'admin';
    defaultAddress?: {
      streetAddress?: string;
      city?: string;
      state?: string;
    };
    createdAt?: string;
  } | null;
  role?: 'admin' | 'customer';
}

/**
 * Verifies the active Supabase session directly with Supabase Auth server (getUser)
 * and resolves the user's profile and verified role from the profiles table.
 */
export async function getVerifiedCurrentSession(): Promise<{
  user: User | null;
  role: 'admin' | 'customer';
  isAdmin: boolean;
  profile: CustomerAuthResult['profile'];
}> {
  if (!supabase || !isSupabaseConfigured()) {
    return { user: null, role: 'customer', isAdmin: false, profile: null };
  }

  try {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !session || !session.user) {
      return { user: null, role: 'customer', isAdmin: false, profile: null };
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const verifiedUser = userData?.user;
    if (userErr || !verifiedUser) {
      return { user: null, role: 'customer', isAdmin: false, profile: null };
    }

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role, default_address, created_at')
      .eq('id', verifiedUser.id)
      .maybeSingle();

    const verifiedAdmin = isUserVerifiedAdmin(verifiedUser, profileRow?.role);
    const verifiedRole: 'admin' | 'customer' = verifiedAdmin ? 'admin' : 'customer';

    const fallbackName =
      verifiedUser.user_metadata?.full_name ||
      verifiedUser.user_metadata?.name ||
      verifiedUser.email?.split('@')[0] ||
      'Valued Customer';

    return {
      user: verifiedUser,
      role: verifiedRole,
      isAdmin: verifiedAdmin,
      profile: {
        id: verifiedUser.id,
        email: profileRow?.email || verifiedUser.email || '',
        fullName: profileRow?.full_name || fallbackName,
        phone: profileRow?.phone || verifiedUser.user_metadata?.phone || '',
        role: verifiedRole,
        defaultAddress: profileRow?.default_address || undefined,
        createdAt: profileRow?.created_at || verifiedUser.created_at,
      },
    };
  } catch (err) {
    console.warn('getVerifiedCurrentSession error:', err);
    return { user: null, role: 'customer', isAdmin: false, profile: null };
  }
}

export async function signInCustomerWithSupabase(
  email: string,
  password: string
): Promise<CustomerAuthResult> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase authentication is not configured.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        message: error?.message || 'Invalid email or password.',
      };
    }

    const sessionInfo = await getVerifiedCurrentSession();
    if (!sessionInfo.user) {
      return {
        success: false,
        message: 'Could not verify authenticated user session.',
      };
    }

    return {
      success: true,
      message: 'Signed in successfully.',
      user: sessionInfo.user,
      profile: sessionInfo.profile,
      role: sessionInfo.role,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Sign in failed due to a network error.',
    };
  }
}

export async function signUpCustomerWithSupabase(params: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<CustomerAuthResult & { requiresEmailConfirmation?: boolean }> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase authentication is not configured.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: params.email.trim(),
      password: params.password,
      options: {
        data: {
          full_name: params.fullName.trim(),
          phone: params.phone.trim(),
        },
      },
    });

    if (error) {
      return {
        success: false,
        message: error.message || 'Registration failed.',
      };
    }

    if (!data.session || !data.user) {
      return {
        success: true,
        requiresEmailConfirmation: true,
        message: 'Account created. Please check your email inbox to confirm your email address, then sign in.',
      };
    }

    // Ensure profile row exists with customer role (never admin)
    await supabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          email: params.email.trim().toLowerCase(),
          full_name: params.fullName.trim(),
          phone: params.phone.trim(),
          role: 'customer',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );

    const sessionInfo = await getVerifiedCurrentSession();
    return {
      success: true,
      message: 'Customer account created successfully!',
      user: sessionInfo.user || data.user,
      profile: sessionInfo.profile,
      role: 'customer',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Registration failed due to a network error.',
    };
  }
}

export async function signInCustomerWithGoogleOAuth(): Promise<{ success: boolean; message?: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Google sign-in requires Supabase configuration.',
    };
  }

  try {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Unable to start Google sign-in.' };
  }
}

export async function signOutWithSupabase(): Promise<void> {
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error:', e);
    }
  }
}

export async function updateCustomerProfileInSupabase(
  userId: string,
  updates: {
    fullName?: string;
    phone?: string;
    defaultAddress?: { streetAddress?: string; city?: string; state?: string };
  }
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured() || !isValidUuid(userId)) {
    return { success: true };
  }

  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof updates.fullName === 'string') payload.full_name = updates.fullName.trim();
    if (typeof updates.phone === 'string') payload.phone = updates.phone.trim();
    if (updates.defaultAddress !== undefined) payload.default_address = updates.defaultAddress;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    if (error) {
      console.warn('updateCustomerProfileInSupabase error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Profile update failed.' };
  }
}

/**
 * Sign in administrator using Supabase Auth & verify server-controlled
 * profiles.role ('admin'/'administrator') or app_metadata.role ('admin').
 * Rejects and signs out non-admin accounts and NEVER trusts user_metadata.
 */
export async function signInAdminWithSupabase(
  email: string,
  pass: string
): Promise<AdminAuthResult> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to sign in.',
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

    // Re-verify directly against Supabase Auth server + public.profiles table
    const sessionInfo = await getVerifiedCurrentSession();
    if (!sessionInfo.user) {
      await supabase.auth.signOut();
      return {
        success: false,
        message: 'Could not verify administrator session with Supabase Auth.',
      };
    }

    if (!sessionInfo.isAdmin) {
      await supabase.auth.signOut();
      return {
        success: false,
        message: 'Unauthorized access: Administrator privileges in profiles.role are required.',
        isPrivilegeDenied: true,
        role: 'customer',
      };
    }

    return {
      success: true,
      message: 'Admin authentication successful.',
      user: sessionInfo.user,
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value?: string | null): boolean {
  return Boolean(value && UUID_REGEX.test(value.trim()));
}

export function isMissingTableError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '').toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    msg.includes('could not find the table') ||
    msg.includes('relation') && msg.includes('does not exist')
  );
}

/**
 * Delete a single product from Supabase products table
 */
export async function deleteSupabaseProduct(productId: string) {
  if (!supabase || !isSupabaseConfigured()) return { data: null, error: null };
  if (!isValidUuid(productId)) {
    return { data: null, error: null };
  }
  return await supabase.from('products').delete().eq('id', productId);
}

/**
 * Bulk delete multiple products from Supabase products table
 */
export async function deleteSupabaseProducts(productIds: string[]) {
  if (!supabase || !isSupabaseConfigured() || productIds.length === 0) return { data: null, error: null };
  const validIds = productIds.filter((id) => isValidUuid(id));
  if (validIds.length === 0) return { data: null, error: null };
  return await supabase.from('products').delete().in('id', validIds);
}

/**
 * Check current Supabase auth session & verify role via protected profiles.role
 * and server-controlled app_metadata.role. Never signs out valid customer sessions.
 */
export async function checkAdminAuthSession(): Promise<{
  isAdmin: boolean;
  user: User | null;
  email?: string;
}> {
  if (!supabase || !isSupabaseConfigured()) {
    return { isAdmin: false, user: null };
  }

  try {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !session || !session.user) {
      return { isAdmin: false, user: null };
    }

    // Verify JWT directly with Supabase Auth server
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const verifiedUser = userData?.user;
    if (userErr || !verifiedUser) {
      return { isAdmin: false, user: null };
    }

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', verifiedUser.id)
      .maybeSingle();

    const adminVerified = isUserVerifiedAdmin(verifiedUser, profileRow?.role);
    return {
      isAdmin: adminVerified,
      user: verifiedUser,
      email: verifiedUser.email,
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
    const [prodRes, catRes, srvRes, ordRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('service_requests').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
    ]);

    return {
      productsCount: typeof prodRes.count === 'number' ? prodRes.count : 0,
      categoriesCount: typeof catRes.count === 'number' ? catRes.count : 0,
      serviceRequestsCount: typeof srvRes.count === 'number' ? srvRes.count : 0,
      ordersCount: !ordRes.error && typeof ordRes.count === 'number' ? ordRes.count : 0,
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
    if (error && isMissingTableError(error)) {
      return { data: [], error: null };
    }
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

  return {
    name: nameStr,
    description: descStr,
    price: isNaN(priceNum) ? 0 : priceNum,
    category: catStr,
    image_url: imgStr,
    stock: isNaN(stockNum) ? 0 : stockNum,
    is_active: productData.is_active !== undefined ? Boolean(productData.is_active) : true,
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
 * Inserts a product into Supabase 'products' table using strictly clean standard column names.
 * Omits 'id' so Postgres automatically generates a valid UUID.
 * If a specific optional column (e.g. 'is_active') does not exist in the table, strips only that column and retries once.
 */
export async function insertSupabaseProduct(
  productData: ProductSaveInput
): Promise<{ success: boolean; data?: any; error?: any; missingField?: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    console.warn('[Supabase Insert Audit] Supabase client not configured. Saved in local memory.');
    return { success: true };
  }

  const primaryCleanPayload: Record<string, any> = buildCleanProductPayload(productData);

  let { data, error } = await supabase
    .from('products')
    .insert([primaryCleanPayload])
    .select();

  if (error) {
    const missingField = extractMissingColumnFromError(error);
    console.error(`[Supabase Product Schema Audit] Column mismatch detected on field '${missingField || 'unknown'}'. Error:`, error.message);

    if (missingField && error.message.toLowerCase().includes('does not exist') && missingField in primaryCleanPayload) {
      const retryPayload = { ...primaryCleanPayload };
      delete retryPayload[missingField];

      const retryResult = await supabase
        .from('products')
        .insert([retryPayload])
        .select();

      data = retryResult.data;
      error = retryResult.error;
    }

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
 * Updates a product in Supabase 'products' table using strictly clean standard column names.
 * Guards against non-UUID local fallback IDs (e.g. 'prod-01') to prevent Postgres 22P02 errors.
 */
export async function updateSupabaseProduct(
  productId: string,
  productData: ProductSaveInput
): Promise<{ success: boolean; data?: any; error?: any; missingField?: string }> {
  if (!supabase || !isSupabaseConfigured()) {
    console.warn('[Supabase Update Audit] Supabase client not configured. Product updated locally.');
    return { success: true };
  }

  if (!isValidUuid(productId)) {
    console.warn(`[Supabase Update Audit] Skipping remote update for non-UUID local product ID '${productId}'.`);
    return { success: true };
  }

  const primaryCleanUpdate: Record<string, any> = buildCleanProductPayload(productData);

  let { data, error } = await supabase
    .from('products')
    .update(primaryCleanUpdate)
    .eq('id', productId)
    .select();

  if (error) {
    const missingField = extractMissingColumnFromError(error);
    console.error(`[Supabase Product Schema Audit] Update column mismatch detected on field '${missingField || 'unknown'}'. Error:`, error.message);

    if (missingField && error.message.toLowerCase().includes('does not exist') && missingField in primaryCleanUpdate) {
      const retryPayload = { ...primaryCleanUpdate };
      delete retryPayload[missingField];

      const retryResult = await supabase
        .from('products')
        .update(retryPayload)
        .eq('id', productId)
        .select();

      data = retryResult.data;
      error = retryResult.error;
    }

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

async function compressImageFileToDataUrl(file: File, maxDimension = 900, quality = 0.85): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Image upload must be performed in the browser.');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.readAsDataURL(file);
  });

  if (file.type === 'image/svg+xml') {
    return rawDataUrl;
  }

  return await new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(rawDataUrl);
      }
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [header, base64] = dataUrl.split(',');
    if (!header || !base64) return null;
    const mimeMatch = header.match(/data:([^;]+);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

/**
 * Uploads a category image file to Supabase Storage (when a bucket is configured)
 * and gracefully falls back to an optimized compressed Data URL for immediate persistence.
 */
export async function uploadCategoryImage(
  file: File,
  categorySlug: string
): Promise<{ url: string; persistedToStorage: boolean }> {
  const optimizedDataUrl = await compressImageFileToDataUrl(file);
  const cleanSlug = (categorySlug || 'category').toLowerCase().replace(/[^a-z0-9-]+/g, '-');

  if (supabase && isSupabaseConfigured()) {
    const blob = dataUrlToBlob(optimizedDataUrl);
    if (blob) {
      const filePath = `categories/${cleanSlug}-${Date.now()}.jpg`;
      for (const bucket of ['categories', 'product-images', 'images']) {
        try {
          const { error: uploadErr } = await supabase.storage
            .from(bucket)
            .upload(filePath, blob, {
              contentType: blob.type || 'image/jpeg',
              upsert: true,
            });
          if (!uploadErr) {
            const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
            if (publicData?.publicUrl) {
              return { url: publicData.publicUrl, persistedToStorage: true };
            }
          }
        } catch {
          // Try next bucket or fall back cleanly
        }
      }
    }
  }

  return { url: optimizedDataUrl, persistedToStorage: false };
}

// =====================================================================
// CUSTOMER-SCOPED & ADMIN-SCOPED SUPABASE DATA ACCESS HELPERS
// =====================================================================

export async function fetchCustomerOrders(userId: string) {
  if (!supabase || !isSupabaseConfigured() || !isValidUuid(userId)) {
    return { data: [] as any[], error: null };
  }
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error && isMissingTableError(error)) return { data: [], error: null };
  return { data: data || [], error };
}

export async function fetchAllOrdersForAdmin() {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: [] as any[], error: null };
  }
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error && isMissingTableError(error)) return { data: [], error: null };
  return { data: data || [], error };
}

export async function searchOrdersForAdmin(searchTerm: string) {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: [] as any[], error: null };
  }
  const clean = searchTerm.trim();
  if (!clean) {
    return await fetchAllOrdersForAdmin();
  }
  const safePattern = `%${clean.replace(/[,%()]/g, '')}%`;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .or(
      `order_number.ilike.${safePattern},reference.ilike.${safePattern},customer_name.ilike.${safePattern},customer_email.ilike.${safePattern},customer_phone.ilike.${safePattern}`
    )
    .order('created_at', { ascending: false });
  if (error && isMissingTableError(error)) return { data: [], error: null };
  return { data: data || [], error };
}

export async function insertOrderInSupabase(row: Record<string, any>) {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: null, error: null };
  }
  return await supabase.from('orders').insert([row]).select().maybeSingle();
}

export async function updateOrderInSupabase(orderId: string, orderNumber: string, updates: Record<string, any>) {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: null, error: null };
  }
  const payload = { ...updates, updated_at: new Date().toISOString() };
  const res = await supabase.from('orders').update(payload).eq('id', orderId).select();
  if ((!res.data || res.data.length === 0) && orderNumber) {
    return await supabase.from('orders').update(payload).eq('order_number', orderNumber).select();
  }
  return res;
}

export async function trackOrderSecureInSupabase(orderNumber: string, emailOrRef: string) {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: null, error: null };
  }
  const { data, error } = await supabase.rpc('track_order_secure', {
    p_order_number: orderNumber.trim(),
    p_email_or_token: emailOrRef.trim(),
  });
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row || null, error };
}

export async function fetchCustomerServiceRequests(userId: string) {
  if (!supabase || !isSupabaseConfigured() || !isValidUuid(userId)) {
    return { data: [] as any[], error: null };
  }
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error && isMissingTableError(error)) return { data: [], error: null };
  return { data: data || [], error };
}

export async function fetchAllServiceRequestsForAdmin() {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: [] as any[], error: null };
  }
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error && isMissingTableError(error)) return { data: [], error: null };
  return { data: data || [], error };
}

export async function insertServiceRequestInSupabase(row: Record<string, any>) {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: null, error: null };
  }
  return await supabase.from('service_requests').insert([row]).select().maybeSingle();
}

export async function updateServiceRequestInSupabase(
  requestId: string,
  ticketNumber: string,
  updates: {
    status?: string;
    preferred_date?: string;
    preferred_time?: string;
    assigned_technician?: string;
    admin_notes?: string;
  }
) {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: null, error: null };
  }
  const payload = { ...updates, updated_at: new Date().toISOString() };
  const res = await supabase.from('service_requests').update(payload).eq('id', requestId).select();
  if ((!res.data || res.data.length === 0) && ticketNumber) {
    return await supabase.from('service_requests').update(payload).eq('ticket_number', ticketNumber).select();
  }
  return res;
}

export async function fetchCustomerAddresses(userId: string) {
  if (!supabase || !isSupabaseConfigured() || !isValidUuid(userId)) {
    return { data: [] as any[], error: null };
  }
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error && isMissingTableError(error)) return { data: [], error: null };
  return { data: data || [], error };
}

export async function fetchAllCustomerAddressesForAdmin() {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: [] as any[], error: null };
  }
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error && isMissingTableError(error)) return { data: [], error: null };
  return { data: data || [], error };
}

export async function upsertCustomerAddressInSupabase(
  userId: string,
  address: {
    id?: string;
    title: string;
    fullName?: string;
    streetAddress: string;
    city: string;
    state: string;
    phone: string;
    isDefault: boolean;
  }
) {
  if (!supabase || !isSupabaseConfigured() || !isValidUuid(userId)) {
    return { data: null, error: null };
  }

  if (address.isDefault) {
    await supabase
      .from('customer_addresses')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  const rowId = address.id && isValidUuid(address.id) ? address.id : generateUuid();
  const payload = {
    id: rowId,
    user_id: userId,
    title: address.title.trim() || 'Home',
    full_name: address.fullName?.trim() || null,
    street_address: address.streetAddress.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    phone: address.phone.trim(),
    is_default: Boolean(address.isDefault),
    updated_at: new Date().toISOString(),
  };

  return await supabase
    .from('customer_addresses')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .maybeSingle();
}

export async function deleteCustomerAddressInSupabase(userId: string, addressId: string) {
  if (!supabase || !isSupabaseConfigured() || !isValidUuid(userId) || !isValidUuid(addressId)) {
    return { error: null };
  }
  return await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId);
}

export async function fetchCustomerWishlist(userId: string) {
  if (!supabase || !isSupabaseConfigured() || !isValidUuid(userId)) {
    return { data: [] as any[], error: null };
  }
  const { data, error } = await supabase
    .from('customer_wishlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error && isMissingTableError(error)) return { data: [], error: null };
  return { data: data || [], error };
}

export async function fetchAllCustomerWishlistsForAdmin() {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: [] as any[], error: null };
  }
  const { data, error } = await supabase
    .from('customer_wishlists')
    .select('*')
    .order('created_at', { ascending: false });
  if (error && isMissingTableError(error)) return { data: [], error: null };
  return { data: data || [], error };
}

export async function addCustomerWishlistItem(userId: string, productId: string) {
  if (!supabase || !isSupabaseConfigured() || !isValidUuid(userId)) {
    return { error: null };
  }
  return await supabase
    .from('customer_wishlists')
    .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' });
}

export async function removeCustomerWishlistItem(userId: string, productId: string) {
  if (!supabase || !isSupabaseConfigured() || !isValidUuid(userId)) {
    return { error: null };
  }
  return await supabase
    .from('customer_wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
}

export async function fetchAllProfilesForAdmin() {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: [] as any[], error: null };
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, role, default_address, created_at')
    .order('created_at', { ascending: false });
  if (error && isMissingTableError(error)) return { data: [], error: null };
  return { data: data || [], error };
}

export async function fetchStoreSettingsFromSupabase() {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: null, error: null };
  }
  return await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 'primary_settings')
    .maybeSingle();
}

export async function upsertStoreSettingsInSupabase(settings: Record<string, any>) {
  if (!supabase || !isSupabaseConfigured()) {
    return { data: null, error: null };
  }
  return await supabase
    .from('store_settings')
    .upsert(
      {
        id: 'primary_settings',
        store_name: settings.storeName,
        tagline: settings.tagline,
        phone_number: settings.phone,
        alt_phone: settings.altPhone,
        whatsapp_number: settings.whatsappNumber,
        email: settings.email,
        address: settings.address,
        opening_hours: settings.openingHours,
        delivery_fee_lagos: settings.deliveryRates?.Lagos ?? 2500,
        delivery_fee_other_states: settings.defaultDeliveryFee ?? 4500,
        default_delivery_fee: settings.defaultDeliveryFee ?? 4500,
        free_delivery_threshold: settings.freeDeliveryThreshold ?? 50000,
        delivery_rates: settings.deliveryRates || {},
        bank_details: settings.bankDetails || {},
        promo_codes: settings.promoCodes || [],
        social_links: settings.socialLinks || {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select()
    .maybeSingle();
}



