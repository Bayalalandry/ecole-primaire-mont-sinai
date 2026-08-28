const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getFounderId() {
  console.log('=== ID DU FONDATEUR ===\n');

  try {
    const { data: founder } = await supabase
      .from('users')
      .select('id, username')
      .eq('role', 'founder')
      .maybeSingle();

    if (founder) {
      console.log('Fondateur:', founder.username);
      console.log('ID:', founder.id);

      const { data: settings } = await supabase
        .from('founder_settings')
        .select('secret_answer')
        .eq('user_id', founder.id)
        .maybeSingle();

      if (settings) {
        console.log('Secret:', settings.secret_answer);
      } else {
        console.log('Aucun secret trouvé');
      }
    } else {
      console.log('Aucun fondateur trouvé');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

getFounderId();
