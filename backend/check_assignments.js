/**
 * Script pour vérifier les assignations enseignant-classe
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

async function checkAssignments() {
  console.log('🔍 Vérification des assignations enseignant-classe...\n');

  try {
    // Récupérer toutes les assignations
    const { data: assignments, error: assignError } = await supabase
      .from('teacher_class_assignments')
      .select('*');

    if (assignError) {
      console.error('❌ Erreur lors de la récupération des assignations:', assignError);
      throw assignError;
    }

    console.log(`📋 Assignations trouvées: ${assignments?.length || 0}\n`);

    if (assignments && assignments.length > 0) {
      assignments.forEach((assignment, index) => {
        console.log(`Assignation ${index + 1}:`);
        console.log(`  Teacher ID: ${assignment.teacher_id}`);
        console.log(`  Class ID: ${assignment.class_id}`);
        console.log(`  School Year ID: ${assignment.school_year_id || 'NULL'}`);
        console.log(`  Created At: ${assignment.created_at}`);
        console.log('');
      });
    }

    // Récupérer l'année scolaire actuelle
    const { data: currentYear } = await supabase
      .from('school_years')
      .select('*')
      .eq('is_current', true)
      .maybeSingle();

    console.log('📅 Année scolaire actuelle:');
    if (currentYear) {
      console.log(`  ID: ${currentYear.id}`);
      console.log(`  Label: ${currentYear.year_label}`);
      console.log(`  Is Current: ${currentYear.is_current}`);
    } else {
      console.log('  ⚠️  Aucune année scolaire marquée comme actuelle');
    }

    // Vérifier les étudiants
    const { data: students } = await supabase
      .from('students')
      .select('id, first_name, last_name, current_class_id, school_year, status');

    console.log(`\n👥 Étudiants: ${students?.length || 0}`);
    if (students && students.length > 0) {
      students.forEach((student, index) => {
        console.log(`Étudiant ${index + 1}:`);
        console.log(`  Nom: ${student.first_name} ${student.last_name}`);
        console.log(`  Class ID: ${student.current_class_id}`);
        console.log(`  School Year: ${student.school_year}`);
        console.log(`  Status: ${student.status}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkAssignments();
