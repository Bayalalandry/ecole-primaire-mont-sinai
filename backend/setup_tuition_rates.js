const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  console.log('=== SETUP TUITION RATES ===');

  try {
    // 1. Récupérer les classes
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .order('name');

    console.log('Classes:', classes);

    // 2. Récupérer les élèves avec leurs classes
    const { data: students } = await supabase
      .from('students')
      .select('id, first_name, last_name, matricule, current_class_id, classes(name)')
      .eq('status', 'active');

    console.log('Students:', students?.length || 0);

    // 3. Identifier les classes qui ont des élèves
    const classesWithStudents = new Set();
    students?.forEach((student) => {
      if (student.current_class_id) {
        classesWithStudents.add(student.current_class_id);
      }
    });

    console.log('Classes with students:', classesWithStudents.size);

    // 4. Définir des tarifs pour toutes ces classes
    const currentDate = new Date().toISOString().split('T')[0];
    const schoolYear = '2026-2027';

    for (const classId of classesWithStudents) {
      const classData = classes?.find((c) => c.id === classId);
      const className = classData?.name || 'Unknown';

      // Vérifier si un tarif existe déjà
      const { data: existingRate } = await supabase
        .from('tuition_rates')
        .select('*')
        .eq('class_id', classId)
        .maybeSingle();

      if (existingRate) {
        console.log(`Rate already exists for ${className}: ${existingRate.amount} XOF`);
      } else {
        // Créer un tarif par défaut (25 000 XOF)
        const { error } = await supabase
          .from('tuition_rates')
          .insert({
            class_id: classId,
            amount: 25000,
            effective_date: currentDate,
          });

        if (error) {
          console.error(`Error creating rate for ${className}:`, error);
        } else {
          console.log(`✅ Rate created for ${className}: 25 000 XOF`);
        }
      }
    }

    console.log('=== FINISHED ===');
  } catch (error) {
    console.error('Error:', error);
  }
})();
