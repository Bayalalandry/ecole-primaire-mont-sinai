const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testTeachersEndpoint() {
  console.log('=== Test Endpoint /auth/teachers ===\n');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        teachers (
          status
        )
      `)
      .in('role', ['teacher', 'director'])
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Erreur:', error.message);
      return;
    }

    console.log(`Résultat: ${data.length} utilisateurs`);
    console.log('\nDétails:');
    data.forEach((u, i) => {
      console.log(`\n${i + 1}. ${u.first_name} ${u.last_name} (@${u.username})`);
      console.log(`   ID: ${u.id}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Teachers: ${JSON.stringify(u.teachers)}`);
    });
    
    const teacherIds = data.map(u => u.id);
    const { data: assignments } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .in('teacher_id', teacherIds);
    
    console.log('\n=== Affectations de classe ===');
    console.log(`Assignments: ${assignments?.length || 0}`);
    assignments?.forEach((a, i) => {
      console.log(`  ${i + 1}. Teacher: ${a.teacher_id} -> Class: ${a.class_id}`);
    });
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

testTeachersEndpoint().then(() => process.exit(0));