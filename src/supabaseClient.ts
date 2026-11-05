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
  from: (table: string) => {
    const chain: any = {
      select: () => chain,
      insert: async (data: any) => {
        try {
          const key = `ajmantech_sb_${table}`;
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          const toAdd = Array.isArray(data) ? data : [data];
          localStorage.setItem(key, JSON.stringify([...toAdd, ...existing]));
        } catch (_) {}
        return { data, error: null };
      },
      update: () => chain,
      delete: () => chain,
      eq: () => chain,
      in: () => chain,
      order: () => chain,
      single: async () => ({ data: null, error: null }),
      then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
    };
    return chain;
  },
} as any);

export default supabase;
