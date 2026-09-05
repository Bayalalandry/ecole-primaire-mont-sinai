import { API_URL } from '../config/apiConfig';

interface Student {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'M' | 'F';
  parent_name: string;
  parent_phone: string;
  parent_address: string;
  current_class_id: string; // Utiliser current_class_id pour correspondre à la base
  school_year: string;
  photo_url: string | null;
  status: 'active' | 'repeating' | 'archived';
  final_grade: number | null;
  created_at: string;
  updated_at: string;
  classes?: {
    id: string;
    name: string;
  };
}

export const studentService = {
  // Créer un nouvel élève
  createStudent: async (studentData: Partial<Student>, token: string) => {
    const response = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(studentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création de l\'élève');
    }

    return response.json();
  },

  // Lister tous les élèves
  getStudents: async (token: string, filters?: { classId?: string; schoolYear?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.schoolYear) params.append('schoolYear', filters.schoolYear);
    if (filters?.status) params.append('status', filters.status);

    const response = await fetch(`${API_URL}/students?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération des élèves');
    }

    return response.json();
  },

  // Récupérer un élève par ID
  getStudent: async (id: string, token: string) => {
    const response = await fetch(`${API_URL}/students/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération de l\'élève');
    }

    return response.json();
  },

  // Mettre à jour un élève
  updateStudent: async (id: string, studentData: Partial<Student>, token: string) => {
    const response = await fetch(`${API_URL}/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(studentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour de l\'élève');
    }

    return response.json();
  },

  // Supprimer un élève
  deleteStudent: async (id: string, token: string) => {
    const response = await fetch(`${API_URL}/students/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression de l\'élève');
    }

    return response.json();
  },

  // Rechercher des élèves
  searchStudents: async (query: string, token: string) => {
    const response = await fetch(`${API_URL}/students/search/${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la recherche des élèves');
    }

    return response.json();
  },

  // Récupérer un élève par ID (alias pour ProfilePage)
  getStudentById: async (id: string, token: string) => {
    const response = await fetch(`${API_URL}/students/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération de l\'élève');
    }

    return response.json();
  },

  // Récupérer l'historique scolaire d'un élève
  getAcademicHistory: async (studentId: string, token: string) => {
    const response = await fetch(`${API_URL}/students/${studentId}/academic-history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la récupération de l\'historique scolaire');
    }

    return response.json();
  },
};
