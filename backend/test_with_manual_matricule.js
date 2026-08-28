const crypto = require('crypto');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testWithManualMatricule() {
  console.log('=== Test: Création avec matricule manuel ===\n');
  
  try {
    // Login as teacher
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
    const classesResponse = await fetch(`${API_URL}/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const classesData = await classesResponse.json();
    const classes = classesData.classes;
    const classId = classes[0].id;
    
    // Create student with manual matricule
    console.log('Création avec matricule manuel...');
    const studentData = {
      firstName: 'Test',
      lastName: 'Manual',
      dateOfBirth: '2015-05-15',
      gender: 'M',
      parentName: 'Parent',
      parentPhone: '70123456',
      parentAddress: 'Adresse',
      classId: classId,
      schoolYear: '2024-2025',
      manualMatricule: 'MANUAL999' // Matricule manuel unique
    };
    
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
    }
    
  } catch (error) {
    console.log('❌ ERREUR:', error.message);
  }
}

testWithManualMatricule().then(() => process.exit(0));