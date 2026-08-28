const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testPendingTeacher() {
  console.log('=== Test Validation/Refus Compte En Attente ===\n');
  
  try {
    // Créer un enseignant en attente
    const password = 'test123';
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        username: 'NEWTEACHER',
        password_hash: passwordHash,
        first_name: 'Nouveau',
        last_name: 'Enseignant',
        role: 'teacher',
        is_active: true
      })
      .select()
      .single();
    
    if (createError) {
      console.log('Erreur création enseignant:', createError.message);
      return;
    }
    
    console.log('✅ Enseignant créé:', newUser.username);
    
    // Créer l'entrée teachers avec status pending
    const { error: teacherError } = await supabase
      .from('teachers')
      .insert({
        user_id: newUser.id,
        status: 'pending'
      });
    
    if (teacherError) {
      console.log('Erreur création teacher:', teacherError.message);
      return;
    }
    
    console.log('✅ Teacher entry created with status: pending');
    
    // Vérifier que l'enseignant apparaît dans la liste des pending
    const { data: pendingTeachers } = await supabase
      .from('users')
      .select(`
        id,
        username,
        first_name,
        last_name,
        teachers (
          status
        )
      `)
      .eq('role', 'teacher');
    
    const pending = pendingTeachers.filter((u) => u.teachers?.status === 'pending');
    console.log(`Enseignants en attente: ${pending.length}`);
    const found = pending.find((u) => u.username === 'NEWTEACHER');
    
    if (found) {
      console.log('✅ Enseignant trouvé dans la liste des pending');
    } else {
      console.log('❌ Enseignant PAS trouvé dans la liste des pending');
    }
    
    // Nettoyage
    await supabase.from('teachers').delete().eq('user_id', newUser.id);
    await supabase.from('users').delete().eq('id', newUser.id);
    console.log('✅ Nettoyage effectué');
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

testPendingTeacher().then(() => process.exit(0));