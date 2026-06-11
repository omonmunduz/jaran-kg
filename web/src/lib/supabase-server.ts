import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Server action client for use in server actions and API routes
export const createSupabaseServer = () => {
  return createServerActionClient({ cookies });
};

// Server component client for use in Server Components
export const createSupabaseServerComponent = () => {
  return createServerActionClient({ cookies });
};