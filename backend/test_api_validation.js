const fetch = require('node-fetch');

async function testApiValidation() {
  console.log('=== TEST DE VALIDATION API ===\n');

  // Login as founder
  const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Inno',
      password: 'password123'
    })
  });

  const loginData = await loginResponse.json();
  const token = loginData.token;
  console.log('✓ Connexion réussie\n');

  // Create salary
  console.log('1. Création d\'un salaire de 50 000 XOF...');
  const salaryResponse = await fetch('http://localhost:5000/api/salaries/salaries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      teacherId: '0a322338-d85e-492b-9e98-952744e9e4aa',
      schoolYear: '2026-2027',
      monthlyAmount: 50000,
      effectiveDate: '2026-08-19'
    })
  });

  const salaryData = await salaryResponse.json();
  console.log(`✓ Salaire créé: ${salaryData.salaryId}\n`);

  // First payment
  console.log('2. Premier versement de 30 000 XOF...');
  const payment1Response = await fetch('http://localhost:5000/api/salaries/salary-payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      teacherId: '0a322338-d85e-492b-9e98-952744e9e4aa',
      salaryId: salaryData.salaryId,
      amount: 30000,
      paymentMonth: '2026-08-01',
      paymentDate: '2026-08-19',
      schoolYear: '2026-2027'
    })
  });

  const payment1Data = await payment1Response.json();
  console.log(`✓ Versement enregistré: ${payment1Data.payment.receipt_number}\n`);

  // Attempt overpayment
  console.log('3. Tentative de versement de 25 000 XOF (dépasserait le salaire)...');
  const overPaymentResponse = await fetch('http://localhost:5000/api/salaries/salary-payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      teacherId: '0a322338-d85e-492b-9e98-952744e9e4aa',
      salaryId: salaryData.salaryId,
      amount: 25000,
      paymentMonth: '2026-08-01',
      paymentDate: '2026-08-19',
      schoolYear: '2026-2027'
    })
  });

  if (overPaymentResponse.status === 400) {
    const overPaymentData = await overPaymentResponse.json();
    console.log('✓ VERSEMENT BLOQUÉ PAR L\'API');
    console.log(`  Erreur: ${overPaymentData.error}`);
  } else {
    const overPaymentData = await overPaymentResponse.json();
    console.log('⚠ VERSEMENT ACCEPTÉ (validation API insuffisante)');
  }

  // Test exact amount
  console.log('\n4. Versement du montant exact restant (20 000 XOF)...');
  const exactPaymentResponse = await fetch('http://localhost:5000/api/salaries/salary-payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      teacherId: '0a322338-d85e-492b-9e98-952744e9e4aa',
      salaryId: salaryData.salaryId,
      amount: 20000,
      paymentMonth: '2026-08-01',
      paymentDate: '2026-08-19',
      schoolYear: '2026-2027'
    })
  });

  if (exactPaymentResponse.status === 200) {
    const exactPaymentData = await exactPaymentResponse.json();
    console.log('✓ VERSEMENT ACCEPTÉ (montant exact)');
  } else {
    console.log('⚠ VERSEMENT BLOQUÉ (problème de validation)');
  }

  console.log('\n=== RÉSUMÉ ===');
  console.log('Validation API du dépassement: ' + (overPaymentResponse.status === 400 ? '✓ VALIDÉ' : '⚠ ÉCHEC'));
  console.log('Montant exact accepté: ' + (exactPaymentResponse.status === 200 ? '✓ VALIDÉ' : '⚠ ÉCHEC'));
}

testApiValidation();
