const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  console.log('=== TEST TUITION PAYMENT DIRECT ===');

  try {
    // 1. Récupérer un élève existant
    const { data: students } = await supabase
      .from('students')
      .select('id, first_name, last_name, matricule, current_class_id')
      .limit(1);

    if (!students || students.length === 0) {
      console.log('No students found');
      return;
    }

    const student = students[0];
    console.log('Student:', student);

    // 2. Récupérer un user fondateur
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'founder')
      .limit(1);

    if (!users || users.length === 0) {
      console.log('No founder found');
      return;
    }

    const founder = users[0];
    console.log('Founder:', founder.id);

    // 3. Enregistrer un versement directement dans Supabase
    const receiptNumber = `REC${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const paymentDate = new Date().toISOString().split('T')[0];
    const paymentDateObj = new Date(paymentDate);
    const month = paymentDateObj.getMonth() + 1;
    const trimester = (month >= 9 || month <= 11) ? 1 : (month >= 12 || month <= 2) ? 2 : 3;

    const { data: payment, error } = await supabase
      .from('tuition_payments')
      .insert({
        student_id: student.id,
        amount: 5000,
        payment_date: paymentDate,
        trimester: trimester,
        receipt_number: receiptNumber,
        created_by: founder.id,
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Payment failed:', error);
    } else {
      console.log('✅ Payment created successfully');
      console.log('Receipt number:', payment.receipt_number);
    }

    // 4. Vérifier que le versement existe
    const { data: payments } = await supabase
      .from('tuition_payments')
      .select('*')
      .eq('student_id', student.id);

    console.log('Payments for student:', payments?.length || 0);

  } catch (error) {
    console.error('Error:', error);
  }
})();
