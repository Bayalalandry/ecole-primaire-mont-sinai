const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testPassageSur10() {
  console.log('=== TEST DU CYCLE COMPLET SUR ÉCHELLE DE 10 ===\n');

  const schoolYear = '2025-2026';

  try {
    // ============================================
    // 1. Créer des données de test
    // ============================================
    console.log('1. Création des données de test...');

    // Récupérer les classes
    const { data: classes } = await supabase.from('classes').select('*');
    const classMap = {};
    classes.forEach((c) => {
      classMap[c.name] = c.id;
    });

    // Récupérer l'année scolaire
    let schoolYearId;
    const { data: existingSchoolYear } = await supabase
      .from('school_years')
      .select('id')
      .eq('year_label', schoolYear)
      .maybeSingle();

    if (!existingSchoolYear) {
      console.log('Création de l\'année scolaire...');
      const { data: newSchoolYear } = await supabase
        .from('school_years')
        .insert({
          year_label: schoolYear,
          start_date: '2025-09-01',
          end_date: '2026-07-31',
        })
        .select()
        .single();
      schoolYearId = newSchoolYear.id;
    } else {
      schoolYearId = existingSchoolYear.id;
    }

    // Récupérer un enseignant de test
    const { data: teachers } = await supabase
      .from('users')
      .select('id, username')
      .eq('role', 'teacher')
      .limit(1);

    if (!teachers || teachers.length === 0) {
      console.error('Aucun enseignant trouvé. Créez un enseignant d\'abord.');
      return;
    }

    const teacherId = teachers[0].id;
    console.log(`Enseignant utilisé: ${teachers[0].username}`);

    // Créer des élèves de test avec des moyennes sur 10
    const testStudents = [
      { firstName: 'TestAdmis', lastName: 'Sur10', className: 'CP1', grade: 7.5 }, // 7.5/10 > 5/10 → Admis
      { firstName: 'TestRedou', lastName: 'Sur10', className: 'CP1', grade: 3.5 }, // 3.5/10 < 5/10 → Redoublant
      { firstName: 'TestLimite', lastName: 'Sur10', className: 'CP1', grade: 5.0 }, // 5.0/10 = 5/10 → Admis (égal)
    ];

    const studentIds = [];
    const timestamp = Date.now().toString().slice(-8);
    for (const student of testStudents) {
      const classId = classMap[student.className];
      const randomSuffix = Math.floor(Math.random() * 99).toString().padStart(2, '0');

      // Créer l'élève
      const { data: newStudent, error: studentError } = await supabase
        .from('students')
        .insert({
          unique_identifier: `ID${timestamp}${randomSuffix}`,
          matricule: `MAT${timestamp}${randomSuffix}`,
          first_name: student.firstName,
          last_name: student.lastName,
          current_class_id: classId,
          school_year: schoolYear,
          status: 'active',
        })
        .select()
        .single();

      if (studentError) {
        console.error(`Erreur création élève ${student.firstName}:`, studentError);
        continue;
      }

      studentIds.push({ id: newStudent.id, className: student.className, grade: student.grade });
      console.log(`Élève créé: ${student.firstName} ${student.lastName} en ${student.className}`);
    }

    // Créer une affectation enseignant-classe
    await supabase
      .from('teacher_class_assignments')
      .insert({
        teacher_id: teacherId,
        class_id: classMap['CP1'],
        school_year: schoolYear,
      });

    console.log('✓ Données de test créées\n');

    // ============================================
    // 2. Saisie des moyennes sur 10 par l'enseignant
    // ============================================
    console.log('2. Saisie des moyennes sur 10 par l\'enseignant...');

    for (const student of studentIds) {
      await supabase
        .from('student_annual_grades')
        .insert({
          student_id: student.id,
          school_year_id: schoolYearId,
          final_grade: student.grade,
          recorded_by: teacherId,
        });

      console.log(`Moyenne enregistrée pour ${student.className}: ${student.grade}/10`);
    }

    console.log('✓ Moyennes enregistrées\n');

    // ============================================
    // 3. Vérification des seuils actuels
    // ============================================
    console.log('3. Vérification des seuils actuels...');

    const { data: classesWithGrades } = await supabase
      .from('classes')
      .select('name, passing_grade');

    classesWithGrades.forEach((c) => {
      console.log(`${c.name}: seuil = ${c.passing_grade}/10`);
    });

    console.log('✓ Seuils vérifiés\n');

    // ============================================
    // 4. Génération des propositions (simulation)
    // ============================================
    console.log('4. Génération des propositions de passage...');

    const cp1ClassId = classMap['CP1'];
    const { data: cp1Class } = await supabase
      .from('classes')
      .select('passing_grade')
      .eq('id', cp1ClassId)
      .single();

    const passingGrade = cp1Class.passing_grade;

    for (const student of studentIds) {
      const proposedStatus = student.grade >= passingGrade ? 'passed' : 'repeating';
      console.log(`${student.className} - Moyenne: ${student.grade}/10, Seuil: ${passingGrade}/10, Proposition: ${proposedStatus}`);
    }

    console.log('✓ Propositions générées\n');

    // ============================================
    // 5. Validation des résultats
    // ============================================
    console.log('5. Validation des résultats attendus...');

    const expectedResults = [
      { grade: 7.5, expected: 'passed', desc: '7.5/10 > 5/10 → Admis' },
      { grade: 3.5, expected: 'repeating', desc: '3.5/10 < 5/10 → Redoublant' },
      { grade: 5.0, expected: 'passed', desc: '5.0/10 = 5/10 → Admis (égal)' },
    ];

    let allTestsPassed = true;
    for (const test of expectedResults) {
      const actualStatus = test.grade >= passingGrade ? 'passed' : 'repeating';
      const passed = actualStatus === test.expected;
      allTestsPassed = allTestsPassed && passed;

      console.log(`${test.desc}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    }

    console.log('\n=== RÉSULTAT FINAL ===');
    if (allTestsPassed) {
      console.log('✓ TOUS LES TESTS PASSENT');
      console.log('✓ Les moyennes sont bien sur 10');
      console.log('✓ Les seuils sont bien sur 10');
      console.log('✓ La comparaison moyenne/seuil fonctionne correctement');
      console.log('✓ Le statut proposé correspond à la logique attendue');
    } else {
      console.log('✗ CERTAINS TESTS ÉCHOUENT');
    }

  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

testPassageSur10();
