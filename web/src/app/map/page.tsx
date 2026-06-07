'use client';

import { useEffect, useState } from 'react';
import type { Incident, Category } from '@civic-platform/shared';
import { IncidentMapView } from '@/components/IncidentMapView';
import { IncidentCard } from '@/components/IncidentCard';
import { getIncidents } from '@/lib/incidents';
import Image from 'next/image';

export default function MapPage() {
  const [incidents, setIncidents] = useState<(Incident & { category: Category })[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<(Incident & { category: Category }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

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
        setLoading(false);
        const data = await getIncidents({ status: 'open' });
        setIncidents((data || []) as unknown as (Incident & { category: Category })[]);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load incidents'
        );
      }
    };

    fetchIncidents();
  }, []);

  const filteredIncidents = incidents.filter(
    (incident) =>
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-black">
      <div className="h-screen flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-96 bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold text-white mb-4">Incidents</h1>
            <div className="relative">
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:bg-gray-700 text-sm"
              />
            </div>
          </div>

          {/* Incident List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-gray-400 text-center">
                Loading incidents...
              </div>
            ) : error ? (
              <div className="p-4 text-red-400 text-sm">
                {error}
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                {searchQuery ? 'No incidents match your search' : 'No incidents reported yet'}
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {filteredIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedIncident?.id === incident.id
                        ? 'bg-blue-600'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {incident.image_url && (
                      <div className="mb-2 h-20 bg-gray-700 rounded overflow-hidden">
                        <img
                          src={incident.image_url}
                          alt={incident.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="text-white font-semibold text-sm truncate">
                      {incident.title}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                      {incident.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        incident.status === 'open'
                          ? 'bg-red-900 text-red-200'
                          : incident.status === 'investigating'
                          ? 'bg-yellow-900 text-yellow-200'
                          : incident.status === 'resolved'
                          ? 'bg-green-900 text-green-200'
                          : 'bg-gray-700 text-gray-200'
                      }`}>
                        {incident.status.toUpperCase()}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {incident.upvotes} votes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-800 p-4">
            <a
              href="/report"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-center transition-colors"
            >
              Report an Issue
            </a>
          </div>
        </div>

        {/* Map Section */}
        <div className="flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center bg-gray-800">
              <div className="text-gray-400">Loading map...</div>
            </div>
          ) : (
            <div className="flex-1">
              <IncidentMapView
                incidents={incidents}
                onMarkerClick={setSelectedIncident}
              />
            </div>
          )}
        </div>

        {/* Detail Overlay Panel (Mobile/Tablet) */}
        {selectedIncident && (
          <div className="hidden lg:block absolute bottom-4 right-4 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-lg max-h-96 overflow-y-auto z-10">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h2 className="font-bold text-white">Details</h2>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
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
    </main>
  );
}
