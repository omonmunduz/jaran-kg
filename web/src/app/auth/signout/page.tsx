'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleSignout = async () => {
      try {
        await supabase.auth.signOut();
        router.push('/');
      } catch (error) {
        console.error('Error signing out:', error);
        router.push('/');
      }
    };

    handleSignout();
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Signing Out
            </h1>
            <p className="text-gray-400">
              You are being redirected to the homepage...
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}