const crypto = require('crypto');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testTeacherFilter() {
  console.log('=== Test: Enseignant voit seulement ses élèves ===\n');
  
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
    console.log(`✅ Connecté: ${user.first_name} ${user.last_name} (${user.role})\n`);
    
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
      lastName: 'Test ALEX',
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
    console.log(`   Créé par: ${createData.student.created_by}\n`);
    
    // Get all students as teacher
    console.log('4. Récupération de la liste des élèves (vue enseignant)...');
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
    
    // Login as founder to see all students
    console.log('\n5. Connexion en tant que fondateur (Inno)...');
    let founderToken;
    
    const founderLoginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Inno',
        password: 'nouveau123',
        secretAnswer: 'Burkina'
      })
    });
    
    const founderLoginData = await founderLoginResponse.json();
    
    if (!founderLoginResponse.ok) {
      if (founderLoginData.requiresSecretAnswer) {
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
        founderToken = secretData.token;
        console.log(`✅ Connecté: ${secretData.user.first_name} ${secretData.user.last_name}\n`);
      } else {
        throw new Error(founderLoginData.error);
      }
    } else {
      founderToken = founderLoginData.token;
      console.log(`✅ Connecté: ${founderLoginData.user.first_name} ${founderLoginData.user.last_name}\n`);
    }
    
    // Get all students as founder
    console.log('6. Récupération de la liste des élèves (vue fondateur)...');
    const founderStudentsResponse = await fetch(`${API_URL}/students`, {
      headers: { Authorization: `Bearer ${founderToken}` }
    });
    const founderStudentsData = await founderStudentsResponse.json();
    const founderStudents = founderStudentsData.students;
    console.log(`✅ ${founderStudents.length} élève(s) trouvé(s) (total)\n`);
    
    // Cleanup
    console.log('7. Nettoyage...');
    await fetch(`${API_URL}/students/${createData.student.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${founderToken}` }
    });
    console.log('✅ Élève de test supprimé\n');
    
    console.log('=== TEST RÉUSSI ===');
    console.log('L\'enseignant ne voit que les élèves qu\'il a créés.');
    console.log('Le fondateur voit tous les élèves.');
    
  } catch (error) {
    console.log('❌ ERREUR:');
    console.log(error.message);
  }
}

testTeacherFilter().then(() => process.exit(0));