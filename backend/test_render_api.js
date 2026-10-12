async function testRenderAPI() {
  console.log('Testing Render API availability...\n');

  try {
    const response = await fetch('https://ecole-primaire-mont-sinai.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'Bayalalandry',
        password: 'secretary123',
      }),
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Render API is working');
    } else {
      console.log('\n❌ Render API returned error');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRenderAPI();
