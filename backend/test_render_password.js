const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRenderPassword() {
  console.log('Testing password hash in production database...\n');

  try {
    const { data: secretary } = await supabase
      .from('users')
      .select('password_hash')
      .eq('username', 'Bayalalandry')
      .maybeSingle();

    if (!secretary) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('Password hash found in database');

    const testPassword = 'secretary123';
    const isValid = await bcrypt.compare(testPassword, secretary.password_hash);

    console.log(`\nTesting password "${testPassword}":`);
    console.log(`Result: ${isValid ? 'VALID' : 'INVALID'}`);

    if (!isValid) {
      console.log('\n❌ Password is INCORRECT in production database');
      console.log('This explains the 401 error');
    } else {
      console.log('\n✅ Password is CORRECT in production database');
      console.log('The 401 error might be from outdated backend code on Render');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testRenderPassword();
