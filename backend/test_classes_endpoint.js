// Using built-in fetch (Node.js 18+)

async function testClassesEndpoint() {
  console.log('=== Test Classes Endpoint ===\n');
  
  try {
    // Login as teacher
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ALEX', password: 'nouveau123' })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login status:', loginResponse.status);
    
    if (!loginData.token) {
      console.log('Login failed:', loginData);
      return;
    }
    
    console.log('Token obtained');
    
    // Test classes endpoint
    const classesResponse = await fetch('http://localhost:5000/api/classes', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Classes endpoint status:', classesResponse.status);
    
    const classesData = await classesResponse.json();
    console.log('Classes data:', JSON.stringify(classesData, null, 2));
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

testClassesEndpoint().then(() => process.exit(0));