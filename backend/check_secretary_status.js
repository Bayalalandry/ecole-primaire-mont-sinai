const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSecretaryStatus() {
  console.log('Checking secretary status in production database...\n');

  try {
    const { data: secretary } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'Bayalalandry')
      .maybeSingle();

    if (!secretary) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('Secretary found:');
    console.log(`  Username: ${secretary.username}`);
    console.log(`  Role: ${secretary.role}`);
    console.log(`  Active: ${secretary.is_active}`);
    console.log(`  Created at: ${secretary.created_at}`);

    if (!secretary.is_active) {
      console.log('\n❌ User is NOT ACTIVE - this causes 403 error on login');
      console.log('Activating user...');

      const { error } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', secretary.id);

      if (error) {
        console.error('Error activating user:', error);
      } else {
        console.log('✅ User activated successfully');
      }
    } else {
      console.log('\n✅ User is ACTIVE');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkSecretaryStatus();
