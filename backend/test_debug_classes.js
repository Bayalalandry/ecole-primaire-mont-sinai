const crypto = require('crypto');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testDebugClasses() {
  console.log('=== Debug: Classes ===\n');
  
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
    console.log('Token obtained\n');
    
    // Get classes
    const classesResponse = await fetch(`${API_URL}/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Classes response status:', classesResponse.status);
    const classesData = await classesResponse.json();
    console.log('Classes data:', JSON.stringify(classesData, null, 2));
    
  } catch (error) {
    console.log('❌ ERREUR:', error.message);
  }
}

testDebugClasses().then(() => process.exit(0));