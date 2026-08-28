const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testFullAPI() {
  console.log('=== Testing Full API Call ===');
  
  try {
    // 1. Get a valid user for token generation
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (!users || users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    const user = users[0];
    console.log('Using user:', user.username, user.role);
    
    // 2. Generate a JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );
    console.log('Generated token:', token.substring(0, 20) + '...');
    
    // 3. Get a class ID
    const { data: classes } = await supabase.from('classes').select('*').limit(1);
    const classId = classes?.[0]?.id;
    console.log('Using class ID:', classId);
    
    // 4. Call the API
    const response = await fetch('http://localhost:5000/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: 'API',
        lastName: 'Test',
        classId: classId,
        schoolYear: '2024-2025'
      })
    });
    
    console.log('API Response status:', response.status);
    const data = await response.json();
    console.log('API Response data:', data);
    
    if (response.status === 201) {
      console.log('✅ API call successful!');
      // Clean up
      if (data.student?.id) {
        await supabase.from('students').delete().eq('id', data.student.id);
        console.log('Test student cleaned up');
      }
    } else {
      console.log('❌ API call failed');
    }
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testFullAPI().then(() => process.exit(0));