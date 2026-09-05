import { API_BASE_URL } from '../config/apiConfig';

export const searchService = {
  // Recherche globale (élèves et enseignants)
  async globalSearch(query: string, token: string) {
    const params = new URLSearchParams();
    if (query) params.append('query', query);

    const response = await fetch(`${API_BASE_URL}/api/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la recherche');
    }

    return response.json();
  },
};
