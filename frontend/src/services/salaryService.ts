const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const salaryService = {
  // Récupérer le résumé des salaires d'un enseignant
  getTeacherSalarySummary: async (teacherId: string, token: string, schoolYear?: string) => {
    const params = new URLSearchParams();
    if (schoolYear) params.append('schoolYear', schoolYear);

    const response = await fetch(`${API_URL}/salaries/summary/teacher/${teacherId}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération du résumé des salaires');
    }

    return response.json();
  },

  // Récupérer l'historique des versements de salaire d'un enseignant
  getTeacherPayments: async (teacherId: string, token: string, schoolYear?: string) => {
    const params = new URLSearchParams();
    if (schoolYear) params.append('schoolYear', schoolYear);

    const response = await fetch(`${API_URL}/salaries/payments/teacher/${teacherId}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des versements');
    }

    return response.json();
  },

  // Récupérer tous les salaires (pour SalaryPage)
  getSalaries: async (token: string, schoolYear?: string) => {
    const params = new URLSearchParams();
    if (schoolYear) params.append('schoolYear', schoolYear);

    const response = await fetch(`${API_URL}/salaries?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des salaires');
    }

    return response.json();
  },

  // Récupérer tous les enseignants
  getAllTeachers: async (token: string) => {
    const response = await fetch(`${API_URL}/auth/teachers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des enseignants');
    }

    return response.json();
  },

  // Récupérer tous les paiements de salaire (pour SalaryPage)
  getSalaryPayments: async (token: string, filters?: { schoolYear?: string; paymentMonth?: string }) => {
    const params = new URLSearchParams();
    if (filters?.schoolYear) params.append('schoolYear', filters.schoolYear);
    if (filters?.paymentMonth) params.append('paymentMonth', filters.paymentMonth);

    const response = await fetch(`${API_URL}/salaries/payments?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des paiements');
    }

    return response.json();
  },

  // Récupérer les impayés de salaire (pour SalaryPage)
  getSalaryOutstanding: async (token: string, filters?: { schoolYear?: string; paymentMonth?: string }) => {
    const params = new URLSearchParams();
    if (filters?.schoolYear) params.append('schoolYear', filters.schoolYear);
    if (filters?.paymentMonth) params.append('paymentMonth', filters.paymentMonth);

    const response = await fetch(`${API_URL}/salaries/outstanding?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des impayés');
    }

    return response.json();
  },

  // Créer un salaire (pour SalaryPage)
  createSalary: async (salaryData: any, token: string) => {
    const response = await fetch(`${API_URL}/salaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(salaryData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création du salaire');
    }

    return response.json();
  },

  // Créer un paiement de salaire (pour SalaryPage)
  createSalaryPayment: async (paymentData: any, token: string) => {
    const response = await fetch(`${API_URL}/salaries/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création du paiement');
    }

    return response.json();
  },

  // Annuler un paiement de salaire (pour SalaryPage)
  cancelSalaryPayment: async (paymentId: string, token: string) => {
    const response = await fetch(`${API_URL}/salaries/payments/${paymentId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'annulation du paiement');
    }

    return response.json();
  },
};
