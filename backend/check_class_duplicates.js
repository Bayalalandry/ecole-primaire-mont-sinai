const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkClassDuplicates() {
  try {
    console.log('Vérification des doublons dans la table classes...');

    // Récupérer TOUTES les classes sans filtrage
    const { data: classes, error } = await supabase
      .from('classes')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erreur lors de la récupération des classes:', error);
      return;
    }

    console.log(`Total de classes trouvées: ${classes.length}`);
    console.log('\nToutes les classes avec leurs ID:');
    classes.forEach((cls, index) => {
      console.log(`${index + 1}. ${cls.name} (ID: ${cls.id})`);
    });

    // Vérifier les doublons par nom
    const nameCounts = {};
    classes.forEach(cls => {
      nameCounts[cls.name] = (nameCounts[cls.name] || 0) + 1;
    });

    console.log('\nDoublons potentiels (noms qui apparaissent plusieurs fois):');
    Object.entries(nameCounts).forEach(([name, count]) => {
      if (count > 1) {
        console.log(`- ${name}: ${count} occurrences`);
        // Afficher tous les IDs pour ce nom
        const duplicateClasses = classes.filter(c => c.name === name);
        duplicateClasses.forEach(dup => {
          console.log(`  * ID: ${dup.id}`);
        });
      }
    });

    // Vérifier les assignations enseignants pour identifier les classes "actives"
    console.log('\nAssignations enseignants par classe:');
    const { data: assignments, error: assignError } = await supabase
      .from('teacher_class_assignments')
      .select('*');

    if (assignError) {
      console.error('Erreur lors de la récupération des assignations:', assignError);
    } else {
      const classAssignments = {};
      assignments.forEach(assign => {
        if (!classAssignments[assign.class_id]) {
          classAssignments[assign.class_id] = 0;
        }
        classAssignments[assign.class_id]++;
      });

      Object.entries(classAssignments).forEach(([classId, count]) => {
        const className = classes.find(c => c.id === classId)?.name || 'Inconnue';
        console.log(`- ${className} (ID: ${classId}): ${count} assignation(s)`);
      });
    }

    // Vérifier les tarifs de scolarité par classe
    console.log('\nTarifs de scolarité par classe:');
    const { data: rates, error: ratesError } = await supabase
      .from('tuition_rates')
      .select('*');

    if (ratesError) {
      console.error('Erreur lors de la récupération des tarifs:', ratesError);
    } else {
      const classRates = {};
      rates.forEach(rate => {
        if (!classRates[rate.class_id]) {
          classRates[rate.class_id] = 0;
        }
        classRates[rate.class_id]++;
      });

      Object.entries(classRates).forEach(([classId, count]) => {
        const className = classes.find(c => c.id === classId)?.name || 'Inconnue';
        console.log(`- ${className} (ID: ${classId}): ${count} tarif(s)`);
      });
    }

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

checkClassDuplicates();