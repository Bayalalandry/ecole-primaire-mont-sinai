const crypto = require('crypto');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testReqUser() {
  console.log('=== Test: Vérification de req.user ===\n');
  
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
    const user = loginData.user;
    console.log(`✅ Connecté: ${user.first_name} ${user.last_name} (${user.role})`);
    console.log(`   User ID: ${user.id}\n`);
    
    // Get classes (simple request that should have req.user)
    console.log('2. Test de requête avec authentification...');
    const classesResponse = await fetch(`${API_URL}/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Status: ${classesResponse.status}`);
    
    // Create a student to trigger the log
    console.log('\n3. Création d\'un élève pour voir les logs...');
    const classesData = await classesResponse.json();
    const classes = classesData.classes;
    const classId = classes[0].id;
    
    const studentData = {
      firstName: 'Test',
      lastName: 'ReqUser',
      dateOfBirth: '2015-05-15',
      gender: 'M',
      parentName: 'Parent',
      parentPhone: '70123456',
      parentAddress: 'Adresse',
      classId: classId,
      schoolYear: '2024-2025',
      manualMatricule: ''
    };
    
    const createResponse = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(studentData)
    });
    
    const createData = await createResponse.json();
    console.log(`✅ Élève créé`);
    console.log(`   created_by: ${createData.student.created_by}`);
    
    console.log('\n=== Vérifiez les logs du backend pour voir req.user ===');
    
  } catch (error) {
    console.log('❌ ERREUR:');
    console.log(error.message);
  }
}

testReqUser().then(() => process.exit(0));