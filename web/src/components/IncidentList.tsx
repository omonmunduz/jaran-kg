'use client';

import type { Incident, Category } from '@civic-platform/shared';
import { IncidentCard } from './IncidentCard';

interface IncidentListProps {
  incidents: (Incident & { category?: Category })[];
  isLoading?: boolean;
  userId?: string;
  onVoteChange?: () => void;
}

export function IncidentList({
  incidents,
  isLoading = false,
  userId,
  onVoteChange,
}: IncidentListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-gray-200 bg-gray-100 h-96"
          />
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">No incidents found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {incidents.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident as Incident & { category: Category }}
          userId={userId}
          onVoteChange={onVoteChange}
        />
      ))}
    </div>
  );
}
