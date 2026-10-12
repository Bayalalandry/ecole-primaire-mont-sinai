const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLogin() {
  console.log('=== DEBUG LOGIN ===\n');

  try {
    // 1. Vérifier l'utilisateur dans la base
    console.log('1. Checking user in database...');
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'Bayalalandry')
      .maybeSingle();

    if (!user) {
      console.error('❌ User not found in database');
      process.exit(1);
    }

    console.log('✅ User found:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.is_active}`);
    console.log(`   ID: ${user.id}\n`);

    // 2. Tester le login via l'API
    console.log('2. Testing login via API...');
    const apiUrl = 'http://localhost:5000/api/auth/login';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'Bayalalandry',
          password: 'secretary123',
        }),
      });

      const data = await response.json();

      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(data, null, 2));

      if (response.ok && data.token) {
        console.log('\n✅ Login successful via API!');
        console.log('   Token received');
        console.log('   User:', data.user);
      } else {
        console.log('\n❌ Login failed via API');
        console.log('   Error:', data.error || 'Unknown error');
      }
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError.message);
      console.log('   Make sure backend is running on http://localhost:5000');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugLogin();
