const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testJWTDecode() {
  console.log('=== Test décodage JWT ===\n');

  // Simuler le token pour bayala steve
  const userId = '34b94628-d3e9-41da-a01d-7d49dc970f26';
  const username = 'bayala_steve';
  const role = 'teacher';

  const token = jwt.sign(
    {
      id: userId,
      username: username,
      role: role,
    },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '24h' }
  );

  console.log('Token généré:', token.substring(0, 50) + '...');

  // Décoder le token
  const decoded = jwt.decode(token);
  console.log('Token décodé:', decoded);

  // Vérifier avec le secret
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    console.log('Token vérifié:', verified);
  } catch (error) {
    console.error('Erreur de vérification:', error.message);
  }
}

testJWTDecode().then(() => process.exit(0));
