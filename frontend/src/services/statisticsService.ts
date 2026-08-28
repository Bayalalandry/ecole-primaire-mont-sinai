const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const statisticsService = {
  // Récupérer les statistiques globales
  async getGlobalStatistics(filters: { schoolYear?: string; period?: string; startDate?: string; endDate?: string }, token: string) {
    const params = new URLSearchParams();
    if (filters.schoolYear) params.append('schoolYear', filters.schoolYear);
    if (filters.period) params.append('period', filters.period);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_URL}/statistics?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }

    return response.json();
  },
};
