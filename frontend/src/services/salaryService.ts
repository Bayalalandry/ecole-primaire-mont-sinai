const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================
// GESTION DES SALAIRES
// ============================================

export const salaryService = {
  // Créer ou mettre à jour un salaire
  async createSalary(salaryData: any, token: string) {
    const response = await fetch(`${API_URL}/salaries/salaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(salaryData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'enregistrement du salaire');
    }

    return response.json();
  },

  // Récupérer tous les salaires
  async getSalaries(token: string, schoolYear?: string) {
    const url = schoolYear
      ? `${API_URL}/salaries/salaries?schoolYear=${schoolYear}`
      : `${API_URL}/salaries/salaries`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des salaires');
    }

    return response.json();
  },

  // ============================================
  // GESTION DES PAIEMENTS DE SALAIRES
  // ============================================

  // Enregistrer un paiement de salaire
  async createSalaryPayment(paymentData: any, token: string) {
    const response = await fetch(`${API_URL}/salaries/salary-payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'enregistrement du paiement');
    }

    return response.json();
  },

  // Récupérer tous les paiements de salaires
  async getSalaryPayments(token: string, filters?: { schoolYear?: string; teacherId?: string; paymentMonth?: string }) {
    const params = new URLSearchParams();
    if (filters?.schoolYear) params.append('schoolYear', filters.schoolYear);
    if (filters?.teacherId) params.append('teacherId', filters.teacherId);
    if (filters?.paymentMonth) params.append('paymentMonth', filters.paymentMonth);

    const url = `${API_URL}/salaries/salary-payments${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des paiements');
    }

    return response.json();
  },

  // Annuler un paiement de salaire
  async cancelSalaryPayment(paymentId: string, token: string) {
    const response = await fetch(`${API_URL}/salaries/salary-payments/${paymentId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'annulation du paiement');
    }

    return response.json();
  },

  // ============================================
  // CALCUL DES SOLDES
  // ============================================

  // Calculer le solde d'un enseignant
  async getSalaryBalance(teacherId: string, token: string, paymentMonth?: string) {
    const url = paymentMonth
      ? `${API_URL}/salaries/salary-balance/teacher/${teacherId}?paymentMonth=${paymentMonth}`
      : `${API_URL}/salaries/salary-balance/teacher/${teacherId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors du calcul du solde');
    }

    return response.json();
  },

  // Récupérer les impayés de salaires
  async getSalaryOutstanding(token: string, filters?: { paymentMonth?: string }) {
    const params = new URLSearchParams();
    if (filters?.paymentMonth) params.append('paymentMonth', filters.paymentMonth);

    const url = `${API_URL}/salaries/salary-outstanding${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des impayés');
    }

    return response.json();
  },
};
