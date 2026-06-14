-- Add timeline table for incident tracking
CREATE TABLE IF NOT EXISTS timeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create index for timeline entries
CREATE INDEX idx_timeline_entries_incident_id ON timeline_entries(incident_id);
CREATE INDEX idx_timeline_entries_created_at ON timeline_entries(created_at);

-- Enable RLS for timeline entries
ALTER TABLE timeline_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for timeline entries
CREATE POLICY "Anyone can view timeline entries"
  ON timeline_entries FOR SELECT
  USING (true);

CREATE POLICY "Users can create timeline entries for their incidents"
  ON timeline_entries FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM incidents WHERE id = incident_id)
  );

CREATE POLICY "Users can update their own timeline entries"
  ON timeline_entries FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM incidents WHERE id = incident_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM incidents WHERE id = incident_id));

CREATE POLICY "Users can delete their own timeline entries"
  ON timeline_entries FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM incidents WHERE id = incident_id));

-- Update existing RLS policies to allow moderators and admins

-- Allow moderators and admins to update any incident
CREATE POLICY "Moderators can update incidents"
  ON incidents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

-- Allow admins to update any user's role
CREATE POLICY "Admins can update user roles"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow moderators and admins to create timeline entries for any incident
CREATE POLICY "Moderators and admins can create timeline entries"
  ON timeline_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

-- Allow admins to update any timeline entry
CREATE POLICY "Admins can update any timeline entry"
  ON timeline_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete any timeline entry
CREATE POLICY "Admins can delete any timeline entry"
  ON timeline_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );