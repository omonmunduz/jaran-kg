import { supabase } from './supabase';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];

export async function uploadIncidentMedia(
  file: File
): Promise<{ url: string; path: string }> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, MP4');
  }

  // Generate unique path
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop();
  const path = `incidents/${timestamp}-${random}.${ext}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('civic-reports')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Get public URL
  const { data: publicUrl } = supabase.storage
    .from('civic-reports')
    .getPublicUrl(data.path);

  return {
    url: publicUrl.publicUrl,
    path: data.path,
  };
}

export async function deleteIncidentMedia(path: string) {
  const { error } = await supabase.storage
    .from('civic-reports')
    .remove([path]);

  if (error) throw error;
}
