const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface TuitionRate {
  id: string;
  class_id: string;
  school_year: string;
  amount: number;
  effective_date: string;
  created_at: string;
  updated_at: string;
  classes?: {
    name: string;
  };
}

export interface TuitionPayment {
  id: string;
  student_id: string;
  school_year: string;
  amount: number;
  payment_date: string;
  trimester: number;
  receipt_number: string;
  cancelled: boolean;
  cancelled_by?: string;
  cancelled_at?: string;
  created_by: string;
  created_at: string;
  students?: {
    first_name: string;
    last_name: string;
    matricule: string;
    current_class_id?: string;
    classes?: {
      name: string;
    };
  };
  users?: {
    first_name: string;
    last_name: string;
  };
}

export interface StudentBalance {
  studentId: string;
  classId: string;
  className: string;
  schoolYear: string;
  totalDue: number;
  totalPaid: number;
  remaining: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
}

export interface OutstandingPayment {
  studentId: string;
  studentName: string;
  matricule: string;
  classId: string;
  className: string;
  totalDue: number;
  totalPaid: number;
  remaining: number;
  paymentStatus: 'partial' | 'unpaid';
  lastPaymentDate: string | null;
}

export const tuitionService = {
  // ============================================
  // GESTION DES TARIFS
  // ============================================

  // Créer ou mettre à jour un tarif
  createTuitionRate: async (rateData: {
    classId: string;
    schoolYear: string;
    amount: number;
    effectiveDate: string;
  }, token: string) => {
    const response = await fetch(`${API_URL}/tuition/rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(rateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'enregistrement du tarif');
    }

    return response.json();
  },

  // Récupérer tous les tarifs
  getTuitionRates: async (token: string, schoolYear?: string) => {
    const params = new URLSearchParams();
    if (schoolYear) params.append('schoolYear', schoolYear);

    const response = await fetch(`${API_URL}/tuition/rates?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des tarifs');
    }

    return response.json();
  },

  // Récupérer le tarif actuel pour une classe
  getClassTuitionRate: async (classId: string, token: string, schoolYear?: string) => {
    const params = new URLSearchParams();
    if (schoolYear) params.append('schoolYear', schoolYear);

    const response = await fetch(`${API_URL}/tuition/rates/class/${classId}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération du tarif');
    }

    return response.json();
  },

  // ============================================
  // GESTION DES VERSEMENTS
  // ============================================

  // Enregistrer un versement
  createTuitionPayment: async (paymentData: {
    studentId: string;
    schoolYear: string;
    amount: number;
    paymentDate: string;
  }, token: string) => {
    const response = await fetch(`${API_URL}/tuition/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'enregistrement du versement');
    }

    return response.json();
  },

  // Récupérer tous les versements
  getTuitionPayments: async (token: string, filters?: {
    schoolYear?: string;
    studentId?: string;
    classId?: string;
    trimester?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.schoolYear) params.append('schoolYear', filters.schoolYear);
    if (filters?.studentId) params.append('studentId', filters.studentId);
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.trimester) params.append('trimester', filters.trimester.toString());

    const response = await fetch(`${API_URL}/tuition/payments?${params.toString()}`, {
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

  // Récupérer l'historique des versements d'un élève
  getStudentTuitionPayments: async (studentId: string, token: string, schoolYear?: string) => {
    const params = new URLSearchParams();
    if (schoolYear) params.append('schoolYear', schoolYear);

    const response = await fetch(`${API_URL}/tuition/payments/student/${studentId}?${params.toString()}`, {
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

  // Annuler un versement
  cancelTuitionPayment: async (paymentId: string, token: string) => {
    const response = await fetch(`${API_URL}/tuition/payments/${paymentId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'annulation du versement');
    }

    return response.json();
  },

  // ============================================
  // CALCUL DES SOLDES
  // ============================================

  // Calculer la situation financière d'un élève
  getStudentBalance: async (studentId: string, token: string, schoolYear?: string) => {
    const params = new URLSearchParams();
    if (schoolYear) params.append('schoolYear', schoolYear);

    const response = await fetch(`${API_URL}/tuition/balance/student/${studentId}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors du calcul du solde');
    }

    return response.json();
  },

  // ============================================
  // LISTE DES IMPAYÉS
  // ============================================

  // Récupérer la liste des impayés
  getOutstandingPayments: async (token: string, filters?: {
    schoolYear?: string;
    classId?: string;
    trimester?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.schoolYear) params.append('schoolYear', filters.schoolYear);
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.trimester) params.append('trimester', filters.trimester.toString());

    const response = await fetch(`${API_URL}/tuition/outstanding?${params.toString()}`, {
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

  // ============================================
  // GESTION DES TRIMESTRES
  // ============================================

  // Récupérer les trimestres pour une année scolaire
  getTrimesters: async (token: string, schoolYear?: string) => {
    const params = new URLSearchParams();
    if (schoolYear) params.append('schoolYear', schoolYear);

    const response = await fetch(`${API_URL}/tuition/trimesters?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des trimestres');
    }

    return response.json();
  },

  // Créer ou mettre à jour des trimestres
  saveTrimesters: async (data: {
    schoolYear: string;
    trimesters: Array<{
      trimester_number: number;
      start_date: string;
      end_date: string;
    }>;
  }, token: string) => {
    const response = await fetch(`${API_URL}/tuition/trimesters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'enregistrement des trimestres');
    }

    return response.json();
  },
};
