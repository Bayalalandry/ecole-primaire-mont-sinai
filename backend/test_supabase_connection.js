const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testSupabaseConnection() {
  console.log('=== Test de connexion Supabase ===\n');
  
  try {
    console.log('1. Test de connexion simple...');
    const { data, error } = await supabase
      .from('users')
      .select('id, username, first_name, last_name, role')
      .limit(5);
    
    if (error) {
      console.log('❌ Erreur de connexion:', error.message);
      console.log('Détails:', error);
      return;
    }
    
    console.log('✅ Connexion réussie');
    console.log(`\nUtilisateurs trouvés: ${data.length}`);
    data.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.username} (${u.role}) - ${u.first_name} ${u.last_name}`);
    });
    
    // Test des enseignants
    console.log('\n2. Test spécifique - Enseignants...');
    const { data: teachers, error: teachersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'teacher');
    
    if (teachersError) {
      console.log('❌ Erreur enseignants:', teachersError.message);
    } else {
      console.log(`✅ ${teachers.length} enseignant(s) trouvé(s)`);
      teachers.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.first_name} ${t.last_name} (@${t.username})`);
      });
    }
    
    // Test des classes
    console.log('\n3. Test des classes...');
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*');
    
    if (classesError) {
      console.log('❌ Erreur classes:', classesError.message);
    } else {
      console.log(`✅ ${classes.length} classe(s) trouvée(s)`);
      classes.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.name}`);
      });
    }
    
    // Test des affectations
    console.log('\n4. Test des affectations enseignant-classe...');
    const { data: assignments, error: assignError } = await supabase
      .from('teacher_class_assignments')
      .select('*');
    
    if (assignError) {
      console.log('❌ Erreur affectations:', assignError.message);
    } else {
      console.log(`✅ ${assignments.length} affectation(s) trouvée(s)`);
      assignments.forEach((a, i) => {
        console.log(`  ${i + 1}. Teacher: ${a.teacher_id} -> Class: ${a.class_id}`);
      });
    }
    
    console.log('\n✅ Tous les tests réussis - Base de données accessible');
    
  } catch (error) {
    console.log('❌ ERREUR:', error.message);
  }
}

testSupabaseConnection().then(() => process.exit(0));