const fetch = require('node-fetch');

async function setDirectorPassword() {
  try {
    console.log('Définition du mot de passe du directeur via API...');

    // D'abord connecter comme fondateur pour obtenir un token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Inno',
        password: 'nouveau123',
        secretAnswer: 'Ouaga'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.error('Erreur de connexion fondateur:', error);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Connexion fondateur réussie');

    // Récupérer l'ID du directeur
    const usersResponse = await fetch('http://localhost:5000/api/auth/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!usersResponse.ok) {
      console.error('Erreur lors de la récupération des utilisateurs');
      return;
    }

    const usersData = await usersResponse.json();
    const director = usersData.users.find(u => u.username === 'Directeur');

    if (!director) {
      console.error('Directeur non trouvé');
      return;
    }

    console.log('Directeur trouvé, ID:', director.id);

    // Mettre à jour le mot de passe du directeur via l'API de réinitialisation
    const resetResponse = await fetch(`http://localhost:5000/api/auth/reset-password/${director.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        newPassword: 'directeur123'
      })
    });

    if (!resetResponse.ok) {
      const error = await resetResponse.json();
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      return;
    }

    console.log('✅ Succès ! Mot de passe du directeur défini');
    console.log('Username: Directeur');
    console.log('Mot de passe: directeur123');

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

setDirectorPassword();