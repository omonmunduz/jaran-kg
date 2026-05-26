'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Incident, Category } from '@civic-platform/shared';
import { useIncidentVote } from '@/hooks/useIncidentVote';
import { formatDistanceToNow } from 'date-fns';

interface IncidentCardProps {
  incident: Incident & { category: Category };
  userId?: string;
  onVoteChange?: () => void;
}

const statusColors: Record<string, string> = {
  open: 'bg-red-100 text-red-800',
  investigating: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function IncidentCard({
  incident,
  userId,
  onVoteChange,
}: IncidentCardProps) {
  const router = useRouter();
  const { hasVoted, voteCount, toggleUserVote, loading } = useIncidentVote(
    incident.id,
    userId
  );

  const handleVote = async () => {
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    await toggleUserVote();
    onVoteChange?.();
  };

  const daysAgo = formatDistanceToNow(new Date(incident.created_at), {
    addSuffix: true,
  });

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg">
      {incident.image_url && (
        <div className="relative h-48 w-full bg-gray-200">
          <Image
            src={incident.image_url}
            alt={incident.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div
            className="rounded px-2 py-1 text-sm font-semibold text-white"
            style={{ backgroundColor: incident.category.color }}
          >
            {incident.category.icon && <span className="mr-1">📍</span>}
            {incident.category.name_ru}
          </div>
          <span
            className={`rounded px-2 py-1 text-xs font-medium ${statusColors[incident.status]}`}
          >
            {statusLabels[incident.status]}
          </span>
        </div>

        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900">
          {incident.title}
        </h3>

        <p className="mb-3 line-clamp-2 text-sm text-gray-600">
          {incident.description}
        </p>

        <div className="mb-3 text-xs text-gray-500">
          📍 {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
        </div>

        <div className="text-xs text-gray-500 mb-4">{daysAgo}</div>

        <button
          onClick={handleVote}
          disabled={loading}
          className={`w-full rounded py-2 px-3 font-medium transition-colors ${
            hasVoted
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
          }`}
        >
          {loading
            ? '...'
            : `👍 I've seen this too (${voteCount})`}
        </button>
      </div>
    </div>
  );
}
