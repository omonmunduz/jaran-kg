'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface AdminNavLinkProps {
  className?: string;
}

export default function AdminNavLink({ className = '' }: AdminNavLinkProps) {
  const { isAdmin, loading } = useAuth();

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <Link
      href="/admin"
      className={`text-gray-300 hover:text-amber-500 transition-colors font-medium ${className}`}
    >
      Admin
    </Link>
  );
}