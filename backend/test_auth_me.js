const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testAuthMe() {
  console.log('=== TEST INFOS ENSEIGNANT ===\n');

  try {
    // Récupérer l'enseignant ALEX
    const { data: teacher } = await supabase
      .from('users')
      .select('id, username, first_name, last_name')
      .eq('username', 'ALEX')
      .maybeSingle();

    if (!teacher) {
      console.log('Enseignant ALEX non trouvé');
      return;
    }

    console.log('Enseignant:', teacher.username);
    console.log('ID:', teacher.id);

    // Récupérer les assignations de classes
    const { data: assignments } = await supabase
      .from('teacher_class_assignments')
      .select('class_id, classes(name)')
      .eq('teacher_id', teacher.id);

    console.log('\nAssignations de classes:', assignments?.length || 0);
    assignments?.forEach((a) => {
      console.log(`  - ${a.classes?.name} (ID: ${a.class_id})`);
    });

    // Simuler ce que devrait retourner /auth/me
    const assignedClasses = assignments?.map(a => a.classes?.name).filter(Boolean) || [];
    console.log('\nassigned_classes (pour /auth/me):', assignedClasses);

  } catch (error) {
    console.error('Erreur:', error);
  }
}

testAuthMe();
