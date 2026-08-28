const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const backupService = {
  // Exporter toutes les données de l'école
  async exportBackup(token: string): Promise<Blob> {
    const response = await fetch(`${API_URL}/backup/export`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'export de la sauvegarde');
    }

    return response.blob();
  },
};
