'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password || !formData.passwordConfirm) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
        },
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        throw signUpError;
      }

      if (data?.user) {
        router.push('/report');
      }
    } catch (err) {
      console.error('Full error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create account. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p className="text-gray-400">
              Join the community and report civic issues
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/50 bg-red-900/20 p-4 text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder="your_username"
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="your@email.com"
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.passwordConfirm}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, passwordConfirm: e.target.value }))
                }
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 py-2 px-4 font-medium text-gray-900 transition-colors hover:bg-amber-600 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-amber-500 hover:text-amber-600 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
