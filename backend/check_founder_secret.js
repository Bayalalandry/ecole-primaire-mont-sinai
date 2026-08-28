const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkFounderSecret() {
  console.log('=== Vérification du secret du fondateur ===\n');
  
  try {
    const { data, error } = await supabase
      .from('founder_settings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Erreur:', error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('Aucun paramètre fondateur trouvé');
      return;
    }
    
    console.log('Paramètres fondateur:');
    console.log(`  ID utilisateur: ${data[0].user_id}`);
    console.log(`  Question secrète: ${data[0].secret_question}`);
    console.log(`  Réponse secrète hashée: ${data[0].secret_answer_hash}`);
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

checkFounderSecret().then(() => process.exit(0));