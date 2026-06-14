'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface IncidentWithUser {
  id: string;
  title: string;
  category: string;
  status: string;
  category_name: string;
  reporter: string;
  upvotes: number;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  // ALL useState hooks must be here, before any early returns
  const [activeTab, setActiveTab] = useState<'users' | 'incidents'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingIncidents, setLoadingIncidents] = useState(true);

  // Auth redirect effect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (!authLoading && user && !isAdmin) {
      router.push('/');
    }
  }, [user, authLoading, isAdmin, router]);

  // Data fetching effects come after, also before any returns
  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
      }
      setLoadingUsers(false);
    };

    fetchUsers();
  }, [isAdmin]);

  // Only conditional returns AFTER all hooks
  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div>Loading...</div>
      </main>
    );
  }

  if (!user || !isAdmin) return null;

  
  const fetchIncidents = async () => {
  setLoadingIncidents(true);
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Incidents fetch error code:', error.code);
      console.error('Incidents fetch error message:', error.message);
      console.error('Incidents fetch error details:', error.details);
      setIncidents([]);
      setLoadingIncidents(false);
      return;
    }

    // Fetch categories and users separately to avoid join issues
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name_ru');

    const { data: usersData } = await supabase
      .from('users')
      .select('id, username, email');

    const merged = (data || []).map((inc) => ({
      ...inc,
      category_name: categoriesData?.find(c => c.id === inc.category)?.name_ru || '—',
      reporter: usersData?.find(u => u.id === inc.user_id)?.username
        || usersData?.find(u => u.id === inc.user_id)?.email
        || '—',
    }));

    setIncidents(merged);
  } catch (err) {
    console.error('Unexpected error fetching incidents:', err);
    setIncidents([]);
  } finally {
    setLoadingIncidents(false);
  }
};

  const handleRoleChange = async (userId: string, newRole: 'user' | 'moderator' | 'admin') => {
  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    console.error('Error updating role:', error);
  } else {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  }
};

  
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <div className="text-sm text-gray-400">
              Admin: {user?.email}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  fetchUsers();
                  fetchIncidents();
                }}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Refresh Data
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-amber-500 hover:text-amber-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex space-x-1 bg-gray-900 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-amber-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'incidents'
                ? 'bg-amber-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Incidents
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Manage Users</h2>

            {loadingUsers ? (
              <div className="text-center py-8 text-gray-400">Loading users...</div>
            ) : (
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">No users found</td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="border-t border-gray-700">
                          <td className="px-4 py-3">{u.username || '—'}</td>
                          <td className="px-4 py-3">{u.email || '—'}</td>
                          <td className="px-4 py-3">{u.phone || '—'}</td>
                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as 'user' | 'moderator' | 'admin')}
                              className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                            >
                              <option value="user">User</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Incidents Tab */}
        {activeTab === 'incidents' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Manage Incidents</h2>

            {loadingIncidents ? (
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : incidents.length === 0 ? (
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">No incidents found</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {incidents.map((inc) => (
                      <tr key={inc.id} className="border-t border-gray-700 cursor-pointer hover:bg-gray-800"
                        onClick={() => router.push(`/incident/${inc.id}`)}>
                        <td className="px-4 py-3">{inc.title}</td>
                        <td className="px-4 py-3">{inc.category_name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            inc.status === 'open' ? 'bg-green-600' :
                            inc.status === 'investigating' ? 'bg-yellow-600' :
                            inc.status === 'resolved' ? 'bg-blue-600' : 'bg-gray-600'
                          }`}>
                            {inc.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">{inc.reporter}</td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {new Date(inc.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}