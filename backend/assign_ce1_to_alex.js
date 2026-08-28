const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function assignCE1ToAlex() {
  console.log('=== ASSIGNATION CE1 A ALEX ===\n');

  // Récupérer l'utilisateur ALEX
  const { data: alex } = await supabase
    .from('users')
    .select('id')
    .ilike('username', 'alex')
    .maybeSingle();

  if (!alex) {
    console.log('Utilisateur ALEX non trouve');
    return;
  }

  // Récupérer l'année scolaire actuelle
  const { data: schoolYear } = await supabase
    .from('school_years')
    .select('id')
    .eq('year_label', '2026-2027')
    .single();

  // Récupérer la classe CE1
  const { data: ce1Class } = await supabase
    .from('classes')
    .select('id')
    .eq('name', 'CE1')
    .single();

  // Vérifier si l'assignation existe déjà
  const { data: existing } = await supabase
    .from('teacher_class_assignments')
    .select('*')
    .eq('teacher_id', alex.id)
    .eq('class_id', ce1Class.id)
    .maybeSingle();

  if (existing) {
    console.log('Assignation existe deja, mise a jour du school_year_id');
    const { error } = await supabase
      .from('teacher_class_assignments')
      .update({ school_year_id: schoolYear.id })
      .eq('id', existing.id);

    if (error) {
      console.error('Erreur mise a jour:', error);
    } else {
      console.log('OK - Assignation CE1 de ALEX mise a jour');
    }
  } else {
    console.log('Creation nouvelle assignation');
    const { error } = await supabase
      .from('teacher_class_assignments')
      .insert({
        teacher_id: alex.id,
        class_id: ce1Class.id,
        school_year_id: schoolYear.id,
      });

    if (error) {
      console.error('Erreur creation:', error);
    } else {
      console.log('OK - Assignation CE1 de ALEX creee');
    }
  }
}

assignCE1ToAlex();
