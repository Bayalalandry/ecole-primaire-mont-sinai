const crypto = require('crypto');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testFrontendAssign() {
  console.log('=== Test complet assignation classe ===\n');
  
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
    console.log(`✅ Connecté\n`);
    
    // Get teachers
    const teachersResponse = await fetch(`${API_URL}/auth/teachers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const teachersData = await teachersResponse.json();
    
    // Get classes
    const classesResponse = await fetch(`${API_URL}/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const classesData = await classesResponse.json();
    
    const teacherId = teachersData.teachers[0].id;
    const classId = classesData.classes[1].id;
    
    console.log(`Teacher: ${teachersData.teachers[0].first_name} ${teachersData.teachers[0].last_name}`);
    console.log(`Class: ${classesData.classes[1].name}`);
    console.log(`Teacher ID: ${teacherId}`);
    console.log(`Class ID: ${classId}\n`);
    
    // Assign class
    console.log('2. Assignation de classe...');
    const assignResponse = await fetch(`${API_URL}/auth/assign-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ teacherId, classId }),
    });
    
    console.log(`Status: ${assignResponse.status}`);
    const assignData = await assignResponse.json();
    console.log('Response:', JSON.stringify(assignData, null, 2));
    
    if (assignResponse.ok) {
      console.log('\n✅ Classe assignee avec succes');
      
      // Verify assignment
      console.log('\n3. Verification de l\'assignation...');
      const verifyResponse = await fetch(`${API_URL}/auth/teachers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const verifyData = await verifyResponse.json();
      const updatedTeacher = verifyData.teachers.find((t) => t.id === teacherId);
      console.log(`Classe assignee: ${updatedTeacher?.assigned_class}`);
    } else {
      console.log('\n❌ Erreur lors de l\'assignation');
    }
    
  } catch (error) {
    console.log('❌ ERREUR:', error.message);
  }
}

testFrontendAssign().then(() => process.exit(0));