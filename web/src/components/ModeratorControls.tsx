'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface ModeratorControlsProps {
  incidentId: string;
  currentStatus: string;
  onUpdateStatus: (newStatus: string) => void;
}

const statusOptions = [
  { value: 'open', label: 'Open', color: 'bg-red-900 text-red-200' },
  { value: 'investigating', label: 'Investigating', color: 'bg-yellow-900 text-yellow-200' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-900 text-green-200' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-700 text-gray-200' },
];

export default function ModeratorControls({
  incidentId,
  currentStatus,
  onUpdateStatus
}: ModeratorControlsProps) {
  const { user, isAdmin } = useAuth();
  const [newTimelineEntry, setNewTimelineEntry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;

    try {
      const { error } = await supabase
        .from('incidents')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', incidentId);

      if (error) throw error;

      onUpdateStatus(newStatus);

      // Add timeline entry
      await addTimelineEntry(`Status changed to ${newStatus}`, false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimelineEntry.trim()) return;

    setIsSubmitting(true);
    try {
      await addTimelineEntry(newTimelineEntry.trim(), true);
      setNewTimelineEntry('');
    } catch (error) {
      console.error('Error adding timeline entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTimelineEntry = async (text: string, shouldAddToState: boolean) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    const { error } = await supabase
      .from('timeline_entries')
      .insert({
        incident_id: incidentId,
        text: text,
      });

    if (error) throw error;
  };

  const handleDeleteIncident = async () => {
    if (!confirm('Are you sure you want to delete this incident? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('incidents')
        .delete()
        .eq('id', incidentId);

      if (error) throw error;

      // Redirect to map or home page
      window.location.href = '/map';
    } catch (error) {
      console.error('Error deleting incident:', error);
    }
  };

  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Moderation Controls</h3>

      {/* Status Dropdown */}
      <div className="mb-4">
        <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
          Incident Status
        </label>
        <select
          id="status"
          value={currentStatus}
          onChange={handleStatusChange}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Timeline Entry Form */}
      <form onSubmit={handleAddTimeline} className="mb-4">
        <label htmlFor="timeline" className="block text-sm font-medium text-gray-300 mb-2">
          Add Timeline Entry
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="timeline"
            value={newTimelineEntry}
            onChange={(e) => setNewTimelineEntry(e.target.value)}
            placeholder="Add a note about this incident..."
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Button
            type="submit"
            disabled={!newTimelineEntry.trim() || isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </form>

      {/* Delete Button (Admin Only) */}
      {isAdmin && (
        <div>
          <Button
            type="button"
            onClick={handleDeleteIncident}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Incident
          </Button>
        </div>
      )}
    </div>
  );
}