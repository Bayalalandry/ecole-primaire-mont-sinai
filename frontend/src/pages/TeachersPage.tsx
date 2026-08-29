import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { tokenStorage, authService } from '../services/authService';
import { classService } from '../services/classService';
import { X, Calendar, User, Shield, Lock, ArrowLeft, Users, Clock, CheckCircle, CalendarPlus } from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';
import { sortClasses } from '../utils/classUtils';

export default function TeachersPage() {
  const [user, setUser] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedTeacherForReset, setSelectedTeacherForReset] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teacherRowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  useEffect(() => {
    const token = tokenStorage.getToken();
    const currentUser = tokenStorage.getUser();

    if (!token || !currentUser || (currentUser.role !== 'founder' && currentUser.role !== 'director')) {
      navigate('/login');
      return;
    }

    setUser(currentUser);
    loadData(token);
  }, [navigate, searchParams]);

  const loadData = async (token: string) => {
    try {
      const teachersData = await authService.getAllTeachers(token);
      setTeachers(teachersData.teachers || []);

      const teacherId = searchParams.get('teacherId');
      if (teacherId) {
        const teacher = teachersData.teachers?.find((t: any) => t.id === teacherId);
        if (teacher) {
          setSelectedTeacher(teacher);
          setTimeout(() => {
            const row = teacherRowRefs.current[teacher.id];
            if (row) {
              row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }

      const classesData = await classService.getClasses(token);
      setClasses(sortClasses(classesData.classes || []));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (teacherId: string, newStatus: string) => {
    const token = tokenStorage.getToken();
    if (!token) return;

    try {
      if (showLeaveModal) {
        setShowLeaveModal(false);
        setLeaveStartDate('');
        setLeaveEndDate('');
      }

      if (newStatus === 'on_leave') {
        setSelectedTeacher(teacherId);
        setShowLeaveModal(true);
        return;
      }

      if (newStatus === 'archived') {
        if (!confirm('Êtes-vous sûr de vouloir archiver cet enseignant ?')) {
          return;
        }
      }

      if (newStatus === 'pending') {
        if (!confirm('Êtes-vous sûr de vouloir remettre cet enseignant en attente ?')) {
          return;
        }
      }

      await authService.updateTeacherStatus(teacherId, newStatus, token);
      loadData(token);
    } catch (error: any) {
      console.error('Error in handleStatusChange:', error);
      alert(error.message);
    }
  };

  const handleLeaveSubmit = async () => {
    const token = tokenStorage.getToken();
    if (!token || !selectedTeacher) return;

    try {
      await authService.updateTeacherStatus(selectedTeacher, 'on_leave', token, leaveStartDate, leaveEndDate);
      setShowLeaveModal(false);
      setLeaveStartDate('');
      setLeaveEndDate('');
      loadData(token);
    } catch (error: any) {
      console.error('Error in handleLeaveSubmit:', error);
      alert(error.message);
    }
  };

  const handleInlineAssign = async (teacherId: string, classId: string) => {
    const token = tokenStorage.getToken();
    if (!token || !classId) return;

    try {
      await authService.assignTeacherToClass(teacherId, classId, token);
      alert('Classe assignée avec succès');
      loadData(token);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleInlineUnassign = async (teacherId: string, classId: string) => {
    const token = tokenStorage.getToken();
    if (!token || !classId) return;

    if (!confirm('Êtes-vous sûr de vouloir désassigner cet enseignant de cette classe ?')) {
      return;
    }

    try {
      await authService.unassignTeacherFromClass(teacherId, classId, token);
      alert('Classe désassignée avec succès');
      loadData(token);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleResetPassword = async () => {
    const token = tokenStorage.getToken();
    if (!token || !selectedTeacherForReset || !newPassword) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      await authService.resetPassword(selectedTeacherForReset.id, newPassword, token);
      alert('Mot de passe réinitialisé avec succès');
      setShowResetPasswordModal(false);
      setNewPassword('');
      setSelectedTeacherForReset(null);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert(error.message);
    }
  };

  const handleAssignClass = async () => {
    const token = tokenStorage.getToken();
    if (!token || !selectedTeacher || !selectedClass) {
      alert('Veuillez sélectionner une classe');
      return;
    }

    try {
      await authService.assignTeacherToClass(selectedTeacher, selectedClass, token);
      setShowAssignModal(false);
      setSelectedClass('');
      loadData(token);
    } catch (error: any) {
      console.error('Error assigning class:', error);
      alert(error.message);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente';
      case 'on_leave': return 'En congé';
      case 'archived': return 'Archivé';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'on_leave': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-600 text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Forme géométrique décorative en arrière-plan */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl opacity-20"></div>
      
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-xl flex-shrink-0 relative overflow-visible">
        {/* Motif subtil en arrière-plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white rounded-full backdrop-blur-sm border-2 border-white/50 shadow-lg flex-shrink-0" style={{ padding: 0 }}>
                <SchoolLogo size={56} inCircle={true} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Gestion du Personnel</h1>
                <p className="text-xs sm:text-sm text-blue-100 drop-shadow">Gérer les comptes et statuts des enseignants et directeurs</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (user?.role === 'founder') navigate('/dashboard/founder');
                else if (user?.role === 'director') navigate('/dashboard/director');
                else navigate('/dashboard/teacher');
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 transition-all font-medium shadow-lg backdrop-blur-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-card p-3 sm:p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Enseignants actifs</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{teachers.filter(t => t.role === 'teacher' && t.teachers?.status === 'active').length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card p-3 sm:p-4 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">En attente</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600">{teachers.filter(t => t.role === 'teacher' && t.teachers?.status === 'pending').length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card p-3 sm:p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">En congé</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">{teachers.filter(t => t.role === 'teacher' && t.teachers?.status === 'on_leave').length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card p-3 sm:p-4 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Directeurs</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600">{teachers.filter(t => t.role === 'director').length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Liste des enseignants */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-200">
            <div className="px-4 sm:px-6 py-3 sm:py-5 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Personnel ({teachers.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe assignée</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teachers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 text-xs sm:text-sm">
                        Aucun enseignant enregistré
                      </td>
                    </tr>
                  ) : (
                    teachers.map((teacher) => (
                      <tr
                        key={teacher.id}
                        ref={(el) => { teacherRowRefs.current[teacher.id] = el; }}
                        className={`hover:bg-gray-50 ${selectedTeacher?.id === teacher.id ? 'bg-indigo-50 ring-2 ring-indigo-500' : ''}`}
                      >
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {teacher.last_name}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {teacher.first_name}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(teacher.role === 'director' ? 'active' : teacher.teachers?.status || 'active')}`}>
                            {teacher.role === 'director' ? 'Directeur' : teacher.teachers ? getStatusLabel(teacher.teachers.status) : 'Non défini'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {teacher.assigned_class || 'Non assigné'}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <div className="flex flex-wrap gap-1 sm:space-x-2">
                            {teacher.role === 'teacher' || teacher.role === 'director' ? (
                              <>
                                <div className="flex flex-col space-y-1 sm:space-y-2 w-full sm:w-auto">
                                  <div className="text-xs text-gray-500">Classes (multi-sélection) :</div>
                                  <div className="flex flex-wrap gap-1 sm:gap-2">
                                    {classes.map((cls) => {
                                      const isSelected = teacher.assigned_class === cls.name || (teacher.assigned_classes && teacher.assigned_classes.includes(cls.name));
                                      if (isSelected) {
                                        return (
                                          <button
                                            key={cls.id}
                                            onClick={() => user?.role === 'founder' ? handleInlineUnassign(teacher.id, cls.id) : null}
                                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition-all flex items-center gap-1 shadow-sm ${
                                              user?.role === 'founder'
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer hover:shadow-md'
                                                : 'bg-blue-50 text-blue-600 cursor-default'
                                            }`}
                                            title={user?.role === 'founder' ? 'Désassigner' : 'Assigné'}
                                          >
                                            {cls.name} {user?.role === 'founder' && <X className="w-3 h-3" />}
                                          </button>
                                        );
                                      }
                                      return (
                                          <button
                                            key={cls.id}
                                            onClick={() => handleInlineAssign(teacher.id, cls.id)}
                                            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all shadow-sm hover:shadow-md"
                                            title="Assigner"
                                          >
                                            {cls.name}
                                          </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                {user?.role === 'founder' && (
                                  <>
                                    {teacher.teachers?.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleStatusChange(teacher.id, 'active')}
                                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg font-medium flex items-center gap-1 transition-colors text-xs sm:text-sm"
                                        >
                                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                          Valider
                                        </button>
                                        <button
                                          onClick={() => handleStatusChange(teacher.id, 'archived')}
                                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium flex items-center gap-1 transition-colors text-xs sm:text-sm"
                                        >
                                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                          Rejeter
                                        </button>
                                      </>
                                    )}
                                    <button
                                      onClick={() => {
                                        setSelectedTeacherForReset(teacher);
                                        setShowResetPasswordModal(true);
                                      }}
                                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500 text-white hover:bg-blue-600 rounded-lg font-medium flex items-center gap-1 transition-colors text-xs sm:text-sm"
                                    >
                                      <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                                      Réinitialiser
                                    </button>
                                  </>
                                )}
                                {(teacher.teachers?.status !== 'pending' || user?.role !== 'founder') && (
                                  <select
                                    value={teacher.teachers?.status || 'active'}
                                    onChange={(e) => handleStatusChange(teacher.id, e.target.value)}
                                    className="text-xs sm:text-sm border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                  >
                                    <option value="pending">En attente</option>
                                    <option value="active">Actif</option>
                                    <option value="on_leave">Congé</option>
                                    <option value="archived">Archiver</option>
                                  </select>
                                )}
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Assigner classe */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-200 pb-2 sm:pb-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Assigner une classe à {selectedTeacher?.role === 'director' ? 'ce directeur' : 'cet enseignant'}
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedClass('');
                }}
                className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 rounded-full p-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              >
                <option value="">Sélectionner une classe</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedClass('');
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleAssignClass();
                }}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md text-sm"
              >
                Assigner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Réinitialiser mot de passe */}
      {showResetPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-200 pb-2 sm:pb-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Réinitialiser le mot de passe
              </h3>
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setNewPassword('');
                  setSelectedTeacherForReset(null);
                }}
                className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 rounded-full p-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              Réinitialiser le mot de passe de {selectedTeacherForReset?.last_name} {selectedTeacherForReset?.first_name}
            </p>
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                }}
                className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3">
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setNewPassword('');
                  setSelectedTeacherForReset(null);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleResetPassword}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md text-sm"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Congé */}
      {showLeaveModal && (
        <div className="modal-overlay">
          <div className="modal-content p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-200 pb-2 sm:pb-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900">
                <CalendarPlus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Mettre en congé
              </h3>
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  setLeaveStartDate('');
                  setLeaveEndDate('');
                }}
                className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 rounded-full p-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
              <input
                type="date"
                value={leaveStartDate}
                onChange={(e) => setLeaveStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <input
                type="date"
                value={leaveEndDate}
                onChange={(e) => setLeaveEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setShowLeaveModal(false);
                  setLeaveStartDate('');
                  setLeaveEndDate('');
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleLeaveSubmit();
                }}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md text-sm"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
