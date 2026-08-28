import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, tokenStorage } from '../services/authService';
import { LogIn, UserPlus, Lock, AlertCircle, User, Key } from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';
import { SCHOOL_CONFIG } from '../config/schoolConfig';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secretAnswer, setSecretAnswer] = useState('');
  const [requiresSecretAnswer, setRequiresSecretAnswer] = useState(false);
  const [secretQuestion, setSecretQuestion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.login(username, password, secretAnswer || undefined);

      if ('requiresSecretAnswer' in result) {
        setRequiresSecretAnswer(true);
        setSecretQuestion(result.secretQuestion);
      } else {
        tokenStorage.setToken(result.token);
        tokenStorage.setUser(result.user);

        switch (result.user.role) {
          case 'founder':
            navigate('/dashboard/founder');
            break;
          case 'director':
            navigate('/dashboard/director');
            break;
          case 'teacher':
            navigate('/dashboard/teacher');
            break;
          default:
            navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Forme géométrique décorative en arrière-plan */}
      <div className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-500 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl opacity-20"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 px-6 sm:px-8 py-6 sm:py-8 relative overflow-hidden">
            {/* Motif subtil en arrière-plan */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
            </div>

            <div className="flex items-center justify-center mb-3 sm:mb-4 relative z-10">
              <div className="bg-white rounded-full backdrop-blur-sm border-2 border-white/50 shadow-lg" style={{ padding: 0 }}>
                <SchoolLogo size={56} inCircle={false} className="text-white" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white text-center relative z-10 drop-shadow-lg leading-tight">
              {SCHOOL_CONFIG.name}
            </h2>
            <p className="text-blue-100 text-center text-xs sm:text-sm mt-1 sm:mt-2 relative z-10 drop-shadow">
              Système de gestion scolaire
            </p>
          </div>

          {/* Form */}
          <div className="px-6 sm:px-8 py-6 sm:py-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-base"
                    placeholder="Entrez votre nom d'utilisateur"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-base"
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {requiresSecretAnswer && (
                <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border-2 border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span className="flex-1">Question secrète : {secretQuestion}</span>
                  </p>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm text-base"
                    placeholder="Réponse secrète"
                    value={secretAnswer}
                    onChange={(e) => setSecretAnswer(e.target.value)}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white py-3 sm:py-3 px-4 rounded-xl font-semibold text-base sm:text-base hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Connexion...'
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            {/* Links */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 space-y-2 sm:space-y-3">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors flex items-center justify-center gap-2 py-2 sm:py-2 rounded-lg hover:bg-blue-50"
              >
                <UserPlus className="w-4 h-4" />
                <span className="flex-1">Créer un compte enseignant</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/create-founder')}
                className="w-full text-center text-gray-600 hover:text-gray-700 text-sm transition-colors flex items-center justify-center gap-2 py-2 sm:py-2 rounded-lg hover:bg-gray-50"
              >
                <UserPlus className="w-4 h-4" />
                <span className="flex-1">Créer le compte fondateur (première installation)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
