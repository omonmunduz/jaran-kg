'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Map', href: '/map' },
    { name: 'Report', href: '/report' },
    { name: 'Issues', href: '/city-list' },
    { name: 'About', href: '/about' },
  ];

  return (
    <header className="top-0 w-full bg-gray-900/95 backdrop-blur-md border-b border-gray-800 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-bold text-lg">J</span>
            </div>
            <span className="text-xl font-bold text-white">Jaran</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-amber-500 transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/report">Report Issue</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <div className="flex flex-col space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-amber-500 transition-colors font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-3 pt-3 border-t border-gray-800 mt-3">
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/report">Report Issue</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}