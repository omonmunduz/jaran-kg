'use client';

import { FormEvent, useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@civic-platform/shared';
import { MapDropPin } from './MapDropPin';
import { supabase } from '@/lib/supabase';
import { createIncident } from '@/lib/incidents';
import { uploadIncidentMedia } from '@/lib/upload';
import { getCategories } from '@/lib/incidents';

interface IncidentFormProps {
  userId: string | null;
  onSuccess?: () => void;
}

export function IncidentForm({ userId, onSuccess }: IncidentFormProps) {
  // If no user ID, show error message
  if (!userId) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-center">
        <p className="text-red-400">Please log in to submit a report.</p>
        <a href="/auth/login" className="inline-block mt-2 text-amber-500 hover:underline">
          Go to login
        </a>
      </div>
    );
  }
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the form update handlers
  const updateFormData = useCallback((newData: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  }, []);

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setLocation({ lat, lng });
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
        if (cats.length > 0) {
          updateFormData({ category: cats[0].id });
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, [updateFormData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(f);
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!location) {
      setError('Please select a location on the map');
      return;
    }

    if (!formData.category || !formData.title || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let imageUrl: string | undefined;

      if (file) {
        const { url } = await uploadIncidentMedia(file);
        imageUrl = url;
      }

      const { data: newIncident, error: incidentError } = await supabase
        .from('incidents')
        .insert([
          {
            user_id: userId,
            category: formData.category,
            title: formData.title,
            description: formData.description,
            lat: location.lat,
            lng: location.lng,
            image_url: imageUrl,
            status: 'open',
            upvotes: 0,
          },
        ])
        .select()
        .single();

      if (incidentError) {
        throw incidentError;
      }

      onSuccess?.();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-900/20 p-4 text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) =>
            updateFormData({ category: e.target.value })
          }
          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name_ru}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              updateFormData({ title: e.target.value })
            }
            placeholder="Brief description of the issue"
            className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            required
          />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            updateFormData({ description: e.target.value })
          }
          placeholder="Provide more details about the issue"
          rows={5}
          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Photo/Video (optional)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,video/mp4"
          className="block w-full text-sm text-gray-400"
        />
        {preview && (
          <div className="mt-2 relative h-48 w-full bg-gray-700 rounded-lg overflow-hidden">
            {file?.type.startsWith('image/') ? (
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                src={preview}
                className="h-full w-full object-cover"
                controls
              />
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Location * (click on map to select)
        </label>
        <MapDropPin onLocationSelect={handleLocationSelect} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-amber-500 py-2 px-4 font-medium text-gray-900 transition-colors hover:bg-amber-600 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Report'}
      </button>
    </form>
  );
}
