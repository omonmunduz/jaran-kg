'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { IncidentForm } from '@/components/IncidentForm';
import { ensureUserExists } from '@/lib/incidents';

export default function ReportPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          router.push('/auth/login');
          setLoading(false);
          return;
        }

        if (!session?.user) {
          console.log('No user session, redirecting to login');
          router.push('/auth/login');
          setLoading(false);
          return;
        }

        // Log the user data for debugging
        console.log('User session:', session.user);

        // Ensure user exists in users table
        await ensureUserExists(session.user.id, session.user);

        setUserId(session.user.id);
        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        // Redirect to login on any error
        router.push('/auth/login');
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div>Loading...</div>
      </main>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Report a Civic Issue
          </h1>
          <p className="text-gray-400">
            Help your community by reporting problems in your neighborhood.
            Share photos, describe the issue, and help officials prioritize solutions.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          <IncidentForm userId={userId} />
        </div>
      </div>
    </main>
  );
}
