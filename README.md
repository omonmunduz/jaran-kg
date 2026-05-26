# Civic Awareness Platform for Kyrgyzstan

A monorepo containing a web application and mobile app for civic awareness and incident reporting.

## Project Structure

- **`/web`** - Next.js 14 web application with TypeScript
- **`/mobile`** - React Native (Expo) mobile application
- **`/shared`** - Shared TypeScript types and utilities
- **`/supabase`** - Database schema and configuration

## Tech Stack

### Web
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Mapbox GL JS
- Supabase client

### Mobile
- React Native (Expo)
- TypeScript
- React Native Maps
- Supabase client

### Backend
- Supabase (PostgreSQL, Auth, Realtime)
- Row Level Security policies for data protection

### Internationalization
- Russian (Русский)
- Kyrgyz (Кыргызча)

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account
- Mapbox account (for web maps)

### 1. Clone and Install Dependencies

```bash
npm install
```

This installs dependencies for all workspaces.

### 2. Configure Supabase

1. Create a new Supabase project at https://supabase.com
2. Run the schema migration: `supabase/schema.sql`
3. Copy your credentials to respective `.env` files

### 3. Web App Setup

```bash
cd web
cp .env.example .env.local
```

Update `.env.local` with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

Then run:
```bash
npm run dev
```

Visit http://localhost:3000

### 4. Mobile App Setup

```bash
cd mobile
cp .env.example .env
npm install
```

Update `.env` with Supabase credentials.

Run:
```bash
npm run dev
```

Follow Expo prompts to run on iOS, Android, or web.

## Database Schema

### Tables
- **users** - User profiles and roles
- **categories** - Incident categories (with Russian and Kyrgyz names)
- **incidents** - Reported incidents with location data
- **comments** - Comments on incidents

### Row Level Security
- Users can only edit their own incidents and comments
- Categories are publicly readable
- All incidents and comments are publicly viewable

## Development

### Type Checking
```bash
npm run type-check
```

### Build All
```bash
npm run build
```

## Contributing

Please ensure TypeScript types are updated in `/shared` when adding new features.
