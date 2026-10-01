import { supabase } from './supabase';

export const teachersService = {
  // Lister tous les enseignants
  async getAllTeachers(): Promise<any> {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { teachers: data };
  },

  // Créer un enseignant
  async createTeacher(teacherData: any): Promise<any> {
    const { data, error } = await supabase
      .from('teachers')
      .insert(teacherData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour un enseignant
  async updateTeacher(id: string, teacherData: any): Promise<any> {
    const { data, error } = await supabase
      .from('teachers')
      .update(teacherData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Supprimer un enseignant
  async deleteTeacher(id: string): Promise<void> {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Fixer le salaire d'un enseignant
  async setTeacherSalary(teacherId: string, schoolYearId: string, fixedSalary: number, notes?: string): Promise<any> {
    const { data, error } = await supabase
      .from('teacher_salaries')
      .upsert({
        teacher_id: teacherId,
        school_year_id: schoolYearId,
        fixed_salary: fixedSalary,
        status: 'active',
        effective_date: new Date().toISOString().split('T')[0],
        notes: notes || null,
      }, {
        onConflict: 'teacher_id,school_year_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Lister les salaires des enseignants
  async getTeacherSalaries(schoolYearId?: string): Promise<any> {
    let query = supabase
      .from('teacher_salaries')
      .select(`
        *,
        teachers (
          id,
          first_name,
          last_name,
          subject,
          status
        )
      `);

    if (schoolYearId) {
      query = query.eq('school_year_id', schoolYearId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { salaries: data };
  },

  // Enregistrer un paiement de salaire
  async payTeacherSalary(teacherId: string, salaryId: string, schoolYearId: string, amount: number, paymentMethod: string = 'cash', notes?: string): Promise<any> {
    const receiptNumber = `PAY${Date.now()}`;
    
    const { data, error } = await supabase
      .from('teacher_salary_payments')
      .insert({
        teacher_id: teacherId,
        salary_id: salaryId,
        school_year_id: schoolYearId,
        amount: amount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        receipt_number: receiptNumber,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Lister les paiements de salaire
  async getTeacherSalaryPayments(schoolYearId?: string): Promise<any> {
    let query = supabase
      .from('teacher_salary_payments')
      .select(`
        *,
        teachers (
          id,
          first_name,
          last_name
        )
      `);

    if (schoolYearId) {
      query = query.eq('school_year_id', schoolYearId);
    }

    const { data, error } = await query.order('payment_date', { ascending: false });

    if (error) throw error;
    return { payments: data };
  },

  // Obtenir le résumé des salaires (total payé, total dû, etc.)
  async getTeacherSalarySummary(schoolYearId: string): Promise<any> {
    // Récupérer tous les salaires fixes
    const { data: salaries, error: salariesError } = await supabase
      .from('teacher_salaries')
      .select('id, teacher_id, fixed_salary')
      .eq('school_year_id', schoolYearId)
      .eq('status', 'active');

    if (salariesError) throw salariesError;

    // Récupérer tous les paiements
    const { data: payments, error: paymentsError } = await supabase
      .from('teacher_salary_payments')
      .select('amount')
      .eq('school_year_id', schoolYearId);

    if (paymentsError) throw paymentsError;

    const totalExpected = salaries?.reduce((sum, s) => sum + Number(s.fixed_salary), 0) || 0;
    const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const totalOutstanding = totalExpected - totalPaid;

    return {
      totalExpected,
      totalPaid,
      totalOutstanding,
      activeTeachersCount: salaries?.length || 0,
    };
  },
};
