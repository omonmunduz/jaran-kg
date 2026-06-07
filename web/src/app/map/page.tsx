'use client';

import { useEffect, useState } from 'react';
import type { Incident, Category } from '@civic-platform/shared';
import { IncidentMapView } from '@/components/IncidentMapView';
import { IncidentCard } from '@/components/IncidentCard';
import { getIncidents } from '@/lib/incidents';

export default function MapPage() {
  const [incidents, setIncidents] = useState<(Incident & { category: Category })[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<(Incident & { category: Category }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const checkAuth = async () => {
      const { supabase } = await import('@/lib/supabase');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user.id);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const data = await getIncidents({ status: 'open' });
        setIncidents((data || []) as unknown as (Incident & { category: Category })[]);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load incidents'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold text-gray-900">Live Incident Map</h1>
            <p className="text-gray-600 text-sm mt-1">
              {incidents.length} open {incidents.length === 1 ? 'incident' : 'incidents'} reported in the city
            </p>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map section */}
          <div className="flex-1 flex flex-col">
            {error && (
              <div className="bg-red-50 border-b border-red-300 p-4 text-red-800">
                <div className="container mx-auto px-4">
                  {error}
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex-1 flex items-center justify-center bg-gray-100">
                <div className="text-gray-500">Loading incidents...</div>
              </div>
            ) : (
              <div className="flex-1">
                {incidents.length > 0 ? (
                  <IncidentMapView
                    incidents={incidents}
                    onMarkerClick={setSelectedIncident}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">No incidents reported yet</p>
                      <a
                        href="/report"
                        className="inline-block rounded-lg bg-blue-500 px-6 py-2 font-medium text-white hover:bg-blue-600"
                      >
                        Report an Issue
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedIncident && (
            <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="font-bold text-lg">Incident Details</h2>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <IncidentCard
                  incident={selectedIncident}
                  userId={userId}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
