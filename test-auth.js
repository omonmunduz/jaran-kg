// Test script to check Supabase auth
// Run this in the browser console on the report page

console.log('Testing Supabase auth...');

// Check if Supabase is initialized
if (window.supabase) {
  console.log('Supabase client exists');

  // Get current session
  window.supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Session error:', error);
    } else {
      console.log('Current session:', data);
    }
  });

  // Get user profile
  window.supabase.auth.getUser().then(({ data, error }) => {
    if (error) {
      console.error('User error:', error);
    } else {
      console.log('Current user:', data);
    }
  });
} else {
  console.error('Supabase client not found');
}