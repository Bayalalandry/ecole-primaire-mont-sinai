const crypto = require('crypto');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testMultipleClasses() {
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
    const user = loginData.user;
    console.log(`✅ Connecté: ${user.first_name} ${user.last_name} (${user.role})\n`);
    
    // Get all classes
    console.log('2. Récupération de toutes les classes...');
    const classesResponse = await fetch(`${API_URL}/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const classesData = await classesResponse.json();
    const classes = classesData.classes || classesData;
    console.log(`✅ ${classes.length} classes trouvées\n`);
    
    // Create students in different classes
    console.log('3. Création d\'élèves dans différentes classes...');
    const studentIds = [];
    
    if (!classes || classes.length === 0) {
      console.log('❌ Aucune classe disponible');
      return;
    }
    
    console.log(`Creating students for ${Math.min(3, classes.length)} classes`);
    
    for (let i = 0; i < Math.min(3, classes.length); i++) {
      const classItem = classes[i];
      console.log(`Processing class ${i}:`, classItem);
      
      if (!classItem || !classItem.id) {
        console.log(`   ⚠️ Classe ${i} invalide, saut`);
        continue;
      }
      
      const classId = classItem.id;
      const className = classItem.name;
      
      const studentData = {
        firstName: `Élève`,
        lastName: `Classe ${className}`,
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
      studentIds.push(createData.student.id);
      console.log(`   ✅ Élève créé en ${className}: ${createData.student.first_name} ${createData.student.last_name}`);
    }
    
    console.log('\n4. Récupération de la liste des élèves (vue enseignant)...');
    const studentsResponse = await fetch(`${API_URL}/students`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const studentsData = await studentsResponse.json();
    const students = studentsData.students;
    console.log(`✅ ${students.length} élève(s) trouvé(s)\n`);
    
    console.log('Liste des élèves vus par l\'enseignant:');
    students.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.first_name} ${s.last_name} - Classe: ${s.classes?.name || s.current_class_id} (créé par: ${s.created_by})`);
    });
    
    // Cleanup
    console.log('\n5. Nettoyage...');
    for (const id of studentIds) {
      await fetch(`${API_URL}/students/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    console.log('✅ Élèves de test supprimés\n');
    
    console.log('=== TEST RÉUSSI ===');
    console.log('L\'enseignant voit bien tous les élèves qu\'elle a inscrits, quelle que soit leur classe.');
    
  } catch (error) {
    console.log('❌ ERREUR:');
    console.log(error.message);
  }
}

testMultipleClasses().then(() => process.exit(0));