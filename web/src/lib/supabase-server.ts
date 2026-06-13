import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Server action client for use in server actions and API routes
export const createSupabaseServer = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll();
        },
      },
    }
  );
};

// Server component client for use in Server Components
export const createSupabaseServerComponent = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll();
        },
      },
    }
  );
};