// Using built-in fetch (Node.js 18+)

async function testTeacherStudents() {
  console.log('=== Test Teacher Students View ===\n');
  
  try {
    // Login as teacher ALEX
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ALEX', password: 'nouveau123' })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login status:', loginResponse.status);
    console.log('User:', loginData.user);
    
    if (!loginData.token) {
      console.log('Login failed:', loginData);
      return;
    }
    
    console.log('Token obtained for ALEX');
    
    // Test students endpoint
    const studentsResponse = await fetch('http://localhost:5000/api/students', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Students endpoint status:', studentsResponse.status);
    
    const studentsData = await studentsResponse.json();
    console.log('Students count:', studentsData.students?.length);
    console.log('Students:', JSON.stringify(studentsData.students, null, 2));
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

testTeacherStudents().then(() => process.exit(0));