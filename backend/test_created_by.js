const crypto = require('crypto');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testCreatedBy() {
  console.log('=== Test: Vérification du champ created_by ===\n');
  
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
    
    // Get classes
    console.log('2. Récupération des classes...');
    const classesResponse = await fetch(`${API_URL}/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const classesData = await classesResponse.json();
    const classes = classesData.classes;
    const classId = classes[0].id;
    console.log(`✅ ${classes.length} classes trouvées\n`);
    
    // Create a student as teacher
    console.log('3. Création d\'un élève...');
    const studentData = {
      firstName: 'Élève',
      lastName: 'Test CreatedBy',
      dateOfBirth: '2015-05-15',
      gender: 'M',
      parentName: 'Parent Test',
      parentPhone: '70123456',
      parentAddress: 'Adresse Test',
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
    console.log(`✅ Élève créé: ${createData.student.first_name} ${createData.student.last_name}`);
    console.log(`   ID: ${createData.student.id}`);
    console.log(`   Créé par (created_by): ${createData.student.created_by}`);
    console.log(`   Attendu: ${user.id}`);
    
    if (createData.student.created_by === user.id) {
      console.log('   ✅ created_by est correctement enregistré !');
    } else {
      console.log('   ❌ created_by n\'est pas correct (valeur null ou incorrecte)');
    }
    
    // Get all students as teacher
    console.log('\n4. Récupération de la liste des élèves (vue enseignant)...');
    const studentsResponse = await fetch(`${API_URL}/students`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const studentsData = await studentsResponse.json();
    const students = studentsData.students;
    console.log(`✅ ${students.length} élève(s) trouvé(s)`);
    
    if (students.length > 0) {
      students.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.first_name} ${s.last_name} (créé par: ${s.created_by})`);
      });
    }
    
    console.log('\n=== TEST TERMINÉ ===');
    
  } catch (error) {
    console.log('❌ ERREUR:');
    console.log(error.message);
  }
}

testCreatedBy().then(() => process.exit(0));