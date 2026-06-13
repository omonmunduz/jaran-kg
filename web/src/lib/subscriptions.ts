import { supabase } from './supabase';
import type { Incident, Category } from '@civic-platform/shared';

export function subscribeToIncidents(
  callback: (payload: any) => void
) {
  const subscription = supabase
    .channel('incidents')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'incidents',
      },
      (payload) => {
        // Fetch the full incident with category data on changes
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
}

export async function fetchIncidentWithCategory(incidentId: string) {
  const { data, error } = await supabase
    .from('incidents')
    .select('*, category:categories(*)')
    .eq('id', incidentId)
    .single();

  if (error) throw error;
  return data as unknown as Incident & { category: Category };
}

export function subscribeToIncidentVotes(
  incidentId: string,
  callback: (payload: any) => void
) {
  const subscription = supabase
    .channel(`votes-${incidentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'incident_votes',
        filter: `incident_id=eq.${incidentId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return subscription;
}

export function subscribeToComments(
  incidentId: string,
  callback: (payload: any) => void
) {
  const subscription = supabase
    .channel(`comments-${incidentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `incident_id=eq.${incidentId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return subscription;
}
