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

-- Voting is handled directly through the incidents.upvotes column

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

-- Voting updates are handled directly through the incidents.upvotes column

-- Insert default categories
INSERT INTO categories (name_ru, name_ky, icon, color) VALUES
  ('Дорожное движение и ДТП', 'Жол кыймылы жана кырсыктар', 'traffic', '#EF4444'),
  ('Безопасность и преступность', 'Коопсуздук жана кылмыштуулук', 'shield', '#F59E0B'),
  ('Чрезвычайные ситуации', 'Өзгөчө кырдаалдар', 'flame', '#DC2626'),
  ('Коммунальные услуги', 'Коммуналдык кызматтар', 'zap', '#3B82F6'),
  ('Окружающая среда', 'Айлана-чөйрө', 'leaf', '#10B981'),
  ('Городская инфраструктура', 'Шаардык инфраструктура', 'building', '#8B5CF6'),
  ('Мусор и отходы', 'Таштанды жана калдыктар', 'trash-2', '#6B7280'),
  ('Наводнения', 'Суу ташкындары', 'droplets', '#0EA5E9'),
  ('Другое', 'Башка', 'help-circle', '#9CA3AF'),
  ('Животные', 'Жаныбарлар', 'paw', '#F97316');