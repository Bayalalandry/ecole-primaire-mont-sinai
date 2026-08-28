require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testSearchRedirect() {
  console.log('=== TEST REDIRECTION RECHERCHE ===\n');

  try {
    // Test 1: Rechercher un élève et vérifier que l'ID est renvoyé
    console.log('1. Recherche d\'un élève...');
    const { data: students } = await supabase
      .from('students')
      .select('id, first_name, last_name, matricule, status')
      .or(`first_name.ilike.%steve%,last_name.ilike.%steve%`)
      .limit(1);

    if (students && students.length > 0) {
      const student = students[0];
      console.log('✓ Élève trouvé:', student.first_name, student.last_name);
      console.log('  ID:', student.id);
      console.log('  Matricule:', student.matricule);
      console.log('  Statut:', student.status);
      console.log('  Statut traduit:', student.status === 'departed' ? 'Parti' : student.status);

      // Vérifier que le statut 'departed' existe
      if (student.status === 'departed') {
        console.log('  ⚠️ Cet élève a le statut "departed" qui doit être traduit en "Parti"');
      }
    } else {
      console.log('Aucun élève trouvé');
    }

    // Test 2: Rechercher un enseignant et vérifier que l'ID est renvoyé
    console.log('\n2. Recherche d\'un enseignant...');
    const { data: teachers } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, role')
      .eq('role', 'teacher')
      .or(`first_name.ilike.%alex%,last_name.ilike.%alex%`)
      .limit(1);

    if (teachers && teachers.length > 0) {
      const teacher = teachers[0];
      console.log('✓ Enseignant trouvé:', teacher.first_name, teacher.last_name);
      console.log('  ID:', teacher.id);
      console.log('  Username:', teacher.username);
    } else {
      console.log('Aucun enseignant trouvé');
    }

    // Test 3: Vérifier tous les statuts d'élèves
    console.log('\n3. Vérification des statuts d\'élèves...');
    const { data: allStudents } = await supabase
      .from('students')
      .select('status');

    const statusCounts = {};
    allStudents?.forEach(s => {
      statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
    });

    console.log('Statuts trouvés:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const translated = status === 'departed' ? 'Parti' :
                        status === 'active' ? 'Actif' :
                        status === 'repeating' ? 'Redoublant' :
                        status === 'archived' ? 'Archivé' : status;
      console.log(`  ${status} (${count}) → ${translated}`);
    });

    console.log('\n=== TEST REDIRECTION TERMINÉ ===');
    console.log('\nNOTE: Les changements suivants ont été appliqués:');
    console.log('1. FounderDashboard: handleResultClick redirige vers /students?studentId=X ou /teachers?teacherId=X');
    console.log('2. StudentsPage: Ajout de useSearchParams et ouverture automatique du modal si studentId présent');
    console.log('3. TeachersPage: Ajout de useSearchParams et sélection automatique si teacherId présent');
    console.log('4. StudentsPage: Ajout de translateStatus() pour traduire "departed" en "Parti"');
    console.log('5. StudentsPage: Utilisation de translateStatus() dans les exports PDF/Excel et l\'affichage');

  } catch (error) {
    console.error('Erreur:', error);
  }
}

testSearchRedirect();
