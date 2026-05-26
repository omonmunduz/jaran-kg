import { supabase } from './supabase';
import type { Incident, Category } from '@civic-platform/shared';

export async function getIncidents(filters?: {
  category?: string;
  status?: string;
  limit?: number;
}) {
  let query = supabase
    .from('incidents')
    .select('*, category:categories(*)')
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as Incident[];
}

export async function getIncidentById(id: string) {
  const { data, error } = await supabase
    .from('incidents')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as Incident;
}

export async function createIncident(data: {
  user_id: string;
  category: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  image_url?: string;
}) {
  const { data: incident, error } = await supabase
    .from('incidents')
    .insert([
      {
        ...data,
        status: 'open',
        upvotes: 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return incident as unknown as Incident;
}

export async function updateIncidentStatus(
  id: string,
  status: 'open' | 'investigating' | 'resolved' | 'closed'
) {
  const { error } = await supabase
    .from('incidents')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function getCityListIncidents() {
  const { data, error } = await supabase
    .from('incidents')
    .select('*, category:categories(*)')
    .or('upvotes.gte.5,status.eq.open')
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data as unknown as Incident[]).filter(
    (incident) => incident.upvotes >= 5
  );
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('id');

  if (error) throw error;
  return data as unknown as Category[];
}

export async function getIncidentVoteCount(incidentId: string) {
  const { data, error } = await supabase
    .from('incident_votes')
    .select('*', { count: 'exact' })
    .eq('incident_id', incidentId);

  if (error) throw error;
  return data?.length ?? 0;
}
