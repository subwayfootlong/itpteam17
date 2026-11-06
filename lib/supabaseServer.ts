import { createClient } from '@supabase/supabase-js';

// SFR-05: Server-side privileged Supabase client with service-role key.
// Must strictly run in server environments (Node.js/Next.js Route Handlers & Server Components).
if (typeof window !== 'undefined') {
  throw new Error('Security Violation (SFR-05): supabaseAdmin cannot and must not be used on the client-side.');
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
}

export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false },
});

export default supabaseAdmin;
