/**
 * Script pour vérifier les contraintes de la table teacher_class_assignments
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

async function checkConstraints() {
  console.log('🔍 Vérification des contraintes de teacher_class_assignments...\n');

  try {
    // Récupérer un enseignant existant
    const { data: teacher } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'teacher')
      .limit(1)
      .maybeSingle();

    if (!teacher) {
      console.error('❌ Aucun enseignant trouvé');
      process.exit(1);
    }

    console.log(`✅ Enseignant trouvé: ${teacher.username} (ID: ${teacher.id})`);

    // Récupérer un directeur existant
    const { data: director } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'director')
      .limit(1)
      .maybeSingle();

    if (!director) {
      console.error('❌ Aucun directeur trouvé');
      process.exit(1);
    }

    console.log(`✅ Directeur trouvé: ${director.username} (ID: ${director.id})`);

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

    console.log(`✅ Année scolaire actuelle: ${currentYear.year_label}`);

    // Récupérer une classe
    const { data: classes } = await supabase
      .from('classes')
      .select('*')
      .limit(1);

    if (!classes || classes.length === 0) {
      console.error('❌ Aucune classe trouvée');
      process.exit(1);
    }

    const testClass = classes[0];
    console.log(`✅ Classe trouvée: ${testClass.name} (ID: ${testClass.id})`);

    // Essayer d'assigner l'enseignant
    console.log(`\n🧪 Test assignation enseignant...`);
    try {
      const { data: teacherAssignment } = await supabase
        .from('teacher_class_assignments')
        .insert({
          teacher_id: teacher.id,
          class_id: testClass.id,
          school_year_id: currentYear.id,
        })
        .select()
        .single();

      console.log(`✅ Assignation enseignant réussie: ${teacherAssignment.id}`);
      await supabase.from('teacher_class_assignments').delete().eq('id', teacherAssignment.id);
    } catch (error) {
      console.error(`❌ Erreur assignation enseignant:`, error.message);
    }

    // Essayer d'assigner le directeur
    console.log(`\n🧪 Test assignation directeur...`);
    try {
      const { data: directorAssignment, error: directorError } = await supabase
        .from('teacher_class_assignments')
        .insert({
          teacher_id: director.id,
          class_id: testClass.id,
          school_year_id: currentYear.id,
        })
        .select()
        .single();

      if (directorError) {
        console.error(`❌ Erreur assignation directeur (Supabase):`, directorError);
        console.error(`   Code:`, directorError.code);
        console.error(`   Message:`, directorError.message);
        console.error(`   Details:`, directorError.details);
        console.error(`   Hint:`, directorError.hint);
      } else {
        console.log(`✅ Assignation directeur réussie: ${directorAssignment.id}`);
        await supabase.from('teacher_class_assignments').delete().eq('id', directorAssignment.id);
      }
    } catch (error) {
      console.error(`❌ Erreur assignation directeur (JavaScript):`, error.message);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkConstraints();
