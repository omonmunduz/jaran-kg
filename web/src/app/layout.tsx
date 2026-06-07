import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Jaran - Civic Awareness Platform',
  description: 'Report and track civic issues in Bishkek',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
