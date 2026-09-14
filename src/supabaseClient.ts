import { supabase as rawSupabase } from './lib/supabase';

// Safe proxy to ensure auth operations like signOut() never crash even if Supabase client is offline
export const supabase = rawSupabase || ({
  auth: {
    signOut: async () => {
      try {
        localStorage.removeItem('sb-token');
      } catch (_) {}
      return { error: null };
    },
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
} as any);

export default supabase;
