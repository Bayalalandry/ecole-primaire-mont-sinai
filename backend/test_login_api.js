const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoginAPI() {
  console.log('Testing login via API...\n');

  try {
    const response = await fetch(`${process.env.API_URL || 'http://localhost:5000'}/api/auth/login`, {
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

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok && data.token) {
      console.log('\n✅ Login successful!');
      console.log('User:', data.user);
    } else {
      console.log('\n❌ Login failed');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testLoginAPI();
