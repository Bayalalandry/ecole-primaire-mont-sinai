import { API_URL } from '../config/apiConfig';

export const secretaryService = {
  // Récupérer un secrétaire par ID
  getSecretaryById: async (id: string, token: string) => {
    const response = await fetch(`${API_URL}/secretaries/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération du secrétaire');
    }

    return response.json();
  },

  // Lister tous les secrétaires
  getSecretaries: async (token: string) => {
    const response = await fetch(`${API_URL}/secretaries`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des secrétaires');
    }

    return response.json();
  },
};
