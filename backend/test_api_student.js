const testStudentCreation = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Student',
        classId: 'cp1',
        schoolYear: '2024-2025'
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
  } catch (error) {
    console.log('Error:', error.message);
  }
};

testStudentCreation();