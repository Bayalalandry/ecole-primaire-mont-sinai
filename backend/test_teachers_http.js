// Using built-in fetch (Node.js 18+)

async function testTeachersEndpoint() {
  console.log('=== Test HTTP /auth/teachers ===\n');
  
  try {
    // D'abord se connecter pour obtenir un token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Directeur', password: 'directeur123' })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login status:', loginResponse.status);
    
    if (!loginData.token) {
      console.log('Login failed:', loginData);
      return;
    }
    
    console.log('Token obtained');
    
    // Maintenant tester l'endpoint teachers
    const teachersResponse = await fetch('http://localhost:5000/api/auth/teachers', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Teachers endpoint status:', teachersResponse.status);
    
    const teachersData = await teachersResponse.json();
    console.log('Teachers data:', JSON.stringify(teachersData, null, 2));
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

testTeachersEndpoint().then(() => process.exit(0));