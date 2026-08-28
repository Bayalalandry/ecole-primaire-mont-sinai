const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function cleanupLastTest() {
  console.log('=== Nettoyage du dernier test ===\n');
  
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .ilike('last_name', 'Erreur');
    
    if (error) {
      console.log('Erreur:', error.message);
    } else {
      console.log('✅ Élève de test supprimé');
    }
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

cleanupLastTest().then(() => process.exit(0));