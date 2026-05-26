export interface User {
  id: string;
  phone: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  role: 'user' | 'moderator' | 'admin';
}

export interface Category {
  id: string;
  name_ru: string;
  name_ky: string;
  icon: string;
  color: string;
}

export interface Incident {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  upvotes: number;
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

export interface Comment {
  id: string;
  incident_id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
