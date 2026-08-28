const crypto = require('crypto');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testTeachersAPI() {
  console.log('=== Test API Enseignants ===\n');
  
  try {
    // Login as founder
    console.log('1. Connexion en tant que fondateur (Inno)...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Inno',
        password: 'nouveau123',
        secretAnswer: 'Ouagadougou'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      if (loginData.requiresSecretAnswer) {
        console.log('Réponse secrète requise. Envoi de la réponse...');
        const secretResponse = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Inno',
            password: 'nouveau123',
            secretAnswer: 'Burkina'
          })
        });
        const secretData = await secretResponse.json();
        var token = secretData.token;
        console.log(`✅ Connecté: ${secretData.user.first_name} ${secretData.user.last_name}\n`);
      } else {
        throw new Error(loginData.error);
      }
    } else {
      var token = loginData.token;
      console.log(`✅ Connecté: ${loginData.user.first_name} ${loginData.user.last_name}\n`);
    }
    
    // Get all teachers
    console.log('2. Récupération de tous les enseignants...');
    const teachersResponse = await fetch(`${API_URL}/auth/teachers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`Status: ${teachersResponse.status}`);
    const teachersData = await teachersResponse.json();
    console.log('Response:', JSON.stringify(teachersData, null, 2));
    
    if (teachersResponse.ok) {
      console.log(`\n✅ ${teachersData.teachers?.length || 0} enseignant(s) trouvé(s)`);
    } else {
      console.log('\n❌ Erreur lors de la récupération');
    }
    
  } catch (error) {
    console.log('❌ ERREUR:', error.message);
  }
}

testTeachersAPI().then(() => process.exit(0));