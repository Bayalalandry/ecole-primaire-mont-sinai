const crypto = require('crypto');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testCreateError() {
  console.log('=== Test: Création d\'élève pour voir l\'erreur ===\n');
  
  try {
    // Login as teacher
    console.log('1. Connexion en tant qu\'enseignant (ALEX)...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'ALEX',
        password: 'nouveau123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log(`✅ Connecté\n`);
    
    // Get classes
    console.log('2. Récupération des classes...');
    const classesResponse = await fetch(`${API_URL}/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const classesData = await classesResponse.json();
    const classes = classesData.classes;
    const classId = classes[0].id;
    console.log(`✅ Classe: ${classes[0].name} (${classId})\n`);
    
    // Create student with minimal data
    console.log('3. Création d\'un élève...');
    const studentData = {
      firstName: 'Test',
      lastName: 'Erreur',
      dateOfBirth: '2015-05-15',
      gender: 'M',
      parentName: 'Parent',
      parentPhone: '70123456',
      parentAddress: 'Adresse',
      classId: classId,
      schoolYear: '2024-2025',
      manualMatricule: ''
    };
    
    console.log('Données envoyées:', JSON.stringify(studentData, null, 2));
    
    const createResponse = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(studentData)
    });
    
    console.log(`Status: ${createResponse.status}`);
    const responseData = await createResponse.json();
    console.log('Response:', JSON.stringify(responseData, null, 2));
    
    if (createResponse.ok) {
      console.log('\n✅ Élève créé avec succès');
      // Cleanup
      await fetch(`${API_URL}/students/${responseData.student.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } else {
      console.log('\n❌ Erreur lors de la création');
    }
    
  } catch (error) {
    console.log('❌ ERREUR:', error.message);
  }
}

testCreateError().then(() => process.exit(0));