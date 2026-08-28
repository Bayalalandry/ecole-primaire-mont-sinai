const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkFounderSecret() {
  console.log('=== VÉRIFICATION SECRET FONDATEUR ===\n');

  try {
    const { data: founder } = await supabase
      .from('founder_settings')
      .select('secret_answer')
      .eq('user_id', '6f8d7b0e-f3c5-4b2e-9f1a-8d4e6f7a9b0c')
      .maybeSingle();

    if (founder) {
      console.log('Secret du fondateur:', founder.secret_answer);
    } else {
      console.log('Aucun secret trouvé pour le fondateur');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkFounderSecret();
