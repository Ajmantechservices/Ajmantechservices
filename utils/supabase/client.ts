import { supabase as existingSupabase } from '@/src/lib/supabase';
import { supabase as fallbackSupabase } from '@/src/supabaseClient';

export function createClient() {
  return existingSupabase || fallbackSupabase;
}

export default createClient;
