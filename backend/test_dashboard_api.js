const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testDashboardAPI() {
  console.log('=== Test API Dashboard pour bayala steve ===\n');

  // Simuler la connexion de bayala steve
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('last_name', 'bayala')
    .eq('first_name', 'steve')
    .single();

  if (!user) {
    console.error('❌ bayala steve non trouvé');
    return;
  }

  console.log('✅ bayala steve trouvé');
  console.log(`   ID: ${user.id}\n`);

  // Générer un token JWT
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '24h' }
  );

  console.log('✅ Token JWT généré\n');

  // Tester l'API des stats enseignant
  console.log('=== Test API /api/dashboard/teacher/dashboard-stats ===\n');

  try {
    const response = await fetch('http://localhost:5000/api/dashboard/teacher/dashboard-stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ API Dashboard Stats RÉUSSIE');
      console.log('   Statistiques reçues:');
      console.log(`   - Mes élèves: ${data.totalStudents}`);
      console.log(`   - Moyennes à saisir: ${data.pendingGrades}`);
      console.log(`   - Scolarités en retard: ${data.overdueTuition}\n`);
    } else {
      console.log('❌ API Dashboard Stats ÉCHOUÉE');
      console.log(`   Erreur: ${data.error}\n`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'appel API:', error.message);
  }

  // Tester l'API des classes pour le passage
  console.log('=== Test API /api/passage/my-classes ===\n');

  try {
    const response = await fetch('http://localhost:5000/api/passage/my-classes?schoolYear=2026-2027', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ API My Classes RÉUSSIE');
      console.log('   Classes reçues:');
      if (data.classes && data.classes.length > 0) {
        data.classes.forEach((c, index) => {
          console.log(`   ${index + 1}. ${c.name} (ID: ${c.id})`);
        });
      } else {
        console.log('   Aucune classe trouvée');
      }
      console.log('');
    } else {
      console.log('❌ API My Classes ÉCHOUÉE');
      console.log(`   Erreur: ${data.error}\n`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'appel API:', error.message);
  }

  // Tester l'API /auth/me pour getTeacherInfo
  console.log('=== Test API /api/auth/me ===\n');

  try {
    const response = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ API Auth Me RÉUSSIE');
      console.log('   Teacher info reçue:');
      if (data.user.teacherInfo) {
        console.log(`   - Classes assignées: ${data.user.teacherInfo.assigned_classes?.join(', ') || 'Aucune'}`);
        console.log(`   - Statut: ${data.user.teacherInfo.status}`);
      }
      console.log('');
    } else {
      console.log('❌ API Auth Me ÉCHOUÉE');
      console.log(`   Erreur: ${data.error}\n`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'appel API:', error.message);
  }
}

testDashboardAPI().then(() => process.exit(0));
