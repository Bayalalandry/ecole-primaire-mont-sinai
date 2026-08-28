const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const schoolYearService = {
  // Récupérer l'année scolaire actuelle depuis la base de données
  async getCurrentSchoolYear(token: string): Promise<string> {
    const response = await fetch(`${API_URL}/classes/school-years/current`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération de l\'année scolaire');
    }

    const data = await response.json();
    return data.year_label;
  },
};
