const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const teacherService = {
  // Récupérer un enseignant par ID
  getTeacherById: async (id: string, token: string) => {
    const response = await fetch(`${API_URL}/teachers/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération de l\'enseignant');
    }

    return response.json();
  },

  // Lister tous les enseignants
  getTeachers: async (token: string) => {
    const response = await fetch(`${API_URL}/teachers`, {
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
};
