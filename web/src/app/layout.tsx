import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Civic Platform',
  description: 'Report and track civic issues in Kyrgyzstan',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
