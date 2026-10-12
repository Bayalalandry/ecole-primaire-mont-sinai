/**
 * Script pour ajouter l'entrée teachers aux directeurs existants
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

async function fixDirectorTeacherEntries() {
  console.log('🔧 Ajout des entrées teachers aux directeurs existants...\n');

  try {
    // Récupérer tous les directeurs
    const { data: directors } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'director');

    console.log(`📋 Directeurs trouvés: ${directors?.length || 0}`);

    if (directors && directors.length > 0) {
      for (const director of directors) {
        // Vérifier si l'entrée teachers existe déjà
        const { data: existingTeacher } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', director.id)
          .maybeSingle();

        if (existingTeacher) {
          console.log(`ℹ️  ${director.username} a déjà une entrée teachers`);
        } else {
          // Créer l'entrée teachers
          await supabase
            .from('teachers')
            .insert({
              user_id: director.id,
              status: 'active',
            });
          console.log(`✅ Entrée teachers créée pour ${director.username}`);
        }
      }
    }

    console.log('\n✅ Correction terminée !');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixDirectorTeacherEntries();
