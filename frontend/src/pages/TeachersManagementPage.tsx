import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../services/authService';
import { teachersManagementService } from '../services/teachersManagementService';
import { classService } from '../services/classService';
import { Plus, X, ArrowLeft, Users, Edit, Trash2, User } from 'lucide-react';

export default function TeachersManagementPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    class: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = tokenStorage.getToken();
    const currentUser = tokenStorage.getUser();

    if (!token || !currentUser || currentUser.role !== 'founder') {
      navigate('/login');
      return;
    }

    loadData(token);
    loadClasses(token);
  }, [navigate]);

  const loadData = async (token: string) => {
    try {
      const data = await teachersManagementService.getAllTeachers(token);
      setTeachers(data.teachers || []);
    } catch (error: any) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async (token: string) => {
    try {
      const data = await classService.getClasses(token);
      setClasses(data.classes || []);
    } catch (error: any) {
      console.error('Error loading classes:', error);
    }
  };

  const handleCreateTeacher = async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      alert('Token manquant');
      return;
    }

    if (!createForm.firstName || !createForm.lastName) {
      alert('Veuillez remplir le prénom et le nom');
      return;
    }

    try {
      await teachersManagementService.createTeacher(createForm, token);
      alert('Enseignant créé avec succès');
      setShowCreateModal(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        class: '',
      });
      loadData(token);
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      alert(error.message);
    }
  };

  const handleUpdateTeacher = async () => {
    const token = tokenStorage.getToken();
    if (!token || !editingTeacher) return;

    try {
      await teachersManagementService.updateTeacher(editingTeacher.id, createForm, token);
      alert('Enseignant modifié avec succès');
      setShowCreateModal(false);
      setEditingTeacher(null);
      setCreateForm({
        firstName: '',
        lastName: '',
        class: '',
      });
      loadData(token);
    } catch (error: any) {
      console.error('Error updating teacher:', error);
      alert(error.message);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) return;

    const token = tokenStorage.getToken();
    if (!token) return;

    try {
      await teachersManagementService.deleteTeacher(id, token);
      alert('Enseignant supprimé avec succès');
      loadData(token);
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      alert(error.message);
    }
  };

  const openEditModal = (teacher: any) => {
    setEditingTeacher(teacher);
    setCreateForm({
      firstName: teacher.first_name,
      lastName: teacher.last_name,
      class: teacher.class_id || '',
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingTeacher(null);
    setCreateForm({
      firstName: '',
      lastName: '',
      class: '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-blue-600 text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 sm:p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/dashboard/founder')}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Gestion des Enseignants</h1>
                <p className="text-xs sm:text-sm text-blue-100">Enseignants sans compte utilisateur (pour gestion salariale)</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-blue-600 px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Ajouter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {teachers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun enseignant</h3>
            <p className="text-gray-500 mb-4">Commencez par ajouter des enseignants pour gérer leurs salaires</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ajouter un enseignant
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classe</th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.first_name} {teacher.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {teacher.classes?.name || '-'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(teacher)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Créer/Modifier */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-200 pb-2 sm:pb-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                {editingTeacher ? 'Modifier l\'enseignant' : 'Ajouter un enseignant'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 rounded-full p-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                <select
                  value={createForm.class}
                  onChange={(e) => setCreateForm({ ...createForm, class: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3 pt-4">
                <button
                  onClick={closeModal}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={editingTeacher ? handleUpdateTeacher : handleCreateTeacher}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  {editingTeacher ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
