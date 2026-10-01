import { API_URL } from '../config/apiConfig';

export const teachersManagementService = {
  // Lister tous les enseignants
  async getAllTeachers(token: string): Promise<any> {
    const response = await fetch(`${API_URL}/teachers-management`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des enseignants');
    }

    return response.json();
  },

  // Créer un enseignant
  async createTeacher(teacherData: any, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/teachers-management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(teacherData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création de l\'enseignant');
    }

    return response.json();
  },

  // Mettre à jour un enseignant
  async updateTeacher(id: string, teacherData: any, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/teachers-management/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(teacherData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la modification de l\'enseignant');
    }

    return response.json();
  },

  // Supprimer un enseignant
  async deleteTeacher(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/teachers-management/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression de l\'enseignant');
    }
  },

  // Fixer le salaire d'un enseignant
  async setTeacherSalary(teacherId: string, schoolYearId: string, fixedSalary: number, notes?: string, token?: string): Promise<any> {
    const response = await fetch(`${API_URL}/teachers-management/${teacherId}/salary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ schoolYearId, fixedSalary, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la fixation du salaire');
    }

    return response.json();
  },

  // Lister les salaires des enseignants
  async getTeacherSalaries(schoolYearId: string, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/teachers-management/salaries?schoolYearId=${schoolYearId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des salaires');
    }

    return response.json();
  },

  // Enregistrer un paiement de salaire
  async payTeacherSalary(teacherId: string, salaryId: string, schoolYearId: string, amount: number, paymentMethod: string, notes?: string, token?: string): Promise<any> {
    const response = await fetch(`${API_URL}/teachers-management/${teacherId}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ salaryId, schoolYearId, amount, paymentMethod, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors du paiement');
    }

    return response.json();
  },

  // Lister les paiements de salaire
  async getTeacherSalaryPayments(schoolYearId: string, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/teachers-management/payments?schoolYearId=${schoolYearId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des paiements');
    }

    return response.json();
  },

  // Obtenir le résumé des salaires
  async getTeacherSalarySummary(schoolYearId: string, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/teachers-management/salaries/summary?schoolYearId=${schoolYearId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération du résumé');
    }

    return response.json();
  },
};
