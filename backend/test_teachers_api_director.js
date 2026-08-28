const crypto = require('crypto');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testTeachersAPIDirector() {
  console.log('=== Test API Enseignants (Directeur) ===\n');
  
  try {
    // Login as director
    console.log('1. Connexion en tant que directeur...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Directeur',
        password: 'nouveau123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log(`Status: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      console.log('Erreur:', loginData.error);
      return;
    }
    
    const token = loginData.token;
    console.log(`✅ Connecté: ${loginData.user.first_name} ${loginData.user.last_name}\n`);
    
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

testTeachersAPIDirector().then(() => process.exit(0));