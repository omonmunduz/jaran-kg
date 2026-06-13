'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createComment } from '@/lib/comments';
import type { Comment } from '@civic-platform/shared';

interface CommentInputProps {
  incidentId: string;
  userId?: string;
}

export function CommentInput({ incidentId, userId }: CommentInputProps) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useState(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  });

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;
    if (!session?.user?.id) {
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
      // Refresh parent component would happen here in a real app
    } catch (err) {
      console.error('Error creating comment:', err);
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-gray-400 text-sm">
            Log in to add comments
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
      <div className="container mx-auto max-w-4xl">
        {error && (
          <div className="mb-2 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:bg-gray-700 text-sm"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Posting...
              </>
            ) : (
              <>
                Send
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}