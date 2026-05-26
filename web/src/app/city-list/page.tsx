'use client';

import { useEffect, useState } from 'react';
import type { Incident, Category } from '@civic-platform/shared';
import { IncidentList } from '@/components/IncidentList';
import { supabase } from '@/lib/supabase';

export default function CityListPage() {
  const [incidents, setIncidents] = useState<(Incident & { category: Category })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUserId(session?.user.id ?? null);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);

        // Get incidents with 5+ upvotes
        const { data, error: queryError } = await supabase
          .from('incidents')
          .select('*, category:categories(*)')
          .gte('upvotes', 5)
          .eq('status', 'open')
          .order('upvotes', { ascending: false })
          .order('created_at', { ascending: true });

        if (queryError) throw queryError;

        setIncidents((data || []) as unknown as (Incident & { category: Category })[]);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load accountability list'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            City Accountability
          </h1>
          <p className="text-gray-600 mb-6">
            Transparency and accountability matter. Below are high-priority civic
            issues that the community has voted on. These reports receive official
            attention when enough citizens confirm they've seen the same problem.
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <IncidentList incidents={incidents} isLoading={loading} userId={userId} />

        {!loading && incidents.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center">
            <p className="text-gray-600 mb-4">
              No high-priority issues reported yet. Community reports with 5+ votes
              appear here to drive municipal accountability.
            </p>
            <a
              href="/report"
              className="inline-block rounded-lg bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600"
            >
              Report an Issue
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
