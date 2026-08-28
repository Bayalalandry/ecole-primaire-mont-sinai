const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testTrimestersFix() {
  try {
    console.log('=== TEST DE CORRECTION DES TRIMESTRES ===\n');

    // 1. Récupérer tous les trimestres
    console.log('1. Récupération de tous les trimestres...');
    const { data: trimesters, error } = await supabase
      .from('trimesters')
      .select('*')
      .order('trimester_number', { ascending: true });

    if (error) {
      console.error('Erreur:', error);
      return;
    }

    console.log(`Nombre total de trimestres: ${trimesters.length}`);
    console.log('\nTrimestres trouvés:');
    trimesters.forEach(t => {
      console.log(`  Trimestre ${t.trimester_number}: ${t.start_date} - ${t.end_date} (ID: ${t.id})`);
    });

    // 2. Vérifier les doublons
    console.log('\n2. Vérification des doublons...');
    const grouped = {};
    trimesters.forEach(t => {
      const key = t.trimester_number;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(t);
    });

    let hasDuplicates = false;
    for (const [trimesterNum, items] of Object.entries(grouped)) {
      if (items.length > 1) {
        console.log(`✗ Trimestre ${trimesterNum}: ${items.length} entrées (DOUBLON!)`);
        hasDuplicates = true;
      } else {
        console.log(`✓ Trimestre ${trimesterNum}: 1 entrée (correct)`);
      }
    }

    // 3. Conclusion
    console.log('\n=== RÉSUMÉ ===');
    if (!hasDuplicates) {
      console.log('✓ Tous les trimestres sont uniques (pas de doublons)');
      console.log('✓ Correction des trimestres: VALIDÉE');
    } else {
      console.log('✗ Il y a encore des doublons de trimestres');
      console.log('✗ Correction des trimestres: NON VALIDÉE');
    }

    console.log('\n=== TEST TERMINÉ ===');

  } catch (error) {
    console.error('Erreur:', error);
  }
}

testTrimestersFix();
