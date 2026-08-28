const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function fixAlexCM2Assignment() {
  console.log('=== CORRECTION ASSIGNATION CM2 ALEX ===\n');

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

  // Récupérer la classe CM2
  const { data: cm2Class } = await supabase
    .from('classes')
    .select('id')
    .eq('name', 'CM2')
    .single();

  // Mettre à jour l'assignation
  const { error } = await supabase
    .from('teacher_class_assignments')
    .update({ school_year_id: schoolYear.id })
    .eq('teacher_id', alex.id)
    .eq('class_id', cm2Class.id);

  if (error) {
    console.error('Erreur mise a jour:', error);
  } else {
    console.log('OK - Assignation CM2 de ALEX corrigee');
    console.log(`School Year ID: ${schoolYear.id}`);
  }
}

fixAlexCM2Assignment();
