'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import type { Comment } from '@civic-platform/shared';
import { getCommentsByIncident, createComment } from '@/lib/comments';
import { subscribeToComments } from '@/lib/subscriptions';
import { supabase } from '@/lib/supabase';

interface CommentSectionProps {
  incidentId: string;
  userId?: string;
}

interface CommentWithUser extends Comment {
  user: {
    username: string;
    avatar_url: string | null;
  };
}

export function CommentSection({ incidentId, userId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

  useEffect(() => {
    fetchComments();
  }, [incidentId]);

  // Subscribe to real-time comment updates
  useEffect(() => {
    if (!incidentId) return;

    const subscription = subscribeToComments(incidentId, () => {
      // Refresh comments when they change
      fetchComments();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [incidentId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCommentsByIncident(incidentId);
      setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;
    if (!session?.user?.id) {
      // User not authenticated, redirect to login
      await supabase.auth.signOut();
      return;
    }

    setSubmitting(true);
    try {
      await createComment({
        incident_id: incidentId,
        user_id: session.user.id,
        text: newComment.trim(),
      });

      setNewComment('');
      await fetchComments(); // Refresh comments
    } catch (err) {
      console.error('Error creating comment:', err);
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      await fetchComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  const handleUpdateComment = async (commentId: string, newText: string) => {
    try {
      await supabase
        .from('comments')
        .update({ text: newText })
        .eq('id', commentId);

      await fetchComments();
    } catch (err) {
      console.error('Error updating comment:', err);
      setError('Failed to update comment');
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-400">Loading comments...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Comments</h2>
        <span className="text-sm text-gray-400">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {/* Comments List */}
      <div className="space-y-4 pb-20">
        {comments.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No comments yet.</p>
            {session?.user && <p className="text-sm mt-2">Be the first to comment!</p>}
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                {comment.user.avatar_url ? (
                  <div className="relative flex-shrink-0">
                    <Image
                      src={comment.user.avatar_url}
                      alt={comment.user.username}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 text-sm font-medium">
                      {comment.user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-sm">
                      {comment.user.username}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                    {session?.user?.id === comment.user_id && (
                      <div className="flex gap-1 ml-auto">
                        <button
                          onClick={() => {
                            const newText = prompt('Edit comment:', comment.text);
                            if (newText !== null) {
                              handleUpdateComment(comment.id, newText);
                            }
                          }}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-400 hover:text-red-400 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">
                    {comment.text}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}