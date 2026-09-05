import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl: string = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
            full_name: user.user_metadata?.full_name || 'Joshua Ajayi',
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
  postsCount?: number;
}

/**
 * Fetch all posts from Supabase public.posts table
 */
export async function fetchSupabasePosts() {
  if (!supabase || !isSupabaseConfigured()) return { data: null, error: null };
  return await supabase.from('posts').select('*').order('created_at', { ascending: false });
}

/**
 * Insert a new post directly into public.posts
 */
export async function createSupabasePost(postData: {
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  content: string;
  published?: boolean;
}) {
  if (!supabase || !isSupabaseConfigured()) return { data: null, error: null };
  return await supabase
    .from('posts')
    .insert({
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt || null,
      featured_image: postData.featured_image || null,
      content: postData.content,
      published: postData.published ?? false,
    })
    .select()
    .single();
}

/**
 * Update an existing post directly in public.posts
 */
export async function updateSupabasePost(
  id: string,
  postData: {
    title?: string;
    slug?: string;
    excerpt?: string;
    featured_image?: string;
    content?: string;
    published?: boolean;
  }
) {
  if (!supabase || !isSupabaseConfigured()) return { data: null, error: null };
  return await supabase
    .from('posts')
    .update({
      ...postData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
}

/**
 * Delete a post directly from public.posts
 */
export async function deleteSupabasePost(id: string) {
  if (!supabase || !isSupabaseConfigured()) return { error: null };
  return await supabase.from('posts').delete().eq('id', id);
}

/**
 * Fetch exact table counts directly from Supabase tables:
 * products, categories, service_requests, orders, and posts
 */
export async function fetchSupabaseTableCounts(): Promise<SupabaseDashboardCounts | null> {
  if (!supabase || !isSupabaseConfigured()) return null;

  try {
    const [
      { count: prodCount },
      { count: catCount },
      { count: srvCount },
      { count: ordCount },
      { count: postsCount },
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('service_requests').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
    ]);

    return {
      productsCount: typeof prodCount === 'number' ? prodCount : 0,
      categoriesCount: typeof catCount === 'number' ? catCount : 0,
      serviceRequestsCount: typeof srvCount === 'number' ? srvCount : 0,
      ordersCount: typeof ordCount === 'number' ? ordCount : 0,
      postsCount: typeof postsCount === 'number' ? postsCount : 0,
    };
  } catch (err) {
    console.warn('Supabase counts query error:', err);
    return null;
  }
}

