'use client';

import { useEffect, useState } from 'react';
import type { Incident } from '@civic-platform/shared';
import { getIncidents } from '@/lib/incidents';

interface UseIncidentsOptions {
  category?: string;
  status?: string;
  limit?: number;
}

export function useIncidents(options?: UseIncidentsOptions) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const data = await getIncidents(options);
        setIncidents(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch incidents'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [options?.category, options?.status, options?.limit]);

  return { incidents, loading, error };
}
