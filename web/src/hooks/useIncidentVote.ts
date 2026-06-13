'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Incident } from '@civic-platform/shared';

// Constants for localStorage keys
const VOTER_KEY = 'voter_key';
const VOTED_INCIDENTS_KEY = 'voted_incidents';

export function useIncidentVote(incidentId: string, userId?: string) {
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Get or create voter key
  const getVoterKey = useCallback(() => {
    let voterKey = localStorage.getItem(VOTER_KEY);
    if (!voterKey) {
      voterKey = crypto.randomUUID();
      localStorage.setItem(VOTER_KEY, voterKey);
    }
    return voterKey;
  }, []);

  // Get voted incidents from localStorage
  const getVotedIncidents = useCallback(() => {
    try {
      const voted = localStorage.getItem(VOTED_INCIDENTS_KEY);
      return voted ? JSON.parse(voted) : [];
    } catch (error) {
      console.error('Error parsing voted incidents:', error);
      return [];
    }
  }, []);

  // Save voted incidents to localStorage
  const saveVotedIncidents = useCallback((votedIncidents: string[]) => {
    localStorage.setItem(VOTED_INCIDENTS_KEY, JSON.stringify(votedIncidents));
  }, []);

  // Check if user has voted for this incident
  useEffect(() => {
    if (!incidentId) return;

    const votedIncidents = getVotedIncidents();
    setHasVoted(votedIncidents.includes(incidentId));

    // Get the current vote count for the incident
    const fetchVoteCount = async () => {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('upvotes')
          .eq('id', incidentId)
          .single();

        if (error) {
          console.error('Error fetching vote count:', error);
          return;
        }

        setVoteCount(data?.upvotes || 0);
      } catch (err) {
        console.error('Failed to fetch vote count:', err);
      }
    };

    fetchVoteCount();
  }, [incidentId, getVotedIncidents]);

  // Handle voting
  const handleVote = useCallback(async () => {
    if (!incidentId) return;

    // Check if already voted
    const votedIncidents = getVotedIncidents();
    if (votedIncidents.includes(incidentId)) {
      return; // User has already voted
    }

    setLoading(true);

    try {
      // Get current incident data to ensure we have the latest vote count
      const { data: currentIncident, error: fetchError } = await supabase
        .from('incidents')
        .select('upvotes')
        .eq('id', incidentId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const currentVotes = currentIncident?.upvotes || 0;

      // Optimistic UI update
      setVoteCount(currentVotes + 1);
      setHasVoted(true);

      // Update voted incidents in localStorage
      const updatedVotedIncidents = [...votedIncidents, incidentId];
      saveVotedIncidents(updatedVotedIncidents);

      // Update database
      const { error: updateError } = await supabase
        .from('incidents')
        .update({ upvotes: currentVotes + 1 })
        .eq('id', incidentId);

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error('Failed to vote:', err);

      // Rollback optimistic update
      const votedIncidents = getVotedIncidents();
      const updatedVotedIncidents = votedIncidents.filter((id: string) => id !== incidentId);
      saveVotedIncidents(updatedVotedIncidents);

      setHasVoted(false);

      // Refresh vote count to get the actual value
      const { data: currentIncident } = await supabase
        .from('incidents')
        .select('upvotes')
        .eq('id', incidentId)
        .single();

      setVoteCount(currentIncident?.upvotes || 0);
    } finally {
      setLoading(false);
    }
  }, [incidentId, getVotedIncidents, saveVotedIncidents]);

  return { hasVoted, voteCount, handleVote, loading };
}