import { supabase } from './supabase';
import type { Comment } from '@civic-platform/shared';

export async function getCommentsByIncident(incidentId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:users(username, avatar_url)
    `)
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as (Comment & { user: { username: string; avatar_url: string | null } })[];
}

export async function createComment(commentData: {
  incident_id: string;
  user_id: string;
  text: string;
}) {
  try {
    const { data: comment, error } = await supabase
      .from('comments')
      .insert([
        {
          incident_id: commentData.incident_id,
          user_id: commentData.user_id,
          text: commentData.text,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Comment creation error:', error);
      throw error;
    }

    // Return the comment with user data
    const { data: commentWithUser, error: fetchError } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(username, avatar_url)
      `)
      .eq('id', comment.id)
      .single();

    if (fetchError) throw fetchError;
    return commentWithUser as (Comment & { user: { username: string; avatar_url: string | null } });
  } catch (err) {
    console.error('Failed to create comment:', err);
    throw err;
  }
}

export async function updateComment(
  id: string,
  text: string
) {
  const { error } = await supabase
    .from('comments')
    .update({
      text,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteComment(id: string) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}