const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  username: string;
  role: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  founderSettings?: any;
  directorPermissions?: any;
  teacherInfo?: any;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  // Login
  async login(username: string, password: string, secretAnswer?: string): Promise<AuthResponse | { requiresSecretAnswer: boolean; secretQuestion: string }> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, secretAnswer }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur de connexion');
    }

    return response.json();
  },

  // Register (enseignant)
  async register(username: string, password: string, firstName: string, lastName: string, classId?: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, firstName, lastName, classId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'inscription');
    }

    return response.json();
  },

  // Créer le compte fondateur
  async createFounder(username: string, password: string, firstName: string, lastName: string, secretQuestion: string, secretAnswer: string): Promise<any> {
    const url = `${API_URL}/auth/create-founder`;
    console.log('API_URL:', API_URL);
    console.log('Full URL:', url);
    console.log('Request body:', { username, firstName, lastName, secretQuestion });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, firstName, lastName, secretQuestion, secretAnswer }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const error = await response.json();
      console.error('Error response:', error);
      throw new Error(error.error || 'Erreur lors de la création du compte fondateur');
    }

    return response.json();
  },

  // Créer un compte directeur
  async createDirector(username: string, password: string, firstName: string, lastName: string, permissions: any, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/create-director`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ username, password, firstName, lastName, permissions }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création du compte directeur');
    }

    return response.json();
  },

  // Valider un enseignant
  async validateTeacher(userId: string, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/validate-teacher/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la validation');
    }

    return response.json();
  },

  // Refuser un enseignant
  async rejectTeacher(userId: string, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/reject-teacher/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors du refus');
    }

    return response.json();
  },

  // Mettre en congé un enseignant
  async teacherLeave(userId: string, leaveStartDate: string, leaveEndDate: string, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/teacher-leave/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ leaveStartDate, leaveEndDate }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'enregistrement du congé');
    }

    return response.json();
  },

  // Réinitialiser le mot de passe
  async resetPassword(userId: string, newPassword: string, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/reset-password/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la réinitialisation');
    }

    return response.json();
  },

  // Désactiver un compte
  async disableAccount(userId: string, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/disable-account/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la désactivation');
    }

    return response.json();
  },

  // Modifier les permissions du directeur
  async updateDirectorPermissions(userId: string, permissions: any, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/director-permissions/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ permissions }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour des permissions');
    }

    return response.json();
  },

  // Obtenir les informations de l'utilisateur connecté
  async getMe(token: string): Promise<{ user: User }> {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des informations');
    }

    return response.json();
  },

  // Lister les enseignants en attente
  async getPendingTeachers(token: string): Promise<{ teachers: any[] }> {
    const response = await fetch(`${API_URL}/auth/pending-teachers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération');
    }

    return response.json();
  },

  // Lister tous les enseignants
  async getAllTeachers(token: string): Promise<{ teachers: any[] }> {
    const response = await fetch(`${API_URL}/auth/teachers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération');
    }

    return response.json();
  },

  // Mettre à jour le statut d'un enseignant
  async updateTeacherStatus(teacherId: string, status: string, token: string, leaveStartDate?: string, leaveEndDate?: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/teacher-status/${teacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status, leaveStartDate, leaveEndDate }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour du statut');
    }

    return response.json();
  },

  // Assigner un enseignant à une classe
  async assignTeacherToClass(teacherId: string, classId: string, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/assign-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ teacherId, classId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'assignation');
    }

    return response.json();
  },

  // Désassigner un enseignant d'une classe
  async unassignTeacherFromClass(teacherId: string, classId: string, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/unassign-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ teacherId, classId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la désassignation');
    }

    return response.json();
  },

  // Réassigner les élèves d'un enseignant à un autre
  async reassignStudents(fromTeacherId: string, toTeacherId: string, token: string): Promise<any> {
    const response = await fetch(`${API_URL}/auth/reassign-students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ fromTeacherId, toTeacherId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la réassignation');
    }

    return response.json();
  },

  // Lister tous les utilisateurs
  async getUsers(token: string): Promise<{ users: any[] }> {
    const response = await fetch(`${API_URL}/auth/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération');
    }

    return response.json();
  },
};

// Gestion du token localStorage
export const tokenStorage = {
  setToken: (token: string) => localStorage.setItem('auth_token', token),
  getToken: () => localStorage.getItem('auth_token'),
  removeToken: () => localStorage.removeItem('auth_token'),
  setUser: (user: User) => localStorage.setItem('auth_user', JSON.stringify(user)),
  getUser: (): User | null => {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  removeUser: () => localStorage.removeItem('auth_user'),
};
