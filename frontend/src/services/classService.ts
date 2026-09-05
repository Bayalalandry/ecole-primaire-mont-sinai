import { API_URL } from '../config/apiConfig';

export const classService = {
  async getClasses(token: string): Promise<{ classes: any[] }> {
    const response = await fetch(`${API_URL}/classes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des classes');
    }

    return response.json();
  },
};
