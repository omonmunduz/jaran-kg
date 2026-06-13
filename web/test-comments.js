// Test script for comment system functionality
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to set up test environment)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCommentSystem() {
  console.log('🧪 Testing Comment System...\n');

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing Supabase connection...');
    const { data, error } = await supabase.from('comments').select('count').limit(1);
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Connection successful\n');

    // Test 2: Check incidents table
    console.log('2. Checking incidents table...');
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select('*')
      .limit(5);

    if (incidentsError) {
      console.error('❌ Failed to fetch incidents:', incidentsError.message);
      return;
    }

    if (incidents.length === 0) {
      console.log('ℹ️ No incidents found in database');
    } else {
      console.log(`✅ Found ${incidents.length} incidents`);
      console.log(`📍 Sample incident ID: ${incidents[0].id}\n`);

      // Test 3: Check existing comments
      console.log('3. Checking existing comments...');
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('incident_id', incidents[0].id);

      if (commentsError) {
        console.error('❌ Failed to fetch comments:', commentsError.message);
      } else {
        console.log(`✅ Found ${comments.length} comments for incident ${incidents[0].id}`);
        console.log('📝 Sample comment:', comments[0]?.text || 'No comments found');
      }
    }

    console.log('\n🎉 Basic connectivity test completed!');
    console.log('\n📋 Manual Testing Steps:');
    console.log('1. Open http://localhost:3001/map');
    console.log('2. Click on any incident marker');
    console.log('3. Check if comments section loads');
    console.log('4. Try adding a comment (if logged in)');
    console.log('5. Test edit/delete functionality');

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testCommentSystem();