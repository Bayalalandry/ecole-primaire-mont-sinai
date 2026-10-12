/**
 * Script de test avec données fraîches
 * Crée un fondateur, un enseignant, assigne une classe, et crée un élève
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

async function testFreshData() {
  console.log('🧪 Test avec données fraîches...\n');

  try {
    // 1. Récupérer l'année scolaire actuelle
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

    // 2. Récupérer une classe
    const { data: classes } = await supabase
      .from('classes')
      .select('*')
      .limit(1);

    if (!classes || classes.length === 0) {
      console.error('❌ Aucune classe trouvée');
      process.exit(1);
    }

    const testClass = classes[0];
    console.log(`🏫 Classe de test: ${testClass.name} (ID: ${testClass.id})`);

    // 3. Vérifier si le fondateur existe déjà
    let founder;
    const { data: existingFounder } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'testfounder')
      .maybeSingle();

    if (existingFounder) {
      founder = existingFounder;
      console.log(`ℹ️  Fondateur existe déjà: ${founder.username} (ID: ${founder.id})`);
    } else {
      // Créer un fondateur
      const founderPassword = await bcrypt.hash('test123', 10);
      const { data: newFounder } = await supabase
        .from('users')
        .insert({
          username: 'testfounder',
          password_hash: founderPassword,
          role: 'founder',
          first_name: 'Test',
          last_name: 'Founder',
          is_active: true,
        })
        .select()
        .single();

      founder = newFounder;
      console.log(`✅ Fondateur créé: ${founder.username} (ID: ${founder.id})`);
    }

    // 4. Vérifier si l'enseignant existe déjà
    let teacher;
    const { data: existingTeacher } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'testteacher')
      .maybeSingle();

    if (existingTeacher) {
      teacher = existingTeacher;
      console.log(`ℹ️  Enseignant existe déjà: ${teacher.username} (ID: ${teacher.id})`);
    } else {
      // Créer un enseignant
      const teacherPassword = await bcrypt.hash('test123', 10);
      const { data: newTeacher } = await supabase
        .from('users')
        .insert({
          username: 'testteacher',
          password_hash: teacherPassword,
          role: 'teacher',
          first_name: 'Test',
          last_name: 'Teacher',
          is_active: true,
        })
        .select()
        .single();

      teacher = newTeacher;
      console.log(`✅ Enseignant créé: ${teacher.username} (ID: ${teacher.id})`);

      // Créer l'entrée dans la table teachers
      await supabase
        .from('teachers')
        .insert({
          user_id: teacher.id,
          status: 'active',
        });

      console.log(`✅ Entrée teachers créée`);
    }

    // 5. Assigner la classe à l'enseignant (avec school_year_id)
    const { data: existingAssignment } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', teacher.id)
      .eq('class_id', testClass.id)
      .maybeSingle();

    let assignment;
    if (existingAssignment) {
      assignment = existingAssignment;
      console.log(`ℹ️  Assignation existe déjà (school_year_id: ${assignment.school_year_id || 'NULL'})`);
    } else {
      const { data: newAssignment } = await supabase
        .from('teacher_class_assignments')
        .insert({
          teacher_id: teacher.id,
          class_id: testClass.id,
          school_year_id: currentYear.id,
        })
        .select()
        .single();

      assignment = newAssignment;
      console.log(`✅ Assignation créée avec school_year_id: ${assignment.school_year_id}`);
    }

    // 6. Créer un élève
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        first_name: 'Test',
        last_name: 'Student',
        unique_identifier: `TEST${Date.now()}`,
        matricule: `MAT${Date.now()}`,
        current_class_id: testClass.id,
        school_year: currentYear.year_label,
        status: 'active',
      })
      .select()
      .single();

    if (studentError) {
      console.error('❌ Erreur lors de la création de l\'élève:', studentError);
      console.log('Continuant sans élève...');
    } else {
      console.log(`✅ Élève créé: ${student.first_name} ${student.last_name} (ID: ${student.id})`);
    }

    // 7. Vérifier l'assignation
    const { data: verifyAssignment } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', teacher.id)
      .single();

    console.log(`\n🔍 Vérification de l'assignation:`);
    console.log(`  Teacher ID: ${verifyAssignment.teacher_id}`);
    console.log(`  Class ID: ${verifyAssignment.class_id}`);
    console.log(`  School Year ID: ${verifyAssignment.school_year_id || 'NULL'}`);

    if (verifyAssignment.school_year_id === currentYear.id) {
      console.log(`✅ Assignation CORRECTE avec school_year_id`);
    } else {
      console.log(`❌ Assignation INCORRECTE - school_year_id manquant`);
    }

    // 8. Vérifier le comptage d'élèves
    if (!studentError) {
      const { data: classStudents } = await supabase
        .from('students')
        .select('id')
        .eq('current_class_id', testClass.id)
        .eq('status', 'active')
        .eq('school_year', currentYear.year_label);

      console.log(`\n🔍 Vérification du comptage d'élèves:`);
      console.log(`  Élèves dans la classe ${testClass.name}: ${classStudents?.length || 0}`);
    }

    console.log('\n✅ Test terminé avec succès !');
    console.log('\n📝 Comptes de test:');
    console.log(`  Fondateur: testfounder / test123`);
    console.log(`  Enseignant: testteacher / test123`);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testFreshData();
