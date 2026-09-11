import { API_URL } from '../config/apiConfig';

export const secretaryDashboardService = {
  // Récupérer les statistiques du tableau de bord secrétaire
  async getSecretaryStats(token: string) {
    const response = await fetch(`${API_URL}/dashboard/secretary/dashboard-stats`, {
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
