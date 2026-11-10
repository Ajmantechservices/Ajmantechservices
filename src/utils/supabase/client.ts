import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export function createClient() {
  if (supabase) return supabase;
  
  const resolveEnv = (...keys: string[]): string => {
    const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any)?.env) ? (import.meta as any).env : {};
    for (const k of keys) {
      if (metaEnv[k] && typeof metaEnv[k] === 'string' && metaEnv[k].trim()) return metaEnv[k].trim();
    }
    if (typeof process !== 'undefined' && process.env) {
      for (const k of keys) {
        if (process.env[k] && typeof process.env[k] === 'string' && process.env[k].trim()) return process.env[k].trim();
      }
    }
    return '';
  };

  const url = resolveEnv('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL') || 'https://ynrmthgxykbvuvtwhvlq.supabase.co';
  const key = resolveEnv('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'SUPABASE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

  return createSupabaseClient(url, key);
}

export default createClient;
