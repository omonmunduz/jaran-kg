import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Civic Awareness Platform</h1>
        <p className="text-gray-600 mb-8">
          Report and track civic issues in your community
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/report">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">Report an Issue</h2>
              <p className="text-gray-600">
                Share civic concerns with your community. Upload photos, describe the issue, and help drive accountability.
              </p>
            </div>
          </Link>

          <Link href="/city-list">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">City Accountability</h2>
              <p className="text-gray-600">
                View high-priority civic issues voted on by the community. No login needed.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
