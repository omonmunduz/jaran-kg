'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { CommentSection } from '@/components/CommentSection';
import { CommentInput } from '@/components/CommentInput';
import { useIncidentVote } from '@/hooks/useIncidentVote';
import { cn } from '@/lib/utils';
import { getIncidentById } from '@/lib/incidents';
import { supabase } from '@/lib/supabase';
import ModeratorControls from '@/components/ModeratorControls';
import type { Incident, Category } from '@civic-platform/shared';

// Timeline entry interface
interface TimelineEntry {
  id: string;
  text: string;
  timestamp: string;
  hasAudio: boolean;
  audioUrl?: string;
  transcription?: string;
}

export default function IncidentDetailPage() {
  const [incident, setIncident] = useState<(Incident & { category: Category }) | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [showTranscriptions, setShowTranscriptions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const [session, setSession] = useState<any>(null);
  const [dbTimeline, setDbTimeline] = useState<any[]>([]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

  // Function to handle status updates
  const handleStatusUpdate = (newStatus: string) => {
    if (incident) {
      setIncident(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Function to add timeline entry (for when ModeratorControls adds one)
  const addTimelineEntry = (entry: any) => {
    setTimeline(prev => [entry, ...prev]);
  };

  const { hasVoted, voteCount, handleVote, loading: voteLoading } = useIncidentVote(
    incident?.id || '',
    session?.user?.id
  );

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get ID from URL params (Next.js dynamic route)
        const id = Array.isArray(params.id) ? params.id[0] : params.id;
        if (!id) {
          setError('Incident not found');
          return;
        }

        const data = await getIncidentById(id);
        setIncident(data as Incident & { category: Category });

        // Fetch timeline entries from database
        const { data: timelineData, error: timelineError } = await supabase
          .from('timeline_entries')
          .select('*')
          .eq('incident_id', id)
          .order('created_at', { ascending: false });

        if (timelineError) {
          console.error('Error fetching timeline:', timelineError);
          // Fallback to mock data
          const mockTimeline: TimelineEntry[] = [
            {
              id: '1',
              text: 'Incident reported by community member',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              hasAudio: false,
            },
            {
              id: '2',
              text: 'City authorities have been notified',
              timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
              hasAudio: true,
              audioUrl: '#', // Placeholder
              transcription: 'The issue has been logged in our system. We are working to resolve it within 24 hours.',
            },
            {
              id: '3',
              text: 'Assessment team dispatched to location',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              hasAudio: false,
            },
          ];
          setTimeline(mockTimeline);
          setDbTimeline([]);
        } else {
          // Convert timeline entries to our format
          const formattedTimeline: TimelineEntry[] = timelineData.map(entry => ({
            id: entry.id,
            text: entry.text,
            timestamp: entry.created_at,
            hasAudio: false,
          }));
          setTimeline(formattedTimeline);
          setDbTimeline(timelineData);
        }
      } catch (err) {
        console.error('Error fetching incident:', err);
        setError('Failed to load incident');
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();
  }, [params.id]);

  // Set up real-time subscription for timeline updates
  useEffect(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!id) return;

    const channel = supabase
      .channel(`timeline-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'timeline_entries',
          filter: `incident_id=eq.${id}`,
        },
        (payload) => {
          // Add new timeline entry to the top
          const newEntry = {
            id: payload.new.id,
            text: payload.new.text,
            timestamp: payload.new.created_at,
            hasAudio: false,
          };
          setTimeline(prev => [newEntry, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id]);

  const toggleTranscription = (entryId: string) => {
    setShowTranscriptions(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    if (incident) {
      const url = `${window.location.origin}/incident/${incident.id}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: incident.title,
            text: incident.description,
            url: url,
          });
        } catch (err) {
          console.log('Error sharing:', err);
        }
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">Loading incident...</div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error || 'Incident not found'}</div>
          <Button onClick={handleBack} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={handleBack}
              variant="ghost"
              className="text-gray-400 hover:text-white flex items-center gap-2"
            >
              ← Back
            </Button>

            <div className="flex items-center gap-2">
              <span
                className={`rounded px-3 py-1 text-xs font-medium ${
                  incident.status === 'open' ? 'bg-red-900 text-red-200' :
                  incident.status === 'investigating' ? 'bg-yellow-900 text-yellow-200' :
                  incident.status === 'resolved' ? 'bg-green-900 text-green-200' :
                  'bg-gray-700 text-gray-200'
                }`}
              >
                {incident.status.toUpperCase()}
              </span>
              <button
                onClick={handleShare}
                className="text-gray-400 hover:text-white p-2"
                aria-label="Share"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              </button>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            {incident.title}
          </h1>

          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>📍 {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}</span>
            <span>📅 {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleVote}
              disabled={voteLoading || hasVoted}
              className={cn(
                "flex items-center gap-2 transition-all duration-200 hover:scale-105",
                hasVoted
                  ? 'bg-yellow-500 text-black hover:bg-yellow-400 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              )}
              title={hasVoted ? "You already voted for this incident" : "Click to upvote"}
            >
              <span className={cn(
                "transition-transform duration-200",
                hasVoted ? 'text-xl' : 'hover:scale-110'
              )}>
                👍
              </span>
              <span className={cn(
                "font-medium",
                hasVoted && "text-black"
              )}>
                {hasVoted ? 'Voted' : `${voteCount} ${voteCount === 1 ? 'vote' : 'votes'}`}
              </span>
              {voteLoading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 pb-24">
        {/* Hero Image */}
        {incident.image_url && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <div className="relative h-64 bg-gray-800">
              <Image
                src={incident.image_url}
                alt={incident.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
          <p className="text-gray-300 whitespace-pre-wrap">
            {incident.description}
          </p>
        </div>

        {/* Moderator Controls */}
        <ModeratorControls
          incidentId={incident.id}
          currentStatus={incident.status}
          onUpdateStatus={handleStatusUpdate}
        />

        {/* Timeline Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Timeline</h2>

          <div className="space-y-4">
            {timeline.map((entry, index) => (
              <div key={entry.id} className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-400 text-sm">
                        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-gray-300 mb-3">{entry.text}</p>

                    {entry.hasAudio && (
                      <div className="space-y-2">
                        <audio controls className="w-full">
                          <source src={entry.audioUrl || ''} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>

                        {entry.transcription && (
                          <button
                            onClick={() => toggleTranscription(entry.id)}
                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                          >
                            {showTranscriptions[entry.id] ? 'Hide Transcription' : 'See Transcription'}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}

                        {showTranscriptions[entry.id] && entry.transcription && (
                          <div className="mt-2 p-3 bg-gray-800 rounded text-sm text-gray-300">
                            <p className="font-medium mb-1">Transcription:</p>
                            <p>{entry.transcription}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {index < timeline.length - 1 && (
                  <div className="ml-2.5 w-px h-8 bg-gray-700 mt-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Comments</h2>

          <div className="pb-32"> {/* Space for sticky input */}
            <CommentSection
              incidentId={incident.id}
              userId={session?.user?.id}
            />
          </div>
        </div>
      </div>

      {/* Sticky Comment Input */}
      <CommentInput
        incidentId={incident.id}
        userId={session?.user?.id}
      />
    </main>
  );
}