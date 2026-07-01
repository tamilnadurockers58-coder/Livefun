import { createClient } from '@supabase/supabase-js';

let supabaseClient: any = null;
let isConfigFetched = false;
let configError = false;

export async function initSupabase() {
  if (isConfigFetched) return supabaseClient;
  
  try {
    const res = await fetch('/api/config/supabase');
    if (res.ok) {
      const data = await res.json();
      if (data.supabaseUrl && data.supabaseKey) {
        supabaseClient = createClient(data.supabaseUrl, data.supabaseKey);
      }
    }
  } catch (err) {
    console.error('Failed to fetch Supabase client config:', err);
    configError = true;
  } finally {
    isConfigFetched = true;
  }
  return supabaseClient;
}

export function getSupabase() {
  return supabaseClient;
}
