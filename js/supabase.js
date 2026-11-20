// URWA Supabase client — new project
// The publishable key is intended for browser use. Never place service_role or secret keys here.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "https://qtiffwoqimtuchjrnjaa.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aa9DhS2XxX5wfJROJkowEw_b-4QoRV_";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
