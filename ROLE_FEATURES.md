# Role-Based Moderation and Admin Functionality

## Overview
This implementation adds role-based access control to the Jaran civic platform with three user roles: `user`, `moderator`, and `admin`.

## User Roles

### User
- Standard authenticated user
- Can create incidents
- Can comment on incidents
- Can vote on incidents
- Can view all public content

### Moderator
- All user capabilities plus:
- Change incident status (open → investigating → resolved → closed)
- Add timeline entries to incidents
- Update any incident's details

### Admin
- All moderator capabilities plus:
- Delete incidents
- Manage user roles (promote/demote users)
- Access the admin dashboard

## Implementation Details

### 1. Database Schema Updates

#### New Table: `timeline_entries`
```sql
CREATE TABLE timeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### RLS Policies Added
- **Moderators/Admins** can update any incident
- **Admins** can update any user's role
- **Moderators/Admins** can create timeline entries for any incident
- **Admins** can update/delete any timeline entry

### 2. Authentication Context

Created `AuthContext` in `/src/contexts/AuthContext.tsx`:
- Manages user authentication state
- Provides user role information
- Includes hooks: `useAuth()` and `useRole(requiredRole)`
- Prevents unauthorized access to protected routes

### 3. Incident Detail Page Enhancements

Added `ModeratorControls` component with:
- **Status Dropdown**: Change incident status with real-time updates
- **Timeline Entry Form**: Add notes/events to incident timeline
- **Delete Button** (Admin only): Remove incident with confirmation

The page now:
- Fetches timeline entries from database (with fallback to mock data)
- Includes real-time subscription for new timeline updates
- Shows moderator controls only to authorized users

### 4. Admin Dashboard

Protected route at `/admin` with two tabs:

#### Users Tab
- Lists all users with details
- Role selector dropdown for each user
- Real-time role updates via Supabase

#### Incidents Tab
- Lists all incidents with metadata
- Clicking rows navigates to incident detail page
- Shows incident title, category, status, votes, reporter, and date

### 5. Navigation Updates

- **Admin link** added to navigation header
- **Conditionally visible** - only shown to admin users
- **Responsive design** - works on both desktop and mobile

## Security Features

### Route Protection
- Admin dashboard automatically redirects non-admin users
- Uses `useRole('admin')` hook for protection

### Row Level Security (RLS)
- All database operations respect user roles
- Users can only modify their own data unless they have elevated roles
- Moderators and admins have broader permissions for incident management

### Real-time Updates
- Timeline entries update in real-time using Supabase subscriptions
- Role changes are immediately reflected in the UI

## Database Migration

To apply the changes, run the SQL file `/supabase/add_timeline_and_policies.sql` in your Supabase SQL Editor.

## Files Modified/Created

### New Files:
- `/src/contexts/AuthContext.tsx` - Authentication context
- `/src/components/ModeratorControls.tsx` - Moderator controls component
- `/src/components/AdminNavLink.tsx` - Admin navigation link
- `/src/app/admin/page.tsx` - Admin dashboard
- `/supabase/add_timeline_and_policies.sql` - Database schema updates

### Modified Files:
- `/src/app/layout.tsx` - Added AuthProvider
- `/src/app/incident/[id]/page.tsx` - Added moderator controls and timeline
- `/src/components/Header.tsx` - Added admin navigation link

## Testing

1. **Create test users** with different roles in Supabase
2. **Verify admin dashboard** is only accessible to admins
3. **Test moderator controls** on incidents
4. **Confirm timeline entries** persist and update in real-time
5. **Check role management** in admin users tab