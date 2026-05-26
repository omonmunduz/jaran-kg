# Project Setup Checklist

## Before Running

- [ ] Install Node.js 18+
- [ ] Create a Supabase account at https://supabase.com
- [ ] Create a Mapbox account at https://mapbox.com

## Installation

```bash
# 1. Install all dependencies (monorepo mode)
npm install

# 2. Check TypeScript compilation
npm run type-check

# 3. Build all packages
npm run build
```

## Database Setup

1. Create a new Supabase project
2. In Supabase dashboard, go to SQL Editor
3. Create a new query and paste the contents of `/supabase/schema.sql`
4. Run the query to create all tables and RLS policies

## Web App Configuration

1. Copy `.env.example` to `.env.local` in the `/web` directory:
   ```bash
   cp web/.env.example web/.env.local
   ```

2. Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
   ```

3. Start the development server:
   ```bash
   cd web
   npm run dev
   ```

4. Visit http://localhost:3000

## Mobile App Configuration

1. Copy `.env.example` to `.env` in the `/mobile` directory:
   ```bash
   cp mobile/.env.example mobile/.env
   ```

2. Fill in your Supabase credentials

3. Install Expo globally (if not already installed):
   ```bash
   npm install -g expo-cli
   ```

4. Start the Expo development server:
   ```bash
   cd mobile
   npm run dev
   ```

5. Scan the QR code with Expo Go app or press `a` for Android, `i` for iOS

## Key Files to Modify

### For Web App
- `/web/src/app/page.tsx` - Main page
- `/web/src/components/` - React components
- `/web/src/lib/` - Utilities and API calls
- `/web/tailwind.config.js` - Styling configuration

### For Mobile App
- `/mobile/src/App.tsx` - Main app component
- `/mobile/app.json` - Expo configuration

### Shared Types
- `/shared/index.ts` - Update with new types used by both apps

## Internationalization (i18n)

Both apps support Russian (ru) and Kyrgyz (ky). Set up translations in:
- Web: `next-i18next.config.js` with translation files
- Mobile: `i18next` configuration with translation files

## Database Tables

- **users** - Authentication and profiles
- **categories** - Issue types (with Russian/Kyrgyz names)
- **incidents** - Reported issues with location
- **comments** - Comments on incidents

All tables have Row Level Security enabled. Users can only edit their own data.

## Troubleshooting

### "Invalid tool parameters" or "Error writing file"
- Ensure your working directory is `/c/Users/user/Desktop/jaran`
- Check that you have write permissions
- Try running commands from the project root

### Dependencies not installing
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### Supabase connection issues
- Verify your `.env.local` / `.env` files have correct credentials
- Check that your Supabase project is active
- Ensure the API key has appropriate permissions

## Next Steps

1. Set up authentication pages
2. Create incident reporting form
3. Build map component with incident markers
4. Implement real-time updates using Supabase subscriptions
5. Add image upload functionality
6. Create moderation dashboard
