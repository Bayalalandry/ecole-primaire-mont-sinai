const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function assignJeanToCP1() {
  console.log('=== Assignation de Jean Dupont à CP1 ===\n');

  const userId = 'cf88a62d-5d65-492d-ba83-661437504b83';

  // Récupérer l'année scolaire actuelle
  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id, year_label')
    .eq('is_current', true)
    .single();

  console.log(`✅ Année scolaire actuelle: ${currentYear?.year_label} (ID: ${currentYear?.id})`);

  // Récupérer la classe CP1
  const { data: cp1Class } = await supabase
    .from('classes')
    .select('id, name')
    .eq('name', 'CP1')
    .single();

  console.log(`✅ Classe CP1 trouvée (ID: ${cp1Class?.id})`);

  // Vérifier si l'assignation existe déjà
  const { data: existingAssignment } = await supabase
    .from('teacher_class_assignments')
    .select('*')
    .eq('teacher_id', userId)
    .eq('class_id', cp1Class.id)
    .eq('school_year_id', currentYear.id)
    .maybeSingle();

  if (existingAssignment) {
    console.log('⚠️  Jean Dupont est déjà assigné à CP1 pour cette année scolaire');
    return;
  }

  // Créer l'assignation
  const { error: assignmentError } = await supabase
    .from('teacher_class_assignments')
    .insert({
      teacher_id: userId,
      class_id: cp1Class.id,
      school_year_id: currentYear.id,
    });

  if (assignmentError) {
    console.error('❌ Erreur lors de l\'assignation:', assignmentError);
    return;
  }

  console.log('✅ Assignation créée avec succès!');
  console.log(`   Enseignant: Jean Dupont`);
  console.log(`   Classe: CP1`);
  console.log(`   Année scolaire: ${currentYear.year_label}\n`);
}

assignJeanToCP1().then(() => process.exit(0));
