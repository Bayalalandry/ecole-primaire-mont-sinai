import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { tokenStorage, authService } from '../services/authService';
import { X, ArrowLeft, Users, Clock, CheckCircle, Plus, Shield, Lock, User } from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';

export default function SecretariesPage() {
  const [user, setUser] = useState<any>(null);
  const [secretaries, setSecretaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSecretary, setSelectedSecretary] = useState<any>(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedSecretaryForReset, setSelectedSecretaryForReset] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const secretaryRowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

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
      const secretariesData = await authService.getAllSecretaries(token);
      setSecretaries(secretariesData.secretaries || []);

      const secretaryId = searchParams.get('secretaryId');
      if (secretaryId) {
        const secretary = secretariesData.secretaries?.find((s: any) => s.id === secretaryId);
        if (secretary) {
          setSelectedSecretary(secretary);
          setTimeout(() => {
            const row = secretaryRowRefs.current[secretary.id];
            if (row) {
              row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const token = tokenStorage.getToken();
    if (!token || !selectedSecretaryForReset || !newPassword) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      await authService.resetPassword(selectedSecretaryForReset.id, newPassword, token);
      alert('Mot de passe réinitialisé avec succès');
      setShowResetPasswordModal(false);
      setNewPassword('');
      setSelectedSecretaryForReset(null);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert(error.message);
    }
  };

  const handleCreateSecretary = async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      alert('Token manquant');
      return;
    }

    // Validation
    if (!createForm.username || !createForm.password || !createForm.firstName || !createForm.lastName) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (createForm.password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      await authService.createSecretary(
        createForm.username,
        createForm.password,
        createForm.firstName,
        createForm.lastName,
        token
      );
      alert('Compte secrétaire créé avec succès');
      setShowCreateModal(false);
      setCreateForm({
        username: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
      });
      loadData(token);
    } catch (error: any) {
      console.error('Error creating secretary:', error);
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
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-xl flex-shrink-0 relative z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 relative z-30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white rounded-full backdrop-blur-sm border-2 border-white/50 shadow-lg flex-shrink-0" style={{ padding: 0, pointerEvents: 'none' }}>
                <SchoolLogo size={56} inCircle={true} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Gestion des Secrétaires</h1>
                <p className="text-xs sm:text-sm text-blue-100 drop-shadow">Gérer les comptes des secrétaires</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'founder' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-2 border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all font-medium shadow-lg backdrop-blur-sm flex items-center justify-center gap-2 relative z-40"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Ajouter un secrétaire</span>
                  <span className="sm:hidden">Ajouter</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (user?.role === 'founder') navigate('/dashboard/founder');
                  else if (user?.role === 'director') navigate('/dashboard/director');
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 transition-all font-medium shadow-lg backdrop-blur-sm flex items-center justify-center gap-2 relative z-40"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            </div>
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
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Secrétaires actifs</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{secretaries.filter(s => s.status === 'active').length}</p>
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
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600">{secretaries.filter(s => s.status === 'pending').length}</p>
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
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">{secretaries.filter(s => s.status === 'on_leave').length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card p-3 sm:p-4 border-l-4 border-gray-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Total</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-600">{secretaries.length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Liste des secrétaires */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-200">
            <div className="px-4 sm:px-6 py-3 sm:py-5 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Secrétaires ({secretaries.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom d'utilisateur</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {secretaries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 text-xs sm:text-sm">
                        Aucun secrétaire enregistré
                      </td>
                    </tr>
                  ) : (
                    secretaries.map((secretary) => (
                      <tr
                        key={secretary.id}
                        ref={(el) => { secretaryRowRefs.current[secretary.id] = el; }}
                        className={`hover:bg-gray-50 ${selectedSecretary?.id === secretary.id ? 'bg-indigo-50 ring-2 ring-indigo-500' : ''}`}
                      >
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {secretary.last_name}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {secretary.first_name}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          @{secretary.username}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                          <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(secretary.status || 'active')}`}>
                            {getStatusLabel(secretary.status || 'active')}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <div className="flex flex-wrap gap-1 sm:space-x-2">
                            {user?.role === 'founder' && (
                              <>
                                {secretary.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => authService.updateSecretaryStatus(secretary.id, 'active', tokenStorage.getToken()!).then(() => loadData(tokenStorage.getToken()!)).catch(alert)}
                                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg font-medium flex items-center gap-1 transition-colors text-xs sm:text-sm"
                                    >
                                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                      Valider
                                    </button>
                                    <button
                                      onClick={() => authService.updateSecretaryStatus(secretary.id, 'archived', tokenStorage.getToken()!).then(() => loadData(tokenStorage.getToken()!)).catch(alert)}
                                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium flex items-center gap-1 transition-colors text-xs sm:text-sm"
                                    >
                                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                      Rejeter
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedSecretaryForReset(secretary);
                                    setShowResetPasswordModal(true);
                                  }}
                                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500 text-white hover:bg-blue-600 rounded-lg font-medium flex items-center gap-1 transition-colors text-xs sm:text-sm"
                                >
                                  <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Réinitialiser
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => navigate(`/profile/secretary/${secretary.id}`)}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg font-medium flex items-center gap-1 transition-colors text-xs sm:text-sm"
                              title="Voir le dossier"
                            >
                              <User className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>Dossier</span>
                            </button>
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
                  setSelectedSecretaryForReset(null);
                }}
                className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 rounded-full p-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              Réinitialiser le mot de passe de {selectedSecretaryForReset?.last_name} {selectedSecretaryForReset?.first_name}
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
                  setSelectedSecretaryForReset(null);
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

      {/* Modal Créer Secrétaire */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4 border-2 border-green-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-200 pb-2 sm:pb-3">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 text-gray-900">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                Créer un compte Secrétaire
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({
                    username: '',
                    password: '',
                    confirmPassword: '',
                    firstName: '',
                    lastName: '',
                  });
                }}
                className="text-gray-400 hover:text-green-600 transition-colors bg-gray-100 hover:bg-green-100 rounded-full p-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({
                      username: '',
                      password: '',
                      confirmPassword: '',
                      firstName: '',
                      lastName: '',
                    });
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateSecretary}
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md text-sm"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
