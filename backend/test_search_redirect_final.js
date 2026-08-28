require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testSearchRedirectFinal() {
  console.log('=== TEST FINAL REDIRECTION RECHERCHE ===\n');

  try {
    // Test 1: Vérifier qu'un élève avec statut 'departed' existe
    console.log('1. Vérification des élèves avec statut "departed"...');
    const { data: departedStudents } = await supabase
      .from('students')
      .select('id, first_name, last_name, matricule, status')
      .eq('status', 'departed');

    if (departedStudents && departedStudents.length > 0) {
      console.log(`✓ ${departedStudents.length} élève(s) avec statut "departed" trouvé(s)`);
      departedStudents.forEach(s => {
        console.log(`  - ${s.first_name} ${s.last_name} (${s.matricule})`);
        console.log(`    Statut actuel: "${s.status}" → doit afficher "Parti"`);
      });
    } else {
      console.log('Aucun élève avec statut "departed" trouvé');
    }

    // Test 2: Vérifier un élève actif pour la recherche
    console.log('\n2. Recherche d\'un élève actif...');
    const { data: activeStudent } = await supabase
      .from('students')
      .select('id, first_name, last_name, matricule, status')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (activeStudent) {
      console.log('✓ Élève actif trouvé:', activeStudent.first_name, activeStudent.last_name);
      console.log('  ID:', activeStudent.id);
      console.log('  URL de redirection attendue: /students?studentId=' + activeStudent.id);
      console.log('  Comportement attendu: Ouverture du modal de modification avec les données pré-remplies');
    }

    // Test 3: Vérifier un enseignant
    console.log('\n3. Recherche d\'un enseignant...');
    const { data: teacher } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, role')
      .eq('role', 'teacher')
      .limit(1)
      .single();

    if (teacher) {
      console.log('✓ Enseignant trouvé:', teacher.first_name, teacher.last_name);
      console.log('  ID:', teacher.id);
      console.log('  URL de redirection attendue: /teachers?teacherId=' + teacher.id);
      console.log('  Comportement attendu: Mise en surbrillance de la ligne avec scroll automatique');
    }

    console.log('\n=== RÉSUMÉ DES CORRECTIONS ===');
    console.log('\n1. CORRECTION ÉLÈVE:');
    console.log('   - FounderDashboard: Redirection vers /students?studentId=X');
    console.log('   - StudentsPage: Ouverture automatique du modal avec handleEdit(student)');
    console.log('   - Le formulaire est pré-rempli avec les données de l\'élève (pas vide)');
    console.log('   - Timeout augmenté à 500ms pour laisser le temps au chargement');
    console.log('   - Console.log ajouté pour debug');

    console.log('\n2. CORRECTION ENSEIGNANT:');
    console.log('   - FounderDashboard: Redirection vers /teachers?teacherId=X');
    console.log('   - TeachersPage: setSelectedTeacher(teacher) sans timeout');
    console.log('   - Ajout de useRef pour les références des lignes');
    console.log('   - Scroll automatique vers la ligne sélectionnée');
    console.log('   - Mise en surbrillance (bg-indigo-50 + ring-2)');
    console.log('   - Console.log ajouté pour debug');

    console.log('\n3. CORRECTION STATUT "departed":');
    console.log('   - Fonction translateStatus() ajoutée dans StudentsPage');
    console.log('   - Traduction: "departed" → "Parti"');
    console.log('   - Appliquée dans:');
    console.log('     * Affichage tableau (2 emplacements)');
    console.log('     * Export PDF');
    console.log('     * Export Excel');
    console.log('   - Tous les statuts sont traduits (active, repeating, archived, departed)');

    console.log('\n=== TEST TERMINÉ ===');
    console.log('\nProcédure de test manuel:');
    console.log('1. Ouvrir http://localhost:5174');
    console.log('2. Se connecter en tant que fondateur');
    console.log('3. Taper "steve" dans la barre de recherche');
    console.log('4. Cliquer sur un résultat élève');
    console.log('5. Vérifier: Modal ouvert avec données pré-remplies (pas vide)');
    console.log('6. Fermer le modal, taper "alex" dans la recherche');
    console.log('7. Cliquer sur le résultat enseignant');
    console.log('8. Vérifier: Ligne mise en surbrillance et scroll automatique');
    console.log('9. Aller dans la liste des élèves (classe CM2)');
    console.log('10. Vérifier: Statut "departed" affiché comme "Parti"');

  } catch (error) {
    console.error('Erreur:', error);
  }
}

testSearchRedirectFinal();
