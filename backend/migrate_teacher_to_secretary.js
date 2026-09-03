/**
 * Script de migration : teacher → secretary
 * Convertit tous les comptes teacher en secretary
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

async function migrateTeacherToSecretary() {
  console.log('🔄 Migration teacher → secretary...\n');

  try {
    // 1. Récupérer tous les teachers
    const { data: teachers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'teacher');

    if (fetchError) {
      console.error('❌ Erreur récupération teachers:', fetchError);
      process.exit(1);
    }

    console.log(`📋 Teachers trouvés: ${teachers?.length || 0}`);

    if (!teachers || teachers.length === 0) {
      console.log('ℹ️  Aucun teacher à migrer');
      return;
    }

    // 2. Afficher les teachers trouvés
    console.log('\nTeachers à migrer:');
    teachers.forEach(t => {
      console.log(`  - ${t.username} (${t.first_name} ${t.last_name})`);
    });

    // 3. Migrer chaque teacher en secretary
    for (const teacher of teachers) {
      console.log(`\n🔄 Migration de ${teacher.username}...`);

      // Mettre à jour le rôle
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'secretary' })
        .eq('id', teacher.id);

      if (updateError) {
        console.error(`❌ Erreur migration ${teacher.username}:`, updateError);
      } else {
        console.log(`✅ ${teacher.username} migré en secretary`);
      }
    }

    // 4. Vérifier la migration
    const { data: secretaries } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'secretary');

    console.log(`\n✅ Migration terminée !`);
    console.log(`📊 Secretaries créés: ${secretaries?.length || 0}`);

    if (secretaries && secretaries.length > 0) {
      console.log('\nListe des secretaries:');
      secretaries.forEach(s => {
        console.log(`  - ${s.username} (${s.first_name} ${s.last_name})`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

migrateTeacherToSecretary();
