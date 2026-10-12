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

async function resetSecretaryPasswordProd() {
  console.log('Resetting secretary password in PRODUCTION database...\n');

  try {
    const { data: secretary } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'secretary')
      .limit(1)
      .maybeSingle();

    if (!secretary) {
      console.error('No secretary found');
      process.exit(1);
    }

    console.log(`Secretary found: ${secretary.username}`);

    const newPassword = 'secretary123';
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', secretary.id);

    if (error) {
      console.error('Error resetting password:', error);
      process.exit(1);
    }

    console.log('Password reset successfully!');
    console.log('\nLogin credentials:');
    console.log(`Username: ${secretary.username}`);
    console.log(`Password: ${newPassword}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetSecretaryPasswordProd();
