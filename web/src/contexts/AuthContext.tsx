'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// User type with role
export interface User {
  id: string;
  email?: string;
  phone?: string;
  username?: string;
  avatar_url?: string;
  role: 'user' | 'moderator' | 'admin';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator' || user?.role === 'admin';

  const fetchUser = async () => {
  setLoading(true);
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      setUser(null);
      return;
    }

    if (!session?.user) {
      setUser(null);
      return;
    }

    // Try to fetch existing profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // If no profile exists, create one
    if (profileError || !profile) {
      const email = session.user.email || '';
      const phone = session.user.phone || null;
      const username = email
        ? email.split('@')[0]
        : `user_${session.user.id.slice(0, 8)}`;

      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: session.user.id,
          email: email || null,
          phone: phone,
          username: username,
          role: 'user',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
        setUser(null);
        return;
      }

      setUser({
        id: newProfile.id,
        email: newProfile.email || session.user.email || undefined,
        phone: newProfile.phone,
        username: newProfile.username,
        avatar_url: newProfile.avatar_url,
        role: newProfile.role as 'user' | 'moderator' | 'admin',
        created_at: newProfile.created_at,
      });
      return;
    }

    // Profile exists
    setUser({
      id: profile.id,
      email: profile.email || session.user.email || undefined,
      phone: profile.phone,
      username: profile.username,
      avatar_url: profile.avatar_url,
      role: profile.role as 'user' | 'moderator' | 'admin',
      created_at: profile.created_at,
    });
  } catch (error) {
    console.error('Error in fetchUser:', error);
    setUser(null);
  } finally {
    setLoading(false);
  }
};

  const refreshUser = async () => {
    await fetchUser();
  };

  useEffect(() => {
    fetchUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        await fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      isModerator,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for checking if user has required role
export function useRole(requiredRole: 'user' | 'moderator' | 'admin') {
  const { user } = useAuth();

  if (!user) return false;

  if (requiredRole === 'admin') {
    return user.role === 'admin';
  }

  if (requiredRole === 'moderator') {
    return user.role === 'moderator' || user.role === 'admin';
  }

  return true; // For 'user' role, any authenticated user qualifies
}