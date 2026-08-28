const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function assignClassToDirector() {
  try {
    console.log('Assignation d\'une classe au directeur...');

    // Récupérer le compte directeur
    const { data: director, error: directorError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'Directeur')
      .single();

    if (directorError || !director) {
      console.error('Erreur lors de la récupération du directeur:', directorError);
      return;
    }

    console.log('Directeur trouvé:', director.username, 'ID:', director.id);

    // Récupérer l'année scolaire actuelle
    const { data: schoolYear, error: yearError } = await supabase
      .from('school_years')
      .select('*')
      .eq('is_current', true)
      .single();

    if (yearError || !schoolYear) {
      console.error('Erreur lors de la récupération de l\'année scolaire:', yearError);
      return;
    }

    console.log('Année scolaire actuelle:', schoolYear.year_label, 'ID:', schoolYear.id);

    // Récupérer la classe CP1 pour l'assigner au directeur
    const { data: cp1Class, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('name', 'CP1')
      .single();

    if (classError || !cp1Class) {
      console.error('Erreur lors de la récupération de la classe CP1:', classError);
      return;
    }

    console.log('Classe CP1 trouvée:', cp1Class.name, 'ID:', cp1Class.id);

    // Créer une entrée dans la table teachers pour le directeur
    const { data: existingTeacher, error: teacherCheckError } = await supabase
      .from('teachers')
      .select('*')
      .eq('user_id', director.id)
      .maybeSingle();

    if (teacherCheckError) {
      console.error('Erreur lors de la vérification de teacher:', teacherCheckError);
      return;
    }

    if (!existingTeacher) {
      console.log('Création d\'une entrée teachers pour le directeur...');
      const { error: createTeacherError } = await supabase
        .from('teachers')
        .insert({
          user_id: director.id,
          status: 'active'
        });

      if (createTeacherError) {
        console.error('Erreur lors de la création de teacher:', createTeacherError);
        return;
      }
      console.log('Entrée teachers créée pour le directeur');
    } else {
      console.log('Entrée teachers existe déjà pour le directeur');
    }

    // Utiliser user_id comme teacher_id
    const teacherId = director.id;
    console.log('Teacher ID (user_id):', teacherId);

    // Vérifier si l'assignation existe déjà
    const { data: existingAssignment, error: checkError } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('class_id', cp1Class.id)
      .maybeSingle();

    if (checkError) {
      console.error('Erreur lors de la vérification de l\'assignation:', checkError);
      return;
    }

    if (existingAssignment) {
      console.log('Le directeur est déjà assigné à la classe CP1');
      return;
    }

    console.log('Création de l\'assignation...');
    // Créer l'assignation
    const { error: assignError } = await supabase
      .from('teacher_class_assignments')
      .insert({
        teacher_id: teacherId,
        class_id: cp1Class.id,
        school_year_id: schoolYear.id
      });

    if (assignError) {
      console.error('Erreur lors de l\'assignation:', assignError);
      return;
    }

    console.log('✅ Succès ! Le directeur a été assigné à la classe CP1');
    console.log('Directeur:', director.username);
    console.log('Classe:', cp1Class.name);
    console.log('Année scolaire:', schoolYear.year_label);

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

assignClassToDirector();