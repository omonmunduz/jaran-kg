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
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user.id) {
        router.push('/auth/login');
        return;
      }

      // Ensure user exists in users table
      await ensureUserExists(session.user.id, session.user.user_metadata?.username);

      setUserId(session.user.id);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </main>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Report a Civic Issue
          </h1>
          <p className="text-gray-600">
            Help your community by reporting problems in your neighborhood.
            Share photos, describe the issue, and help officials prioritize solutions.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <IncidentForm userId={userId} />
        </div>
      </div>
    </main>
  );
}
