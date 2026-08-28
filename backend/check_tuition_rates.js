const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  console.log('=== CHECK TUITION RATES ===');

  try {
    // 1. Vérifier les tarifs dans la base
    const { data: rates } = await supabase
      .from('tuition_rates')
      .select('*');

    console.log('All rates in database:', rates?.length || 0);
    rates?.forEach((rate) => {
      console.log(`- Class: ${rate.class_id}, Amount: ${rate.amount}, Date: ${rate.effective_date}`);
    });

    // 2. Vérifier les élèves et leurs classes
    const { data: students } = await supabase
      .from('students')
      .select('id, matricule, current_class_id, classes(name)')
      .eq('status', 'active')
      .limit(5);

    console.log('Sample students:', students?.length || 0);
    students?.forEach((student) => {
      console.log(`- ${student.matricule}: Class ID ${student.current_class_id}, Class name ${student.classes?.name}`);
    });

    // 3. Tester la requête pour un élève spécifique
    if (students && students.length > 0) {
      const student = students[0];
      const currentDate = new Date().toISOString().split('T')[0];
      console.log(`\nTesting rate query for student ${student.matricule} (class ${student.current_class_id})`);
      console.log(`Current date: ${currentDate}`);

      const { data: rate } = await supabase
        .from('tuition_rates')
        .select('*')
        .eq('class_id', student.current_class_id)
        .lte('effective_date', currentDate)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Rate found:', rate);
    }

  } catch (error) {
    console.error('Error:', error);
  }
})();
