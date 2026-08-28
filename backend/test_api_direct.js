const fetch = require('node-fetch');

async function testApiDirect() {
  console.log('=== TEST API DIRECT ===\n');

  try {
    // Login en tant que directeur
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Directeur',
        password: 'nouveau123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login status:', loginResponse.status);

    if (loginResponse.status === 200 && loginData.token) {
      // Appeler /auth/teachers
      const teachersResponse = await fetch('http://localhost:5000/api/auth/teachers', {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });

      const teachersData = await teachersResponse.json();
      console.log('Teachers API status:', teachersResponse.status);
      console.log('Teachers count:', teachersData.teachers?.length);

      const alexTeacher = teachersData.teachers?.find((t) => t.username === 'ALEX');
      if (alexTeacher) {
        console.log(`\nALEX dans l'API:`);
        console.log(`  assigned_class: ${alexTeacher.assigned_class}`);
        console.log(`  assigned_classes: ${JSON.stringify(alexTeacher.assigned_classes)}`);
      }
    } else {
      console.log('Login failed:', loginData);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

testApiDirect();
