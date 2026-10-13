const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const SCHOOL_YEAR = '2026-2027';

const studentsData = {
  'CP1': [
    { nom: 'TIENDREBEOGO', prenoms: 'Kadigiatou', montant: 27000 },
    { nom: 'NANA', prenoms: 'Wendrabo Cédric Xavier', montant: 28000 },
    { nom: 'TRAORE', prenoms: 'Abdoul Karim', montant: 20000 },
    { nom: 'OUEDRAOGO', prenoms: 'Fatimata', montant: 21000 },
    { nom: 'ILBOUDO', prenoms: 'Maturin', montant: 21000 },
    { nom: 'FAGO', prenoms: 'Grace', montant: 18000 },
    { nom: 'KOUANDA', prenoms: 'Awa', montant: 28000 },
    { nom: 'OUESRAOGO', prenoms: 'Rabiatou', montant: 12000 },
    { nom: 'NIKIEMA', prenoms: 'Saidatou', montant: 7000 },
    { nom: 'KOURAOGO', prenoms: 'Moubarack', montant: 17000 },
    { nom: 'ILBOUDOU', prenoms: 'Abdalah', montant: 18000 },
    { nom: 'KABORE', prenoms: 'Abdoul Latif', montant: 12000 },
    { nom: 'SANA', prenoms: 'Misbao Sawlif', montant: 4500 },
    { nom: 'BASSON', prenoms: 'Yidimh Aquilas', montant: 17000 },
    { nom: 'SAWADOGO', prenoms: 'Issak', montant: 18000 },
    { nom: 'NIKIEMA', prenoms: 'W-Maryse Lucie', montant: 18000 },
    { nom: 'ILBOUDO', prenoms: 'Abdoul Mohamine', montant: 7000 },
    { nom: 'ILBOUDO', prenoms: 'Mohazou', montant: 7000 },
    { nom: 'NAKANABO', prenoms: 'Fanta Elodine', montant: 28000 },
    { nom: 'ZONGO', prenoms: 'Abdiel Baowendzoodo Blessing', montant: 12000 },
    { nom: 'KOANDA', prenoms: 'Kadi', montant: 7000 },
    { nom: 'NANA', prenoms: 'Gafarou', montant: 23000 },
    { nom: 'NIKIEMA', prenoms: 'Wendida', montant: 7000 },
    { nom: 'YOUGBARE', prenoms: 'Pricilia', montant: 28000 },
    { nom: 'KOANDA', prenoms: 'Abdoul Dramane', montant: 7000 },
    { nom: 'DONDIRI', prenoms: 'Jecolia', montant: 12000 },
    { nom: 'TIOMA', prenoms: 'Ange Abdoul Woasiou', montant: 7000 },
    { nom: 'GASSEMBE', prenoms: 'Salimata', montant: 12000 },
    { nom: 'NIONGADOU', prenoms: 'Moustapha', montant: 18000 },
    { nom: 'ZOURITENTOMA', prenoms: 'Barack Nathan', montant: 18000 },
    { nom: 'OUEDRAOGO', prenoms: 'Nemata', montant: 13000 },
    { nom: 'KONE', prenoms: 'Mohamed Faozine AKIM', montant: 28000 },
    { nom: 'KABRE', prenoms: 'Doussa', montant: 17000 },
    { nom: 'ZANGRE', prenoms: 'Daouda', montant: 18000 },
    { nom: 'CONSEIGA', prenoms: 'Martin', montant: 28000 },
    { nom: 'KOANDA', prenoms: 'A-Maguira', montant: 7000 },
    { nom: 'ILBOUDO', prenoms: 'Walid', montant: 12000 },
    { nom: 'ZONGO', prenoms: 'Elysée', montant: 18000 },
    { nom: 'SAWADOGO', prenoms: 'Olivia', montant: 7000 },
    { nom: 'RAMDE', prenoms: 'Séphora', montant: 12000 },
    { nom: 'ZOETENGA', prenoms: 'Paulin', montant: 28000 },
    { nom: 'NIKIEMA', prenoms: 'Amdia', montant: 22000 },
    { nom: 'GUIGMA', prenoms: 'Fadila', montant: 22000 },
    { nom: 'YAMPA', prenoms: 'Cheick Mouhaze', montant: 28000 },
    { nom: 'BADO', prenoms: 'Y.Lilliane', montant: 17000 },
    { nom: 'SAWADOGO', prenoms: 'Raimatou', montant: 13000 },
    { nom: 'BAGUE', prenoms: 'A.Razack', montant: 28000 },
    { nom: 'KABRE', prenoms: 'Nemata', montant: 7000 },
    { nom: 'DICKO', prenoms: 'Kougématou', montant: 7000 },
    { nom: 'KOALA', prenoms: 'Elice', montant: 12000 },
  ],
  'CP2': [
    { nom: 'ZERBO', prenoms: 'Clarisse', montant: 18000 },
    { nom: 'KOLOGHO', prenoms: 'Sadi', montant: 7000 },
    { nom: 'TRAORE', prenoms: 'Ibrahima', montant: 28000 },
    { nom: 'TANSEMBEDO', prenoms: 'Rabiatou', montant: 9500 },
    { nom: 'IBRIGA', prenoms: 'Maichara', montant: 18000 },
    { nom: 'KOMBASSERE', prenoms: 'Omar', montant: 17000 },
    { nom: 'KIENDREBEOGO', prenoms: 'Radiatou', montant: 17000 },
    { nom: 'KIENDREBEOGO', prenoms: 'Abdoul Aziz', montant: 17000 },
    { nom: 'SANOU', prenoms: 'Steeve', montant: 8000 },
    { nom: 'SAKOUGRI', prenoms: 'Ikrame', montant: 12000 },
    { nom: 'ZONGO', prenoms: 'Blandine', montant: 17000 },
    { nom: 'KABORE', prenoms: 'Jean Marie', montant: 17000 },
    { nom: 'NANA', prenoms: 'Ibrahima', montant: 28000 },
    { nom: 'OUESRAOGO', prenoms: 'Mirna', montant: 22000 },
    { nom: 'SAKANDE', prenoms: 'Samiratou', montant: 12000 },
    { nom: 'WADRE', prenoms: 'Rachide', montant: 12000 },
    { nom: 'KADRE', prenoms: 'Rachidatou', montant: 12000 },
    { nom: 'NIKIEMA', prenoms: 'Grace Divine', montant: 18000 },
    { nom: 'KOTE', prenoms: 'Bousra', montant: 12000 },
    { nom: 'ZONGO', prenoms: 'Abigael', montant: 12000 },
    { nom: 'KOANDA', prenoms: 'Aboubacar', montant: 7000 },
    { nom: 'NACOULMA', prenoms: 'A-Fatao', montant: 17000 },
    { nom: 'ZANGRE', prenoms: 'Fidéline', montant: 22000 },
    { nom: 'ZONGO', prenoms: 'Akim', montant: 18000 },
    { nom: 'TIENDREBEOGO', prenoms: 'Hawa', montant: 7000 },
    { nom: 'TUINA', prenoms: 'Almoudine', montant: 7000 },
    { nom: 'YAMEOGO', prenoms: 'Tendwende Dorcas', montant: 7000 },
    { nom: 'DIPAMA', prenoms: 'Idaya', montant: 7000 },
    { nom: 'YAMEOGO', prenoms: 'Sonia', montant: 12000 },
    { nom: 'YAMPA', prenoms: 'A-Manguid', montant: 28000 },
    { nom: 'ILBOUDO', prenoms: 'Wendgoudi Raissa', montant: 7000 },
    { nom: 'KONATE', prenoms: 'Eliel Mael', montant: 12500 },
    { nom: 'KOUAMA', prenoms: 'Jacque', montant: 15000 },
    { nom: 'GASSEMBE', prenoms: 'Salimata', montant: 12000 },
    { nom: 'TAPSOBA', prenoms: 'Daniel', montant: 12000 },
  ],
  'CE1': [
    { nom: 'FAGO', prenoms: 'Christina', montant: 25000 },
    { nom: 'NANA', prenoms: 'Rodrigue', montant: 30000 },
    { nom: 'IBRIGA', prenoms: 'Koussara', montant: 20000 },
    { nom: 'KOUANDA', prenoms: 'Sanoussa', montant: 30000 },
    { nom: 'TIEMTORE', prenoms: 'Aimar', montant: 17000 },
    { nom: 'ROAMBA', prenoms: 'Mohami', montant: 15000 },
    { nom: 'BOLLY', prenoms: 'Abdoul Rachid', montant: 17000 },
    { nom: 'NIKIEMA', prenoms: 'Wend-Nongoma Eliezère', montant: 23000 },
    { nom: 'OUEDRAOGO', prenoms: 'Abdoul Rachid', montant: 12000 },
    { nom: 'SAKOUGRI', prenoms: 'Djemila', montant: 12000 },
    { nom: 'KABORE', prenoms: 'Nouria', montant: 12000 },
    { nom: 'KABORE', prenoms: 'Bernadette', montant: 12000 },
    { nom: 'KIMA', prenoms: 'Evrad', montant: 17000 },
    { nom: 'KOALA', prenoms: 'Fidèl', montant: 12000 },
    { nom: 'NIKIEMA', prenoms: 'Aboubacar Sidiki', montant: 5000 },
    { nom: 'NIKIEMA', prenoms: 'Oubaidatou', montant: 20000 },
    { nom: 'SIEGEE', prenoms: 'Souleymane', montant: 20000 },
    { nom: 'KOTE', prenoms: 'Ousseni', montant: 12000 },
    { nom: 'OUEDRAOGO', prenoms: 'Sayouba', montant: 20000 },
    { nom: 'NIKIEMA', prenoms: 'Romeo Juldas', montant: 17000 },
    { nom: 'KABORE', prenoms: 'Kouchara', montant: 17000 },
    { nom: 'BOULOU', prenoms: 'Yves', montant: 12000 },
    { nom: 'KABRE', prenoms: 'BECHIR', montant: 12000 },
    { nom: 'NIONGADOU', prenoms: 'Ousmane Scorotimi', montant: 20000 },
    { nom: 'OUEDRAOGO', prenoms: 'Dorcas', montant: 22000 },
    { nom: 'KAFANDO', prenoms: 'Réné', montant: 12000 },
    { nom: 'ZERBO', prenoms: 'Grace Ziliane', montant: 17000 },
    { nom: 'COMPAORE', prenoms: 'Constantine', montant: 7000 },
    { nom: 'DIPAMA', prenoms: 'Soumaya', montant: 7000 },
    { nom: 'ZOETENGA', prenoms: 'Armel', montant: 30000 },
    { nom: 'COMPAORE', prenoms: 'Arba Abdoul Moubarack', montant: 17000 },
    { nom: 'KIEMTORE', prenoms: 'Yousra', montant: 12000 },
    { nom: 'NIKIEMA', prenoms: 'Aida', montant: 12000 },
    { nom: 'SOULGA', prenoms: 'Haoulatou', montant: 17000 },
  ],
  'CE2': [
    { nom: 'NIBIE', prenoms: 'Aurore', montant: 23000 },
    { nom: 'COMPAORE', prenoms: 'Assia', montant: 22000 },
    { nom: 'KOALA', prenoms: 'Abdoul Mubarack', montant: 7000 },
    { nom: 'SODRE', prenoms: 'Cherifatou', montant: 20000 },
    { nom: 'KOURAOGO', prenoms: 'Bassirou', montant: 17000 },
    { nom: 'RAMDE', prenoms: 'Synthia', montant: 17000 },
    { nom: 'KOMBASSERE', prenoms: 'Fadilatou', montant: 17000 },
    { nom: 'KABORE', prenoms: 'Jean Claude', montant: 12000 },
    { nom: 'SANA', prenoms: 'Zalikatou', montant: 7000 },
    { nom: 'KABORE', prenoms: 'Elisabeth', montant: 7000 },
    { nom: 'ZAMPALIGRE', prenoms: 'Rafiatou', montant: 30000 },
    { nom: 'SOULGA', prenoms: 'Aminata', montant: 12000 },
    { nom: 'ILBOUDO', prenoms: 'Latifatou', montant: 7000 },
    { nom: 'ZONGO', prenoms: 'Alvarès', montant: 7000 },
    { nom: 'KOANDA', prenoms: 'Djemilatou', montant: 7000 },
    { nom: 'GASSEMBE', prenoms: 'Ousmane', montant: 12000 },
    { nom: 'KOALA', prenoms: 'Pengwende Elvis', montant: 27000 },
    { nom: 'TRAORE', prenoms: 'Lamine Moubarack', montant: 20000 },
    { nom: 'DELMA', prenoms: 'Abdoul Rasmane Sudais', montant: 27000 },
    { nom: 'ZOETENGA', prenoms: 'Gael', montant: 30000 },
    { nom: 'TAPSOBA', prenoms: 'Anne Marie', montant: 7000 },
    { nom: 'KINDO', prenoms: 'Wassim', montant: 12000 },
    { nom: 'YAMPA', prenoms: 'Zoenabo', montant: 30000 },
    { nom: 'BADO', prenoms: 'Jemima', montant: 17000 },
    { nom: 'NACOULMA', prenoms: 'Lydia', montant: 7000 },
  ],
  'CM1': [
    { nom: 'TIENDREBEOGO', prenoms: 'Alimata', montant: 22000 },
    { nom: 'COMPAORE', prenoms: 'Rasmata', montant: 27000 },
    { nom: 'TIEMTORE', prenoms: 'Evrad', montant: 17000 },
    { nom: 'AVLEKPE', prenoms: 'Gloria AKOKO', montant: 17000 },
    { nom: 'NANA', prenoms: 'Amsétou', montant: 17000 },
    { nom: 'TASEMBEDO', prenoms: 'Nouroudine', montant: 9500 },
    { nom: 'OUEDRAOGO', prenoms: 'Issaka', montant: 32000 },
    { nom: 'KIMA', prenoms: 'Anael', montant: 17000 },
    { nom: 'OUEDRAOGO', prenoms: 'Chadras', montant: 32000 },
    { nom: 'KOALA', prenoms: 'Jessica Ariane', montant: 32000 },
    { nom: 'YANOGO', prenoms: 'Audrey Oriane', montant: 30000 },
    { nom: 'TIOMA', prenoms: 'Lookmane', montant: 12000 },
    { nom: 'OUEDRAOGO', prenoms: 'Oumou Marisko', montant: 17000 },
    { nom: 'ZOETENGA', prenoms: 'Grace', montant: 22000 },
    { nom: 'TIENDREBEOGO', prenoms: 'Saobira', montant: 7000 },
    { nom: 'SAWADOGO', prenoms: 'Ramata', montant: 27000 },
    { nom: 'COMPAORE', prenoms: 'Nouria', montant: 12000 },
    { nom: 'COMPAORE', prenoms: 'Rasmané', montant: 12000 },
    { nom: 'GUIGMA', prenoms: 'Samadou', montant: 22000 },
    { nom: 'NONGUERMA', prenoms: 'Andréa', montant: 17000 },
    { nom: 'KABORE', prenoms: 'Nouria', montant: 7000 },
    { nom: 'BAGUE', prenoms: 'Sarata', montant: 32000 },
    { nom: 'NIKIEMA', prenoms: 'Isidore', montant: 12000 },
    { nom: 'NIKIEMA', prenoms: 'Doriane', montant: 12000 },
  ],
  'CM2': [
    { nom: 'NIBIE', prenoms: 'David', montant: 25000 },
    { nom: 'ZONGO', prenoms: 'Aoulatou', montant: 7000 },
    { nom: 'KABORE', prenoms: 'Kevin', montant: 12000 },
    { nom: 'OUEDRAOGO', prenoms: 'Mokazoa', montant: 32000 },
    { nom: 'OUEDRAOGO', prenoms: 'Mohamed', montant: 17000 },
    { nom: 'CONVOLBO', prenoms: 'Ousmane', montant: 22000 },
    { nom: 'NIKIEMA', prenoms: 'Gael', montant: 12000 },
    { nom: 'TIENDREBEOGO', prenoms: 'FAROUCK', montant: 7000 },
    { nom: 'COMPAORE', prenoms: 'Fatao', montant: 12000 },
    { nom: 'TRAORE', prenoms: 'Aida', montant: 32000 },
    { nom: 'OUEDRAOGO', prenoms: 'Aboubacar', montant: 17000 },
    { nom: 'SODRE', prenoms: 'Mamata', montant: 17000 },
  ],
};

// Générer un matricule unique
const generateMatricule = async () => {
  const year = SCHOOL_YEAR.substring(2, 4); // 2026-2027 -> 26
  const prefix = `ECO${year}`;
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
};

async function importStudents() {
  console.log('=== IMPORTATION DES ÉLÈVES ===\n');

  try {
    // Récupérer l'ID de l'année scolaire
    const { data: schoolYearData, error: syError } = await supabase
      .from('school_years')
      .select('id')
      .eq('year_label', SCHOOL_YEAR)
      .single();

    if (syError || !schoolYearData) {
      console.error('Erreur: année scolaire non trouvée', syError);
      process.exit(1);
    }

    const schoolYearId = schoolYearData.id;
    console.log(`Année scolaire: ${SCHOOL_YEAR} (ID: ${schoolYearId})\n`);

    let totalStudents = 0;
    let totalPayments = 0;
    let errors = 0;

    for (const [className, students] of Object.entries(studentsData)) {
      console.log(`Classe ${className}: ${students.length} élèves`);

      // Récupérer l'ID de la classe
      const { data: classData } = await supabase
        .from('classes')
        .select('id')
        .eq('name', className)
        .single();

      if (!classData) {
        console.error(`  Erreur: classe ${className} non trouvée`);
        errors++;
        continue;
      }

      const classId = classData.id;

      for (const student of students) {
        try {
          const matricule = await generateMatricule();

          // Créer l'élève
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .insert({
              unique_identifier: `ID${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
              matricule,
              first_name: student.prenoms,
              last_name: student.nom,
              current_class_id: classId,
              school_year: SCHOOL_YEAR,
              status: 'active',
            })
            .select('id')
            .single();

          if (studentError) {
            console.error(`  Erreur création ${student.nom} ${student.prenoms}:`, studentError);
            errors++;
            continue;
          }

          // Créer le paiement initial si montant > 0
          if (student.montant > 0) {
            const { error: paymentError } = await supabase
              .from('tuition_payments')
              .insert({
                student_id: studentData.id,
                school_year_id: schoolYearId,
                amount: student.montant,
                payment_date: new Date().toISOString().split('T')[0],
                receipt_number: `REC${Date.now()}`,
              });

            if (paymentError) {
              console.error(`  Erreur paiement ${student.nom} ${student.prenoms}:`, paymentError);
              errors++;
            } else {
              totalPayments += student.montant;
            }
          }

          totalStudents++;
        } catch (error) {
          console.error(`  Erreur traitement ${student.nom} ${student.prenoms}:`, error);
          errors++;
        }
      }
    }

    console.log('\n=== RÉSUMÉ ===');
    console.log(`Élèves créés: ${totalStudents}`);
    console.log(`Paiements créés: ${totalPayments} FCFA`);
    console.log(`Erreurs: ${errors}`);

    if (errors === 0) {
      console.log('\n✓ Importation terminée avec succès !');
    } else {
      console.log('\n⚠ Importation terminée avec des erreurs');
    }

  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

importStudents();
