const crypto = require('crypto');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testUpdateStatus() {
  console.log('=== Test Mise à jour statut enseignant ===\n');
  
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
    
    // Get teachers first
    console.log('2. Récupération des enseignants...');
    const teachersResponse = await fetch(`${API_URL}/auth/teachers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const teachersData = await teachersResponse.json();
    const teacherId = teachersData.teachers[0].id;
    console.log(`Teacher ID: ${teacherId}\n`);
    
    // Update status
    console.log('3. Mise à jour du statut (on_leave)...');
    const updateResponse = await fetch(`${API_URL}/auth/teacher-status/${teacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'on_leave' }),
    });
    
    console.log(`Status: ${updateResponse.status}`);
    const updateData = await updateResponse.json();
    console.log('Response:', JSON.stringify(updateData, null, 2));
    
    if (updateResponse.ok) {
      console.log('\n✅ Statut mis à jour avec succès');
    } else {
      console.log('\n❌ Erreur lors de la mise à jour');
    }
    
  } catch (error) {
    console.log('❌ ERREUR:', error.message);
  }
}

testUpdateStatus().then(() => process.exit(0));