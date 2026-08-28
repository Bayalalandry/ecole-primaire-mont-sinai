const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// GESTION DES MOYENNES ANNUELLES (ENSEIGNANT)
// ============================================

export const passageService = {
  // Récupérer les classes d'un enseignant
  async getMyClasses(schoolYear: string, token: string) {
    const response = await fetch(`${API_URL}/passage/my-classes?schoolYear=${schoolYear}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des classes');
    }

    return response.json();
  },

  // Récupérer les élèves d'une classe pour la saisie des moyennes
  async getStudentsForGrades(classId: string, schoolYear: string, token: string) {
    const response = await fetch(`${API_URL}/passage/students/${classId}?schoolYear=${schoolYear}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des élèves');
    }

    return response.json();
  },

  // Enregistrer une moyenne annuelle pour un élève
  async saveGrade(studentId: string, schoolYear: string, finalGrade: number, token: string) {
    const response = await fetch(`${API_URL}/passage/grades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ studentId, schoolYear, finalGrade }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'enregistrement de la moyenne');
    }

    return response.json();
  },

  // Récupérer toutes les moyennes d'une classe
  async getGrades(classId: string, schoolYear: string, token: string) {
    const response = await fetch(`${API_URL}/passage/grades/${classId}?schoolYear=${schoolYear}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des moyennes');
    }

    return response.json();
  },

  // ============================================
  // GESTION DES SEUILS DE PASSAGE (FONDATEUR)
  // ============================================

  // Récupérer tous les seuils de passage
  async getPassingGrades(token: string) {
    const response = await fetch(`${API_URL}/passage/passing-grades`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des seuils');
    }

    return response.json();
  },

  // Mettre à jour le seuil de passage d'une classe
  async updatePassingGrade(classId: string, passingGrade: number, token: string) {
    const response = await fetch(`${API_URL}/passage/passing-grades/${classId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ passingGrade }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour du seuil');
    }

    return response.json();
  },

  // ============================================
  // PROPOSITION DE STATUT DE PASSAGE
  // ============================================

  // Générer les propositions de passage pour une classe
  async generateProposals(classId: string, schoolYear: string, token: string) {
    const response = await fetch(`${API_URL}/passage/proposals/${classId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ schoolYear }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la génération des propositions');
    }

    return response.json();
  },

  // ============================================
  // VALIDATION DE PASSAGE (FONDATEUR)
  // ============================================

  // Valider le passage pour une classe
  async validatePassage(classId: string, schoolYear: string, decisions: any[], token: string) {
    const response = await fetch(`${API_URL}/passage/validate/${classId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ schoolYear, decisions }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la validation');
    }

    return response.json();
  },

  // Récupérer les décisions de passage pour une classe
  async getDecisions(classId: string, schoolYear: string, token: string) {
    const response = await fetch(`${API_URL}/passage/decisions/${classId}?schoolYear=${schoolYear}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des décisions');
    }

    return response.json();
  },
};
