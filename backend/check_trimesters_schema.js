/**
 * Script pour vérifier le schéma de la table trimesters
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: SUPABASE_URL et SUPABASE_ANON_KEY doivent être définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrimestersSchema() {
  console.log('🔍 Vérification du schéma de la table trimesters...\n');

  try {
    // Essayer de récupérer des données existantes
    const { data, error } = await supabase
      .from('trimesters')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erreur:', error);
    } else {
      console.log('✅ Données trimesters:', data);
      if (data && data.length > 0) {
        console.log('   Colonnes:', Object.keys(data[0]));
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkTrimestersSchema();
