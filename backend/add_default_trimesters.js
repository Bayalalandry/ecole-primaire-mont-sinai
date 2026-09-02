/**
 * Script pour ajouter des trimestres par défaut pour l'année scolaire actuelle
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

async function addDefaultTrimesters() {
  console.log('🧪 Ajout des trimestres par défaut...\n');

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

    // Vérifier si des trimestres existent déjà
    const { data: existingTrimesters } = await supabase
      .from('trimesters')
      .select('*')
      .eq('school_year_id', currentYear.id);

    if (existingTrimesters && existingTrimesters.length > 0) {
      console.log(`ℹ️  ${existingTrimesters.length} trimestre(s) déjà configuré(s) pour cette année`);
      console.log('   Aucun ajout nécessaire');
      return;
    }

    // Supprimer l'ancien trimestre avec school_year_id null
    const { data: oldTrimesters } = await supabase
      .from('trimesters')
      .select('*')
      .is('school_year_id', null);

    if (oldTrimesters && oldTrimesters.length > 0) {
      console.log(`🗑️  Suppression de ${oldTrimesters.length} ancien(s) trimestre(s) sans school_year_id`);
      await supabase
        .from('trimesters')
        .delete()
        .is('school_year_id', null);
    }

    // Créer les trimestres par défaut
    const defaultTrimesters = [
      {
        school_year_id: currentYear.id,
        trimester_number: 1,
        start_date: `${currentYear.year_label.split('-')[0]}-09-01`,
        end_date: `${currentYear.year_label.split('-')[0]}-11-30`,
      },
      {
        school_year_id: currentYear.id,
        trimester_number: 2,
        start_date: `${currentYear.year_label.split('-')[0]}-12-01`,
        end_date: `${parseInt(currentYear.year_label.split('-')[0]) + 1}-02-28`,
      },
      {
        school_year_id: currentYear.id,
        trimester_number: 3,
        start_date: `${parseInt(currentYear.year_label.split('-')[0]) + 1}-03-01`,
        end_date: `${parseInt(currentYear.year_label.split('-')[0]) + 1}-06-30`,
      },
    ];

    console.log(`\n📋 Création des trimestres par défaut:`);
    for (const trimester of defaultTrimesters) {
      const { data, error } = await supabase
        .from('trimesters')
        .insert(trimester)
        .select()
        .single();

      if (error) {
        console.error(`❌ Erreur création trimestre ${trimester.trimester_number}:`, error);
      } else {
        console.log(`✅ Trimestre ${trimester.trimester_number}: ${trimester.start_date} → ${trimester.end_date}`);
      }
    }

    console.log('\n✅ Terminé !');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

addDefaultTrimesters();
