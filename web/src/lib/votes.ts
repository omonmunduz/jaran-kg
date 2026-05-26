import { supabase } from './supabase';

export async function getUserVoteOnIncident(
  userId: string,
  incidentId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('incident_votes')
    .select('id')
    .eq('incident_id', incidentId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !!data;
}

export async function toggleVote(userId: string, incidentId: string) {
  const hasVoted = await getUserVoteOnIncident(userId, incidentId);

  if (hasVoted) {
    const { error } = await supabase
      .from('incident_votes')
      .delete()
      .eq('incident_id', incidentId)
      .eq('user_id', userId);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('incident_votes')
      .insert([
        {
          incident_id: incidentId,
          user_id: userId,
        },
      ]);

    if (error) throw error;
  }
}

export async function getIncidentVoteCount(incidentId: string): Promise<number> {
  const { data, error, count } = await supabase
    .from('incident_votes')
    .select('*', { count: 'exact', head: true })
    .eq('incident_id', incidentId);

  if (error) throw error;
  return count ?? 0;
}
