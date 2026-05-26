'use client';

import { useCallback, useEffect, useState } from 'react';
import { toggleVote, getUserVoteOnIncident, getIncidentVoteCount } from '@/lib/votes';

export function useIncidentVote(incidentId: string, userId?: string) {
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchVoteStatus = async () => {
      try {
        const voted = await getUserVoteOnIncident(userId, incidentId);
        setHasVoted(voted);
      } catch (err) {
        console.error('Failed to fetch vote status:', err);
      }
    };

    fetchVoteStatus();
  }, [userId, incidentId]);

  useEffect(() => {
    const fetchVoteCount = async () => {
      try {
        const count = await getIncidentVoteCount(incidentId);
        setVoteCount(count);
      } catch (err) {
        console.error('Failed to fetch vote count:', err);
      }
    };

    fetchVoteCount();
  }, [incidentId]);

  const toggleUserVote = useCallback(async () => {
    if (!userId) {
      console.error('User must be authenticated to vote');
      return;
    }

    try {
      setLoading(true);
      await toggleVote(userId, incidentId);
      setHasVoted(!hasVoted);

      const newCount = await getIncidentVoteCount(incidentId);
      setVoteCount(newCount);
    } catch (err) {
      console.error('Failed to toggle vote:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, incidentId, hasVoted]);

  return { hasVoted, voteCount, toggleUserVote, loading };
}
