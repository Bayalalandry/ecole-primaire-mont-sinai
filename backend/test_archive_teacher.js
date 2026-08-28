// Using built-in fetch (Node.js 18+)

async function testArchiveTeacher() {
  console.log('=== Test Archivage Compte Enseignant ===\n');
  
  try {
    // Login as teacher
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'DONALD', password: 'nouveau123' })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login status:', loginResponse.status);
    
    if (!loginData.token) {
      console.log('Login failed:', loginData);
      return;
    }
    
    console.log('Token obtained');
    
    // Test archiving a teacher (try to archive Alex)
    const archiveResponse = await fetch('http://localhost:5000/api/auth/teacher-status/7155a6c7-a969-445c-914d-a7b7e04ea958', {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'archived' })
    });
    
    console.log('Archive status:', archiveResponse.status);
    
    const archiveData = await archiveResponse.json();
    console.log('Archive response:', archiveData);
    
    // Check the teacher status
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config();
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    const { data: teacher } = await supabase
      .from('teachers')
      .select('*')
      .eq('user_id', '7155a6c7-a969-445c-914d-a7b7e04ea958')
      .maybeSingle();
    
    console.log('Teacher status in DB:', teacher?.status);
    
    // Restore to active
    const restoreResponse = await fetch('http://localhost:5000/api/auth/teacher-status/7155a6c7-a969-445c-914d-a7b7e04ea958', {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'active' })
    });
    
    console.log('Restore status:', restoreResponse.status);
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

testArchiveTeacher().then(() => process.exit(0));