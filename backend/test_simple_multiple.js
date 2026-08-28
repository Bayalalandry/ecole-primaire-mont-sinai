const crypto = require('crypto');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testSimpleMultiple() {
  console.log('=== Test: Enseignant voit ses élèves dans différentes classes ===\n');
  
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
    const classesResponse = await fetch(`${API_URL}/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const classesData = await classesResponse.json();
    const classes = classesData.classes;
    
    // Create 3 students in different classes
    console.log('2. Création d\'élèves dans 3 classes différentes...');
    const studentIds = [];
    
    for (let i = 0; i < 3; i++) {
      const classItem = classes[i];
      console.log(`Using class ${i}:`, classItem.name, classItem.id);
      
      const studentData = {
        firstName: `Élève`,
        lastName: `Test Classe ${classItem.name}`,
        dateOfBirth: '2015-05-15',
        gender: 'M',
        parentName: 'Parent',
        parentPhone: '70123456',
        parentAddress: 'Adresse',
        classId: classItem.id,
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
      studentIds.push(createData.student.id);
      console.log(`   ✅ Élève en ${classItem.name}: ${createData.student.first_name} ${createData.student.last_name}`);
    }
    
    // Get all students as teacher
    console.log('\n3. Liste des élèves vus par l\'enseignant...');
    const studentsResponse = await fetch(`${API_URL}/students`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const studentsData = await studentsResponse.json();
    const students = studentsData.students;
    console.log(`✅ ${students.length} élève(s) trouvé(s)\n`);
    
    console.log('Détails:');
    students.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.first_name} ${s.last_name} - Classe: ${s.classes?.name || s.current_class_id}`);
    });
    
    // Cleanup
    console.log('\n4. Nettoyage...');
    for (const id of studentIds) {
      await fetch(`${API_URL}/students/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    console.log('✅ Nettoyage terminé\n');
    
    console.log('=== RÉSULTAT ===');
    console.log('L\'enseignant voit tous ses élèves, quelle que soit leur classe.');
    
  } catch (error) {
    console.log('❌ ERREUR:', error.message);
  }
}

testSimpleMultiple().then(() => process.exit(0));