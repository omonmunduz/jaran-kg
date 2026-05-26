-- Supabase Schema for Civic Awareness Platform

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ru VARCHAR(255) NOT NULL,
  name_ky VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_incidents_user_id ON incidents(user_id);
CREATE INDEX idx_incidents_category ON incidents(category);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_location ON incidents(lat, lng);
CREATE INDEX idx_comments_incident_id ON comments(incident_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public read access to usernames and avatars"
  ON users FOR SELECT
  USING (true);

-- RLS Policies for categories (read-only public)
CREATE POLICY "Public read access to categories"
  ON categories FOR SELECT
  USING (true);

-- RLS Policies for incidents
CREATE POLICY "Anyone can view incidents"
  ON incidents FOR SELECT
  USING (true);

CREATE POLICY "Users can create incidents"
  ON incidents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incidents"
  ON incidents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own incidents"
  ON incidents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create incident_votes table for upvoting system
CREATE TABLE IF NOT EXISTS incident_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(incident_id, user_id)
);

CREATE INDEX idx_incident_votes_incident_id ON incident_votes(incident_id);
CREATE INDEX idx_incident_votes_user_id ON incident_votes(user_id);

-- Enable RLS for incident_votes
ALTER TABLE incident_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incident_votes
CREATE POLICY "Anyone can view votes"
  ON incident_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create votes"
  ON incident_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON incident_votes FOR DELETE
  USING (auth.uid() = user_id);

-- SQL Function for incident clustering (simplified - groups within bounds)
-- For production, enable PostGIS and use ST_Distance_Sphere for accurate distance
CREATE OR REPLACE FUNCTION get_incident_clusters(distance_meters FLOAT DEFAULT 200)
RETURNS TABLE (
  cluster_id BIGINT,
  incident_ids UUID[],
  incident_count INT,
  center_lat DECIMAL,
  center_lng DECIMAL,
  is_recurring BOOLEAN
) AS $$
WITH incident_coords AS (
  SELECT
    id,
    lat,
    lng,
    status
  FROM incidents
  WHERE status = 'open'
),
distance_squared AS (
  SELECT
    i1.id as incident_id,
    i2.id as nearby_incident_id,
    (i1.lat - i2.lat) * (i1.lat - i2.lat) + (i1.lng - i2.lng) * (i1.lng - i2.lng) as dist_sq
  FROM incident_coords i1
  CROSS JOIN incident_coords i2
  WHERE i1.id != i2.id
    AND (i1.lat - i2.lat) * (i1.lat - i2.lat) + (i1.lng - i2.lng) * (i1.lng - i2.lng) < 0.0004
),
clusters AS (
  SELECT DISTINCT
    ROW_NUMBER() OVER (ORDER BY i1.id) as cluster_id,
    i1.id as incident_id
  FROM incident_coords i1
  LEFT JOIN distance_squared d ON i1.id = d.incident_id
)
SELECT
  cluster_id,
  ARRAY_AGG(c.incident_id),
  COUNT(*),
  AVG(ic.lat),
  AVG(ic.lng),
  COUNT(*) >= 3
FROM clusters c
JOIN incident_coords ic ON c.incident_id = ic.id
GROUP BY cluster_id
HAVING COUNT(*) >= 3;
$$ LANGUAGE SQL STABLE;

-- Trigger to update incidents.upvotes when votes are added/removed
CREATE OR REPLACE FUNCTION update_incident_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE incidents SET upvotes = upvotes + 1 WHERE id = NEW.incident_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE incidents SET upvotes = upvotes - 1 WHERE id = OLD.incident_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER incident_votes_update_trigger
AFTER INSERT OR DELETE ON incident_votes
FOR EACH ROW
EXECUTE FUNCTION update_incident_upvotes();

-- Insert default categories
INSERT INTO categories (name_ru, name_ky, icon, color) VALUES
  ('Дорожное движение', 'Жол кыймылы', 'traffic', '#EF4444'),
  ('Коммунальные услуги', 'Коммуналдык кызматтар', 'utilities', '#3B82F6'),
  ('Окружающая среда', 'Айлана-чөйрө', 'environment', '#10B981'),
  ('Безопасность', 'Коопсуздук', 'security', '#F59E0B'),
  ('Образование', 'Билим берүү', 'education', '#8B5CF6'),
  ('Здоровье', 'Ден-соолук', 'health', '#EC4899');
