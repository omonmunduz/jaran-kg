import { supabase } from './supabase';

export async function getCurrentUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user.id) {
    return null;
  }

  return session.user;
}

export async function getCurrentUserId() {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export function onAuthStateChange(
  callback: (userId: string | null) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user.id ?? null);
  });

  return subscription;
}
