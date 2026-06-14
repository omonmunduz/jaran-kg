'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { IncidentForm } from '@/components/IncidentForm';

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div>Loading...</div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Report a Civic Issue</h1>
          <p className="text-gray-400">
            Help your community by reporting problems in your neighborhood.
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          <IncidentForm userId={user.id} />
        </div>
      </div>
    </main>
  );
}
