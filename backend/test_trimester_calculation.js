/**
 * Script pour tester le calcul du trimestre en cours
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

async function testTrimesterCalculation() {
  console.log('🧪 Test du calcul du trimestre en cours...\n');

  try {
    // Récupérer l'année scolaire actuelle
    const { data: currentYear } = await supabase
      .from('school_years')
      .select('*')
      .eq('is_current', true)
      .maybeSingle();

    if (!currentYear) {
      console.error('❌ Aucune année scolaire actuelle trouvée');
      process.exit(1);
    }

    console.log(`📅 Année scolaire actuelle: ${currentYear.year_label} (ID: ${currentYear.id})`);

    // Récupérer les trimestres
    const { data: trimesters } = await supabase
      .from('trimesters')
      .select('*')
      .eq('school_year_id', currentYear.id)
      .order('trimester_number');

    console.log(`\n📊 Trimestres configurés: ${trimesters?.length || 0}`);

    if (trimesters && trimesters.length > 0) {
      const today = new Date();
      console.log(`\n📆 Date actuelle: ${today.toISOString().split('T')[0]}`);

      let currentTrimester = 'Vacances';
      for (const trimester of trimesters) {
        const startDate = new Date(trimester.start_date);
        const endDate = new Date(trimester.end_date);

        console.log(`\nTrimestre ${trimester.trimester_number}:`);
        console.log(`  Début: ${trimester.start_date}`);
        console.log(`  Fin: ${trimester.end_date}`);

        if (today >= startDate && today <= endDate) {
          currentTrimester = `${trimester.trimester_number}er`;
          console.log(`  ✅ Nous sommes dans ce trimestre!`);
        } else {
          console.log(`  ❌ Nous ne sommes pas dans ce trimestre`);
        }
      }

      console.log(`\n📌 Trimestre en cours: ${currentTrimester}`);
    } else {
      console.log('⚠️  Aucun trimestre configuré');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testTrimesterCalculation();
