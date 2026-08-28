const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testInsert() {
  console.log('=== Testing Direct Student Insert ===');
  
  try {
    // Get a class ID
    const { data: classes } = await supabase.from('classes').select('*').limit(1);
    const classId = classes?.[0]?.id;
    console.log('Using class ID:', classId);
    
    // Test insert with current_class_id
    const uniqueIdentifier = 'ID' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const studentData = {
      unique_identifier: uniqueIdentifier, // Ajouter unique_identifier
      matricule: 'TEST' + Date.now(),
      first_name: 'Test',
      last_name: 'Student',
      current_class_id: classId, // Using current_class_id
      school_year: '2024-2025',
      status: 'active'
    };
    
    console.log('Inserting:', studentData);
    
    const { data, error } = await supabase
      .from('students')
      .insert(studentData)
      .select();
    
    if (error) {
      console.log('❌ Insert failed:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('✅ Insert successful:', data);
      
      // Clean up
      if (data && data[0]) {
        await supabase.from('students').delete().eq('id', data[0].id);
        console.log('Test student cleaned up');
      }
    }
  } catch (error) {
    console.log('Exception:', error.message);
  }
}

testInsert().then(() => process.exit(0));