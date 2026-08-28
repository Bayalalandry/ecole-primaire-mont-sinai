const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const directorDashboardService = {
  // Récupérer les statistiques du tableau de bord directeur
  async getDirectorStats(token: string) {
    const response = await fetch(`${API_URL}/dashboard/director/dashboard-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des statistiques');
    }

    return response.json();
  },
};
