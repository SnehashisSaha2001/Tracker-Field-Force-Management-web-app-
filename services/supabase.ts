
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// This assumes the Supabase JS library is loaded globally via CDN in index.html
const globalSupabase = (window as any).supabase;

export const supabase = globalSupabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
