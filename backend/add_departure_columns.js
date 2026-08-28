const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function addDepartureColumns() {
  console.log('=== AJOUT DES COLONNES DEPARTURE_DATE ET DEPARTURE_REASON ===\n');

  const sql = `
    ALTER TABLE students
    ADD COLUMN IF NOT EXISTS departure_date DATE,
    ADD COLUMN IF NOT EXISTS departure_reason TEXT;
  `;

  // Utiliser RPC pour exécuter le SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error('Erreur:', error);
    console.log('\nNOTE: Veuillez executer manuellement le script SQL suivant dans l\'editeur Supabase:');
    console.log(sql);
    return;
  }

  console.log('OK - Colonnes ajoutees avec succes');
}

addDepartureColumns();
