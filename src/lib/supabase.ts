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
export async function signInAdminWithSupabase(
  email: string,
  pass: string
): Promise<AdminAuthResult> {
  if (!supabase || !isSupabaseConfigured()) {
    // Graceful fallback for local development or demo credentials
    if (
      email.toLowerCase() === 'admin@ajmantech.ng' ||
      pass === 'admin123' ||
      pass === 'ajmantech'
    ) {
      return {
        success: true,
        message: 'Admin authentication successful (Local Admin Mode)',
        role: 'admin',
      };
    }
    return {
      success: false,
      message: 'Supabase is not configured yet. Configure VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY in your settings, or use admin@ajmantech.ng.',
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

    // Check role in profiles table
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileErr) {
      console.warn('Profile fetch notice:', profileErr);
    }

    // Role check
    const userRole = profile?.role || data.user.user_metadata?.role || 'customer';

    if (userRole !== 'admin') {
      // Clear session immediately since not an admin
      await supabase.auth.signOut();
      return {
        success: false,
        message: 'Access denied: Administrator privileges required.',
        isPrivilegeDenied: true,
        role: userRole,
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
 * Sign up a new account through Supabase Auth and initialize profile
 */
export async function signUpAdminWithSupabase(
  fullName: string,
  email: string,
  pass: string
): Promise<{ success: boolean; message: string; user?: User | null; requiresRolePromotion?: boolean }> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: true,
      message: 'Account registered locally. (Connect Supabase to persist live auth).',
      requiresRolePromotion: true,
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          full_name: fullName.trim(),
          role: 'customer',
        },
      },
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    if (data.user) {
      // Upsert profile record in profiles table
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName.trim(),
          role: 'customer',
        });
      } catch (pErr) {
        console.warn('Profile upsert notice:', pErr);
      }
    }

    return {
      success: true,
      message: 'Admin account created successfully! Please update your role in Supabase profiles table.',
      user: data.user,
      requiresRolePromotion: true,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Registration failed.',
    };
  }
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
 * Attach multiple image URLs to a product in product_gallery table
 */
export async function addImagesToProductGallery(productId: string, imageUrls: string[], caption?: string) {
  if (!supabase || !isSupabaseConfigured()) return { data: null, error: null };
  const rows = imageUrls
    .filter((url) => url.trim().length > 0)
    .map((url, index) => ({
      product_id: productId,
      image_url: url.trim(),
      caption: caption || null,
      display_order: index,
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

