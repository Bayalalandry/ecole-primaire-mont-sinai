// Using built-in fetch (Node.js 18+)

async function testResetPassword() {
  console.log('=== Test Reset Password ===\n');
  
  try {
    // D'abord se connecter en tant que directeur
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Directeur', password: 'directeur123' })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login status:', loginResponse.status);
    
    if (!loginData.token) {
      console.log('Login failed:', loginData);
      return;
    }
    
    console.log('Token obtained');
    
    // Maintenant tester la réinitialisation de mot de passe
    const resetResponse = await fetch('http://localhost:5000/api/auth/reset-password/0a322338-d85e-492b-9e98-952744e9e4aa', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newPassword: 'test1234' })
    });
    
    console.log('Reset password status:', resetResponse.status);
    
    const resetData = await resetResponse.json();
    console.log('Reset password response:', resetData);
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

testResetPassword().then(() => process.exit(0));