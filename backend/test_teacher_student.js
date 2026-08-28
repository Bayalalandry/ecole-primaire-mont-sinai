const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

async function testTeacherCreateStudent() {
  console.log('=== Test: Enseignant crée un élève ===\n');
  
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
    console.log(`✅ ${classes.length} classes trouvées`);
    const classId = classes[0].id;
    console.log(`Classe utilisée: ${classes[0].name} (${classId})\n`);
    
    // Create student
    console.log('3. Création d\'un élève...');
    const studentData = {
      firstName: 'Élève',
      lastName: 'Test Enseignant',
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
    
    if (!createResponse.ok) {
      throw new Error(`Erreur création: ${createData.message || createData.error}`);
    }
    
    console.log(`✅ Élève créé avec succès!`);
    console.log(`ID: ${createData.student.id}`);
    console.log(`Matricule: ${createData.student.matricule}`);
    console.log(`Identifiant unique: ${createData.student.unique_identifier}\n`);
    
    // Cleanup
    console.log('4. Nettoyage...');
    await fetch(`${API_URL}/students/${createData.student.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Élève supprimé\n');
    
    console.log('=== TEST RÉUSSI ===');
    console.log('L\'enseignant peut créer des élèves via l\'API');
    
  } catch (error) {
    console.log('❌ ERREUR:');
    console.log(error.message);
  }
}

testTeacherCreateStudent().then(() => process.exit(0));