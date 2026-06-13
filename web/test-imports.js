// Test script to verify component imports
const fs = require('fs');
const path = require('path');

// Paths to check
const paths = [
  'src/components/CommentSection.tsx',
  'src/components/IncidentCard.tsx',
  'src/components/IncidentForm.tsx',
  'src/lib/comments.ts',
  'src/lib/incidents.ts',
  'src/lib/subscriptions.ts',
  'src/app/incident/[id]/page.tsx'
];

console.log('🔍 Testing file existence...\n');

let allExist = true;
paths.forEach(filePath => {
  const fullPath = path.resolve(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${filePath} exists`);
  } else {
    console.log(`❌ ${filePath} NOT FOUND`);
    allExist = false;
  }
});

if (allExist) {
  console.log('\n🎉 All required files exist!');

  console.log('\n📋 Test Plan for Manual Testing:');
  console.log('===============================');
  console.log('\n1. **Page Navigation Test**');
  console.log('   - Visit http://localhost:3001');
  console.log('   - Click "View Issues" button');
  console.log('   - Verify map loads with incident markers');
  console.log('   - Check that clicking an incident doesn\'t crash the app');

  console.log('\n2. **Incident Detail Test**');
  console.log('   - Click on any incident marker');
  console.log('   - Verify detail panel opens');
  console.log('   - Check all incident information displays correctly');
  console.log('   - Verify "View Details" button works');

  console.log('\n3. **Comment Section Test**');
  console.log('   - Navigate to /incident/[id] (replace [id] with actual incident ID)');
  console.log('   - Verify comments section loads');
  console.log('   - Check "No comments yet" message if empty');
  console.log('   - Verify comment form shows only for logged-in users');

  console.log('\n4. **Authentication Test**');
  console.log('   - Log in (if not already)');
  console.log('   - Try adding a comment');
  console.log('   - Verify edit/delete buttons appear for your comments');

  console.log('\n5. **Real-time Update Test**');
  console.log('   - Add a comment');
  console.log('   - Check if it appears without page refresh');
  console.log('   - Test editing/deleting comments');
} else {
  console.log('\n❌ Some files are missing!');
}