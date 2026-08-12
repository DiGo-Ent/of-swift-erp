import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://msdfgmyqsbmhsqrolipl.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZGZnbXlxc2JtaHNxcm9saXBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDkzNTAsImV4cCI6MjEwMTU4NTM1MH0.YkZGrYkuK1MwMrpfrM9H2RzZ2jszyp1ybeeJ1J95n_E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});
