async function testDirectorStudentsLoading() {
  try {
    console.log('Test du chargement des élèves pour le directeur...');

    // 1. Connecter comme directeur
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Directeur',
        password: 'nouveau123'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.error('Erreur de connexion directeur:', error);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Connexion directeur réussie');
    console.log('User:', loginData.user);

    // 2. Récupérer les classes du directeur
    const schoolYear = '2026-2027';
    const classesResponse = await fetch(`http://localhost:5000/api/passage/my-classes?schoolYear=${schoolYear}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!classesResponse.ok) {
      const error = await classesResponse.json();
      console.error('Erreur lors de la récupération des classes:', error);
      return;
    }

    const classesData = await classesResponse.json();
    console.log('✅ Classes du directeur:', classesData);

    if (!classesData.classes || classesData.classes.length === 0) {
      console.log('❌ Aucune classe assignée au directeur');
      return;
    }

    const cp1Class = classesData.classes.find(c => c.name === 'CP1');
    if (!cp1Class) {
      console.log('❌ Classe CP1 non trouvée dans les classes du directeur');
      return;
    }

    console.log('✅ Classe CP1 trouvée, ID:', cp1Class.id);

    // 3. Tester le chargement des élèves pour CP1
    const studentsResponse = await fetch(`http://localhost:5000/api/passage/students/${cp1Class.id}?schoolYear=${schoolYear}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Status response:', studentsResponse.status);

    if (!studentsResponse.ok) {
      const error = await studentsResponse.json();
      console.error('❌ Erreur lors du chargement des élèves:', error);
      return;
    }

    const studentsData = await studentsResponse.json();
    console.log('✅ Élèves chargés:', studentsData);
    console.log('Nombre d\'élèves:', studentsData.students?.length || 0);

  } catch (error) {
    console.error('Erreur inattendue:', error);
  }
}

testDirectorStudentsLoading();