const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkPassageDecisionsTable() {
  console.log('=== VERIFICATION TABLE PASSAGE_DECISIONS ===\n');

  // Essayer de récupérer des décisions
  const { data, error } = await supabase
    .from('passage_decisions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Erreur:', error);
    console.log('\nLa table passage_decisions n\'existe peut-etre pas');
  } else {
    console.log('OK - Table passage_decisions existe');
    if (data && data.length > 0) {
      console.log('Colonnes:', Object.keys(data[0]).join(', '));
    }
  }
}

checkPassageDecisionsTable();
