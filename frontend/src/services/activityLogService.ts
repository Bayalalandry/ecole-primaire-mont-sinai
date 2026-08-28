const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import { tokenStorage } from './authService';

export interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string;
  details: any;
  created_at: string;
  users?: {
    first_name: string;
    last_name: string;
    username: string;
    role: string;
  };
}

export const getActivityLog = async (entityType?: string, limit?: number): Promise<ActivityLog[]> => {
  const token = tokenStorage.getToken();
  if (!token) {
    throw new Error('Non authentifié');
  }

  const params = new URLSearchParams();
  if (entityType) params.append('entityType', entityType);
  if (limit) params.append('limit', limit.toString());

  const response = await fetch(`${API_URL}/activity-log?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de la récupération du journal d\'activité');
  }

  const data = await response.json();
  return data.activities || [];
};
