const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function assignBayalaToCE2() {
  console.log('=== Assignation de bayala steve à CE2 ===\n');

  // Récupérer bayala steve
  const { data: bayala, error: bayalaError } = await supabase
    .from('users')
    .select('id, last_name, first_name')
    .eq('last_name', 'bayala')
    .eq('first_name', 'steve')
    .single();

  if (bayalaError || !bayala) {
    console.error('❌ bayala steve non trouvé:', bayalaError);
    return;
  }

  console.log(`✅ bayala steve trouvé (ID: ${bayala.id})`);

  // Récupérer l'année scolaire actuelle
  const { data: currentYear } = await supabase
    .from('school_years')
    .select('id, year_label')
    .eq('is_current', true)
    .single();

  console.log(`✅ Année scolaire actuelle: ${currentYear?.year_label} (ID: ${currentYear?.id})`);

  // Récupérer la classe CE2
  const { data: ce2Class } = await supabase
    .from('classes')
    .select('id, name')
    .eq('name', 'CE2')
    .single();

  if (!ce2Class) {
    console.error('❌ Classe CE2 non trouvée');
    return;
  }

  console.log(`✅ Classe CE2 trouvée (ID: ${ce2Class.id})`);

  // Vérifier si l'assignation existe déjà
  const { data: existingAssignment } = await supabase
    .from('teacher_class_assignments')
    .select('*')
    .eq('teacher_id', bayala.id)
    .eq('class_id', ce2Class.id)
    .eq('school_year_id', currentYear.id)
    .maybeSingle();

  if (existingAssignment) {
    console.log('⚠️  bayala steve est déjà assigné à CE2 pour cette année scolaire');
    return;
  }

  // Créer l'assignation
  const { data: assignment, error: assignmentError } = await supabase
    .from('teacher_class_assignments')
    .insert({
      teacher_id: bayala.id,
      class_id: ce2Class.id,
      school_year_id: currentYear.id,
    })
    .select()
    .single();

  if (assignmentError) {
    console.error('❌ Erreur lors de l\'assignation:', assignmentError);
    return;
  }

  console.log('✅ Assignation créée avec succès!');
  console.log(`   Enseignant: ${bayala.last_name} ${bayala.first_name}`);
  console.log(`   Classe: ${ce2Class.name}`);
  console.log(`   Année scolaire: ${currentYear.year_label}`);
}

assignBayalaToCE2().then(() => process.exit(0));
