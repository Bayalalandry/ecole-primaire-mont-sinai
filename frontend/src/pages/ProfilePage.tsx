import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tokenStorage } from '../services/authService';
import { studentService } from '../services/studentService';
import { teacherService } from '../services/teacherService';
import { tuitionService } from '../services/tuitionService';
import { salaryService } from '../services/salaryService';
import { ArrowLeft, User, DollarSign, GraduationCap, FileText, AlertCircle } from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';

interface AcademicHistory {
  id: string;
  class_id: string;
  class_name: string;
  school_year: string;
  final_grade: number;
  status: string;
  created_at: string;
}

interface PaymentHistory {
  id: string;
  amount: number;
  payment_date: string;
  method: string;
  created_at: string;
}

export default function ProfilePage() {
  const { type, id } = useParams<{ type: 'student' | 'teacher'; id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [academicHistory, setAcademicHistory] = useState<AcademicHistory[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [salarySummary, setSalarySummary] = useState<any>(null);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatAmount = (amount: number): string => {
    const rounded = Math.round(amount);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  };

  const translateStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'active': 'Actif',
      'repeating': 'Redoublant',
      'departed': 'Parti',
      'transferred': 'Transféré',
      'passed': 'Admis',
      'enrolled': 'Inscrit',
    };
    return statusMap[status] || status;
  };

  const loadStudentProfile = async (studentId: string) => {
    try {
      const token = tokenStorage.getToken();
      if (!token) return;

      // Load student basic info
      const studentResponse = await studentService.getStudentById(studentId, token);
      setProfile(studentResponse.student);

      // Load academic history
      const historyResponse = await studentService.getAcademicHistory(studentId, token);
      setAcademicHistory(historyResponse.history || []);

      // Load payment summary
      const paymentData = await tuitionService.getStudentPaymentSummary(studentId, token);
      setPaymentSummary(paymentData);

      // Load payment history
      const paymentsData = await tuitionService.getStudentPayments(studentId, token);
      setPaymentHistory(paymentsData.payments || []);
    } catch (error: any) {
      console.error('Error loading student profile:', error);
      setError('Erreur lors du chargement du dossier');
    }
  };

  const loadTeacherProfile = async (teacherId: string) => {
    try {
      const token = tokenStorage.getToken();
      if (!token) return;

      // Load teacher basic info
      const teacherResponse = await teacherService.getTeacherById(teacherId, token);
      setProfile(teacherResponse.teacher);

      // Load salary summary
      const salaryData = await salaryService.getTeacherSalarySummary(teacherId, token);
      setSalarySummary(salaryData);

      // Load salary payment history
      const paymentsData = await salaryService.getTeacherPayments(teacherId, token);
      setPaymentHistory(paymentsData.payments || []);
    } catch (error: any) {
      console.error('Error loading teacher profile:', error);
      setError('Erreur lors du chargement du dossier');
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!type || !id) {
        navigate('/dashboard/founder');
        return;
      }

      setLoading(true);
      if (type === 'student') {
        await loadStudentProfile(id);
      } else if (type === 'teacher') {
        await loadTeacherProfile(id);
      }
      setLoading(false);
    };

    loadProfile();
  }, [type, id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-600 text-lg">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Profil non trouvé</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-xl flex-shrink-0 relative overflow-visible">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white rounded-full backdrop-blur-sm border-2 border-white/50 shadow-lg flex-shrink-0" style={{ padding: 0 }}>
                <SchoolLogo size={56} inCircle={true} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                  Dossier - {type === 'student' ? 'Élève' : 'Enseignant'}
                </h1>
                <p className="text-xs sm:text-sm text-blue-100 drop-shadow">
                  {profile.first_name} {profile.last_name}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Informations personnelles</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Nom</p>
                <p className="text-sm sm:text-base font-medium text-gray-900">{profile.last_name}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Prénom</p>
                <p className="text-sm sm:text-base font-medium text-gray-900">{profile.first_name}</p>
              </div>
              {type === 'student' && (
                <>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Matricule</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900">{profile.matricule || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Date de naissance</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900">{profile.date_of_birth ? formatDate(profile.date_of_birth) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Genre</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900">{profile.gender === 'M' ? 'Masculin' : profile.gender === 'F' ? 'Féminin' : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Statut actuel</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900">{translateStatus(profile.status)}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Classe actuelle</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900">{profile.current_class_name || '-'}</p>
                  </div>
                </>
              )}
              {type === 'teacher' && (
                <>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Statut</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900">{profile.status === 'active' ? 'Actif' : 'Inactif'}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Spécialité</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900">{profile.specialty || '-'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Academic History (Students only) */}
          {type === 'student' && (
            <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Historique scolaire</h2>
              </div>
              {academicHistory.length === 0 ? (
                <p className="text-gray-600 text-sm sm:text-base">Aucun historique scolaire disponible</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Année scolaire</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Classe</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Moyenne</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Résultat</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {academicHistory.map((history) => (
                        <tr key={history.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{history.school_year}</td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{history.class_name}</td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{history.final_grade ? history.final_grade.toFixed(2) : '-'}</td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                            <span className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              history.status === 'passed' ? 'bg-green-100 text-green-800' :
                              history.status === 'repeating' ? 'bg-orange-100 text-orange-800' :
                              history.status === 'transferred' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {history.status === 'passed' ? 'Admis' :
                               history.status === 'repeating' ? 'Redoublant' :
                               history.status === 'transferred' ? 'Transféré' :
                               history.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payment Summary (Students only) */}
          {type === 'student' && paymentSummary && (
            <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Résumé des scolarités</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border-l-4 border-blue-500">
                  <p className="text-xs sm:text-sm text-gray-700 mb-1">Total dû</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600">{formatAmount(paymentSummary.totalExpected || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-xl border-l-4 border-green-500">
                  <p className="text-xs sm:text-sm text-gray-700 mb-1">Total versé</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600">{formatAmount(paymentSummary.totalPaid || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 rounded-xl border-l-4 border-red-500">
                  <p className="text-xs sm:text-sm text-gray-700 mb-1">Reste à payer</p>
                  <p className="text-lg sm:text-xl font-bold text-red-600">{formatAmount(paymentSummary.totalOutstanding || 0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  {type === 'student' ? 'Historique des paiements' : 'Historique des versements'}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Méthode</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{formatDate(payment.payment_date)}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-semibold">{formatAmount(payment.amount)}</td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{payment.method || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Salary Summary (Teachers only) */}
          {type === 'teacher' && salarySummary && (
            <div className="bg-white rounded-xl shadow-card p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Résumé des salaires</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border-l-4 border-blue-500">
                  <p className="text-xs sm:text-sm text-gray-700 mb-1">Salaire fixe</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600">{formatAmount(salarySummary.fixedSalary || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-xl border-l-4 border-green-500">
                  <p className="text-xs sm:text-sm text-gray-700 mb-1">Total versé</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600">{formatAmount(salarySummary.totalPaid || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 sm:p-4 rounded-xl border-l-4 border-red-500">
                  <p className="text-xs sm:text-sm text-gray-700 mb-1">Reste à payer</p>
                  <p className="text-lg sm:text-xl font-bold text-red-600">{formatAmount(salarySummary.totalOutstanding || 0)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
