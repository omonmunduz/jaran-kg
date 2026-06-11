'use client';

import { useEffect, useState } from 'react';
import type { Incident, Category } from '@civic-platform/shared';
import { IncidentMapView } from '@/components/IncidentMapView';
import { IncidentCard } from '@/components/IncidentCard';
import { getIncidents } from '@/lib/incidents';
import { subscribeToIncidents, fetchIncidentWithCategory } from '@/lib/subscriptions';
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

  // Subscribe to real-time incident updates
  useEffect(() => {
    const subscription = subscribeToIncidents(async (payload) => {
      try {
        // Get full incident data with category
        const fullIncident = await fetchIncidentWithCategory(payload.new?.id || payload.old?.id);

        if (payload.eventType === 'INSERT') {
          // Add new incident if status is open
          if (fullIncident.status === 'open') {
            setIncidents((prev) => [fullIncident as Incident & { category: Category }, ...prev]);
          }
        } else if (payload.eventType === 'UPDATE') {
          // Update existing incident or remove if no longer open
          setIncidents((prev) => {
            if (fullIncident.status === 'open') {
              return prev.map((inc) => (inc.id === fullIncident.id ? (fullIncident as Incident & { category: Category }) : inc));
            } else {
              return prev.filter((inc) => inc.id !== fullIncident.id);
            }
          });
        } else if (payload.eventType === 'DELETE') {
          // Remove deleted incident
          setIncidents((prev) => prev.filter((inc) => inc.id !== payload.old.id));
        }
      } catch (err) {
        console.error('Error handling incident update:', err);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredIncidents = incidents.filter(
    (incident) =>
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-black">
      <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - Hidden on Mobile */}
        <div className="hidden lg:flex lg:w-96 bg-gray-900 border-r border-gray-800 flex-col overflow-hidden">
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
        <div className="flex-1 flex flex-col relative">
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

          {/* Mobile Bottom Panel */}
          <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent pt-12 pb-4 px-4">
            {selectedIncident ? (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    {/* ✅ ADD THIS IMAGE BLOCK */}
            {selectedIncident.image_url && (
              <div className="mb-3 h-40 bg-gray-700 rounded overflow-hidden">
                <img
                  src={selectedIncident.image_url}
                  alt={selectedIncident.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h2 className="text-white font-bold text-lg">{selectedIncident.title}</h2>
                    <p className="text-gray-400 text-sm mt-1">{selectedIncident.description.substring(0, 100)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="text-gray-400 text-xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    selectedIncident.status === 'open'
                      ? 'bg-red-900 text-red-200'
                      : 'bg-gray-700 text-gray-200'
                  }`}>
                    {selectedIncident.status.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-xs py-1">{selectedIncident.upvotes} votes</span>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-white font-bold text-lg mb-1">AROUND YOU</h2>
                <p className="text-gray-400 text-sm">
                  {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''} nearby
                </p>
              </div>
            )}
          </div>

          {/* Detail Overlay Panel (Desktop) */}
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
      </div>
    </main>
  );
}
