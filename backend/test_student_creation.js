const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testStudentCreation() {
  console.log('=== Testing Student Creation ===');
  
  try {
    // Test 1: Check if students table exists and get its structure
    console.log('\n1. Checking students table structure...');
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(1);
    
    if (studentsError) {
      console.log('Error accessing students table:', studentsError.message);
    } else {
      console.log('Students table accessible');
      if (studentsData && studentsData.length > 0) {
        console.log('Sample columns:', Object.keys(studentsData[0]));
      } else {
        console.log('Table is empty, getting column info...');
        // Try to get column info using a different approach
        const { data: columnInfo } = await supabase
          .rpc('get_columns', { table_name: 'students' })
          .catch(() => ({ data: null }));
        if (columnInfo) {
          console.log('Column info:', columnInfo);
        }
      }
    }

    // Test 2: Check classes
    console.log('\n2. Checking classes...');
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('*');
    
    if (classesError) {
      console.log('Error accessing classes:', classesError.message);
    } else {
      console.log('Classes found:', classesData?.length);
      if (classesData && classesData.length > 0) {
        console.log('First class:', classesData[0]);
      }
    }

    // Test 3: Try to insert a minimal student
    console.log('\n3. Testing student insertion...');
    const testStudent = {
      matricule: 'TEST001',
      first_name: 'Test',
      last_name: 'Student',
      class_id: classesData?.[0]?.id,
      school_year: '2024-2025',
      status: 'active'
    };
    
    console.log('Attempting to insert:', testStudent);
    
    const { data: insertData, error: insertError } = await supabase
      .from('students')
      .insert(testStudent)
      .select();
    
    if (insertError) {
      console.log('❌ Insertion failed:', insertError.message);
      console.log('Error details:', insertError);
    } else {
      console.log('✅ Insertion successful:', insertData);
      
      // Clean up
      if (insertData && insertData[0]) {
        await supabase.from('students').delete().eq('id', insertData[0].id);
        console.log('Test student cleaned up');
      }
    }

  } catch (error) {
    console.log('Unexpected error:', error);
  }
}

testStudentCreation().then(() => process.exit(0));