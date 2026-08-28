const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const expenseService = {
  // Récupérer toutes les dépenses avec filtres
  async getExpenses(filters: { category?: string; startDate?: string; endDate?: string }, token: string) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_URL}/expenses?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des dépenses');
    }

    return response.json();
  },

  // Récupérer les statistiques des dépenses
  async getStatistics(filters: { category?: string; startDate?: string; endDate?: string }, token: string) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_URL}/expenses/statistics?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }

    return response.json();
  },

  // Ajouter une nouvelle dépense
  async addExpense(expense: any, token: string) {
    const response = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(expense),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'ajout de la dépense');
    }

    return response.json();
  },

  // Modifier une dépense
  async updateExpense(id: string, expense: any, token: string) {
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(expense),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la modification de la dépense');
    }

    return response.json();
  },

  // Supprimer une dépense
  async deleteExpense(id: string, token: string) {
    const response = await fetch(`${API_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression de la dépense');
    }

    return response.json();
  },
};
