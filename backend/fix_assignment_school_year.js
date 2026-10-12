/**
 * Script pour corriger l'assignation existante avec school_year_id
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

async function fixAssignment() {
  console.log('🔧 Correction de l\'assignation avec school_year_id...\n');

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

    // Récupérer toutes les assignations sans school_year_id
    const { data: assignments } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .is('school_year_id', null);

    console.log(`📋 Assignations sans school_year_id: ${assignments?.length || 0}`);

    if (assignments && assignments.length > 0) {
      for (const assignment of assignments) {
        console.log(`\nCorrection de l'assignation ${assignment.id}:`);
        console.log(`  Teacher: ${assignment.teacher_id}`);
        console.log(`  Class: ${assignment.class_id}`);

        const { error } = await supabase
          .from('teacher_class_assignments')
          .update({ school_year_id: currentYear.id })
          .eq('id', assignment.id);

        if (error) {
          console.error(`  ❌ Erreur: ${error.message}`);
        } else {
          console.log(`  ✅ Mis à jour avec school_year_id: ${currentYear.id}`);
        }
      }
    } else {
      console.log('✅ Aucune assignation à corriger');
    }

    console.log('\n✅ Correction terminée !');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixAssignment();
