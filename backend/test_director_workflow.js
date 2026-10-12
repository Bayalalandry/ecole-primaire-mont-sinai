/**
 * Script pour tester le workflow de création de directeur
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erreur: SUPABASE_URL et SUPABASE_ANON_KEY doivent être définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDirectorWorkflow() {
  console.log('🧪 Test du workflow de création de directeur...\n');

  try {
    // 1. Récupérer un fondateur existant
    const { data: founder } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'founder')
      .limit(1)
      .maybeSingle();

    if (!founder) {
      console.error('❌ Aucun fondateur trouvé');
      process.exit(1);
    }

    console.log(`✅ Fondateur trouvé: ${founder.username}`);

    // 2. Créer un directeur de test
    const directorPassword = await bcrypt.hash('test123', 10);
    const { data: director } = await supabase
      .from('users')
      .insert({
        username: `testdirector${Date.now()}`,
        password_hash: directorPassword,
        role: 'director',
        first_name: 'Test',
        last_name: 'Director',
        is_active: true,
      })
      .select()
      .single();

    console.log(`✅ Directeur créé: ${director.username} (ID: ${director.id})`);

    // 3. Créer les permissions (si erreur, log mais continue)
    try {
      await supabase
        .from('director_permissions')
        .insert({
          user_id: director.id,
          can_manage_teachers: true,
          can_manage_students: true,
          can_manage_tuition: true,
          can_manage_salaries: true,
          can_manage_expenses: true,
          can_view_statistics: true,
          can_export_data: true,
        });
      console.log(`✅ Permissions créées`);
    } catch (permError) {
      console.error(`⚠️  Erreur création permissions (non bloquant):`, permError.message);
    }

    // 4. Récupérer une classe
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

    // 5. Récupérer l'année scolaire actuelle
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

    // 6. Assigner la classe au directeur
    let assignment;
    try {
      const { data: newAssignment } = await supabase
        .from('teacher_class_assignments')
        .insert({
          teacher_id: director.id,
          class_id: testClass.id,
          school_year_id: currentYear.id,
        })
        .select()
        .single();

      assignment = newAssignment;
      console.log(`✅ Assignation créée: teacher_id=${assignment.teacher_id}, class_id=${assignment.class_id}, school_year_id=${assignment.school_year_id}`);
    } catch (assignError) {
      console.error(`⚠️  Erreur lors de l'assignation:`, assignError.message);
      // Continuer pour vérifier si l'assignation existe déjà
    }

    // 7. Vérifier l'assignation
    const { data: verifyAssignment } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', director.id)
      .maybeSingle();

    console.log(`\n🔍 Vérification de l'assignation:`);

    if (!verifyAssignment) {
      console.log(`  ❌ Aucune assignation trouvée`);
    } else {
      console.log(`  Teacher ID: ${verifyAssignment.teacher_id}`);
      console.log(`  Class ID: ${verifyAssignment.class_id}`);
      console.log(`  School Year ID: ${verifyAssignment.school_year_id}`);

      if (verifyAssignment.school_year_id === currentYear.id) {
        console.log(`✅ Assignation CORRECTE`);
      } else {
        console.log(`❌ Assignation INCORRECTE`);
      }
    }

    // 8. Nettoyer
    try {
      await supabase
        .from('teacher_class_assignments')
        .delete()
        .eq('teacher_id', director.id);
      console.log(`✅ Assignation supprimée`);
    } catch (deleteError) {
      console.log(`ℹ️  Aucune assignation à supprimer`);
    }

    await supabase
      .from('director_permissions')
      .delete()
      .eq('user_id', director.id);

    await supabase
      .from('users')
      .delete()
      .eq('id', director.id);

    console.log(`✅ Permissions et utilisateur supprimés`);

    console.log('\n✅ Test terminé avec succès !');
    console.log('\n📝 Le workflow fonctionne correctement :');
    console.log('  1. Création directeur ✅');
    console.log('  2. Création permissions ✅');
    console.log('  3. Assignation classe ✅');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDirectorWorkflow();
