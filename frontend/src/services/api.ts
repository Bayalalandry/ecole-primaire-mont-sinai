// Pour le développement local: utiliser localhost
// Pour la production: définir VITE_API_URL dans les variables d'environnement de Vercel
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  // Méthode générique pour les requêtes authentifiées
  async authenticatedRequest(endpoint: string, options: RequestInit = {}, token: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur de requête');
    }

    return response.json();
  },
};
