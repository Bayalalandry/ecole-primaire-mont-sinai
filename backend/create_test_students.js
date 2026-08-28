const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function createTestStudents() {
  console.log('=== Création d\'élèves de test ===\n');
  
  try {
    const cp1Id = 'bbfd3138-e27d-4595-b42d-8d79178a65c9';
    const ce1Id = 'ca3de727-88a1-484a-ad15-9593781c4a4b';
    const donaldId = '0a322338-d85e-492b-9e98-952744e9e4aa';
    const alexId = '7155a6c7-a969-445c-914d-a7b7e04ea958';
    
    const cp1Students = [
      { first_name: 'Jean', last_name: 'Kaboré' },
      { first_name: 'Marie', last_name: 'Ouédraogo' },
      { first_name: 'Alassane', last_name: 'Diallo' }
    ];
    
    const ce1Students = [
      { first_name: 'Fatou', last_name: 'Sawadogo' },
      { first_name: 'Abdoulaye', last_name: 'Zongo' },
      { first_name: 'Aminata', last_name: 'Traoré' }
    ];
    
    console.log('1. Création des élèves CP1...');
    for (const student of cp1Students) {
      const matricule = `ECO24${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      const uniqueId = `ID${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      const { error } = await supabase.from('students').insert({
        unique_identifier: uniqueId,
        matricule,
        first_name: student.first_name,
        last_name: student.last_name,
        current_class_id: cp1Id,
        school_year: '2024-2025',
        status: 'active',
        created_by: donaldId
      });
      
      if (error) {
        console.log(`Erreur création ${student.first_name}:`, error.message);
      } else {
        console.log(`✅ ${student.first_name} ${student.last_name} créé dans CP1`);
      }
    }
    
    console.log('\n2. Création des élèves CE1...');
    for (const student of ce1Students) {
      const matricule = `ECO24${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      const uniqueId = `ID${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      const { error } = await supabase.from('students').insert({
        unique_identifier: uniqueId,
        matricule,
        first_name: student.first_name,
        last_name: student.last_name,
        current_class_id: ce1Id,
        school_year: '2024-2025',
        status: 'active',
        created_by: alexId
      });
      
      if (error) {
        console.log(`Erreur création ${student.first_name}:`, error.message);
      } else {
        console.log(`✅ ${student.first_name} ${student.last_name} créé dans CE1`);
      }
    }
    
    console.log('\n3. Vérification des élèves créés...');
    const { data: cp1Check } = await supabase.from('students').select('*').eq('current_class_id', cp1Id);
    const { data: ce1Check } = await supabase.from('students').select('*').eq('current_class_id', ce1Id);
    
    console.log(`Élèves CP1: ${cp1Check.length}`);
    console.log(`Élèves CE1: ${ce1Check.length}`);
    
    console.log('\n✅ Élèves de test créés avec succès');
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

createTestStudents().then(() => process.exit(0));