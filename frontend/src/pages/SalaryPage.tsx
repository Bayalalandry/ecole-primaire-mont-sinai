import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../services/authService';
import { salaryService } from '../services/salaryService';
import { schoolYearService } from '../services/schoolYearService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import jsPDF from 'jspdf';
import { FileText, DollarSign, AlertCircle, Printer, X, Plus, ArrowLeft, CheckCircle } from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';
import { SCHOOL_CONFIG } from '../config/schoolConfig';
import logo from '../assets/logo_ecole_primaire_le_mont_sinai_app.png';

export default function SalaryPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'salaries' | 'payments' | 'outstanding'>('salaries');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Salaries state
  const [salaries, setSalaries] = useState<any[]>([]);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    teacherId: '',
    schoolYear: '',
    monthlyAmount: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  // Payments state
  const [payments, setPayments] = useState<any[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    teacherId: '',
    salaryId: '',
    amount: '',
    paymentMonth: new Date().toISOString().split('T')[0].substring(0, 7) + '-01', // YYYY-MM-01 format (premier jour du mois)
    paymentDate: new Date().toISOString().split('T')[0],
  });

  // Outstanding state
  const [outstanding, setOutstanding] = useState<any[]>([]);
  const [filterMonth, setFilterMonth] = useState('');

  // Teachers state
  const [teachers, setTeachers] = useState<any[]>([]);

  // Fonction utilitaire pour formater les dates en DD/MM/YYYY
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Fonction utilitaire pour formater les montants en FCFA
  const formatAmount = (amount: number): string => {
    const rounded = Math.round(amount);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  };

  // Formatter le mois en texte (ex: "Août 2026")
  const formatMonth = (dateString: string): string => {
    const date = new Date(dateString);
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const loadData = async (token: string, schoolYear?: string) => {
    try {
      const currentSchoolYear = schoolYear || await schoolYearService.getCurrentSchoolYear(token);

      // Construire les paramètres pour les impayés
      const outstandingParams: any = { schoolYear: currentSchoolYear };
      if (filterMonth) {
        // Convertir YYYY-MM en YYYY-MM-01
        outstandingParams.paymentMonth = filterMonth + '-01';
      }

      const [salariesData, teachersData, paymentsData, outstandingData] = await Promise.all([
        salaryService.getSalaries(token, currentSchoolYear),
        salaryService.getAllTeachers(token),
        salaryService.getSalaryPayments(token, { schoolYear: currentSchoolYear }),
        salaryService.getSalaryOutstanding(token, outstandingParams),
      ]);

      setSalaries(salariesData.salaries || []);
      setTeachers(teachersData || []);
      setPayments(paymentsData.payments || []);
      setOutstanding(outstandingData.outstanding || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = tokenStorage.getToken();
    const currentUser = tokenStorage.getUser();

    if (!token || !currentUser) {
      navigate('/login');
      return;
    }

    setUser(currentUser);

    // Charger l'année scolaire actuelle depuis la base de données
    schoolYearService.getCurrentSchoolYear(token)
      .then(currentYear => {
        setSalaryForm(prev => ({ ...prev, schoolYear: currentYear }));
        loadData(token, currentYear);
      })
      .catch(error => {
        console.error('Error loading school year:', error);
        // Fallback to current year calculation if API fails
        const fallbackYear = new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString();
        setSalaryForm(prev => ({ ...prev, schoolYear: fallbackYear }));
        loadData(token, fallbackYear);
      });
  }, [navigate]);

  // Recharger les données lorsque le filtre de mois change
  useEffect(() => {
    const token = tokenStorage.getToken();
    if (token) {
      schoolYearService.getCurrentSchoolYear(token)
        .then(currentYear => {
          setSalaryForm(prev => ({ ...prev, schoolYear: currentYear }));
          loadData(token, currentYear);
        })
        .catch(error => {
          console.error('Error loading school year:', error);
          const fallbackYear = new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString();
          setSalaryForm(prev => ({ ...prev, schoolYear: fallbackYear }));
          loadData(token, fallbackYear);
        });
    }
  }, [filterMonth]);

  const handleCreateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenStorage.getToken();
    if (!token) return;

    try {
      await salaryService.createSalary(
        {
          teacherId: salaryForm.teacherId,
          schoolYear: salaryForm.schoolYear,
          monthlyAmount: parseFloat(salaryForm.monthlyAmount),
          effectiveDate: salaryForm.effectiveDate,
        },
        token
      );

      alert('Salaire enregistré avec succès !');

      const salariesData = await salaryService.getSalaries(token, salaryForm.schoolYear);
      setSalaries(salariesData.salaries || []);

      // Rafraîchir les stats du dashboard fondateur
      localStorage.setItem('globalStatsUpdate', Date.now().toString());

      // Rafraîchir les stats du dashboard directeur (impayés de salaires)
      localStorage.setItem('directorStatsUpdate', Date.now().toString());

      setShowSalaryForm(false);
      setSalaryForm({
        teacherId: '',
        schoolYear: salaryForm.schoolYear,
        monthlyAmount: '',
        effectiveDate: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenStorage.getToken();
    if (!token) return;

    if (!paymentForm.teacherId) {
      alert('Veuillez sélectionner un enseignant');
      return;
    }

    try {
      const result = await salaryService.createSalaryPayment(
        {
          teacherId: paymentForm.teacherId,
          salaryId: paymentForm.salaryId,
          amount: parseFloat(paymentForm.amount),
          paymentMonth: paymentForm.paymentMonth,
          paymentDate: paymentForm.paymentDate,
        },
        token
      );

      alert(`Paiement enregistré avec succès !\nNuméro de reçu: ${result.payment.receipt_number}`);

      const paymentsData = await salaryService.getSalaryPayments(token, { schoolYear: salaryForm.schoolYear });
      setPayments(paymentsData.payments || []);

      const outstandingData = await salaryService.getSalaryOutstanding(token);
      setOutstanding(outstandingData.outstanding || []);

      // Rafraîchir les stats du dashboard fondateur
      localStorage.setItem('globalStatsUpdate', Date.now().toString());

      // Rafraîchir les stats du dashboard directeur (impayés de salaires)
      localStorage.setItem('directorStatsUpdate', Date.now().toString());

      setShowPaymentForm(false);
      setPaymentForm({
        teacherId: '',
        salaryId: '',
        amount: '',
        paymentMonth: new Date().toISOString().split('T')[0],
        paymentDate: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      console.error('Payment creation error:', error);
      alert(error.message);
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    const token = tokenStorage.getToken();
    if (!token) return;

    if (!confirm('Êtes-vous sûr de vouloir annuler ce paiement ?')) return;

    try {
      await salaryService.cancelSalaryPayment(paymentId, token);

      const paymentsData = await salaryService.getSalaryPayments(token, { schoolYear: salaryForm.schoolYear });
      setPayments(paymentsData.payments || []);

      const outstandingData = await salaryService.getSalaryOutstanding(token);
      setOutstanding(outstandingData.outstanding || []);

      // Rafraîchir les stats du dashboard fondateur
      localStorage.setItem('globalStatsUpdate', Date.now().toString());

      // Rafraîchir les stats du dashboard directeur (impayés de salaires)
      localStorage.setItem('directorStatsUpdate', Date.now().toString());
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handlePrintReceipt = (payment: any) => {
    const teacherName = payment.teachers?.users
      ? `${payment.teachers.users.last_name} ${payment.teachers.users.first_name} ${payment.teachers.users.role === 'director' ? '(Directeur)' : ''}`
      : 'Enseignant inconnu';

    const doc = new jsPDF();
    const schoolName = SCHOOL_CONFIG.name;
    const receiptNumber = payment.receipt_number || 'N/A';
    const paymentMonth = formatMonth(payment.payment_month);
    const paymentDate = formatDate(payment.payment_date);
    const amount = payment.amount ? formatAmount(parseFloat(payment.amount)) : '0 FCFA';
    const recordedBy = `${user?.first_name || ''} ${user?.last_name || ''}`;
    const currentDate = formatDate(new Date().toISOString());

    // Add logo
    doc.addImage(logo, 'PNG', 15, 10, 30, 30);

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(schoolName, 50, 20);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('BULLETIN DE PAIEMENT', 50, 28);

    // Receipt number
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(75, 35, 60, 20, 8, 8, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.roundedRect(75, 35, 60, 20, 8, 8, 'S');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(receiptNumber, 105, 48);

    // Information fields
    let y = 70;
    const fields = [
      { label: 'Enseignant:', value: teacherName },
      { label: 'Mois:', value: paymentMonth },
      { label: 'Date de paiement:', value: paymentDate },
    ];

    fields.forEach((field) => {
      doc.setFillColor(229, 231, 235);
      doc.roundedRect(15, y, 35, 12, 2, 2, 'F');
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, y, 35, 12, 2, 2, 'S');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(field.label, 17, y + 8);

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(55, y, 120, 12, 2, 2, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.roundedRect(55, y, 120, 12, 2, 2, 'S');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(field.value, 57, y + 8);
      
      y += 18;
    });

    // Amount box
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(15, y, 180, 40, 12, 12, 'F');
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, y, 180, 40, 12, 12, 'S');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 78, 59);
    doc.text('Montant Payé', 105, y + 10, { align: 'center' });
    
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 44, 34);
    doc.text(amount, 105, y + 30, { align: 'center' });

    y += 50;

    // Footer
    doc.setFillColor(249, 250, 251);
    doc.rect(15, y, 180, 40, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(15, y, 180, 40, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Enregistré par:', 20, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(recordedBy, 20, y + 18);

    doc.setFont('helvetica', 'bold');
    doc.text('Date d\'émission:', 105, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(currentDate, 105, y + 18);

    y += 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(0, 0, 0);
    doc.text('Ce document fait foi de paiement', 105, y + 5);

    doc.save(`bulletin_paiement_${receiptNumber}.pdf`);
  };

  const exportPaymentsToPDF = () => {
    const doc = new jsPDF();
    const schoolName = SCHOOL_CONFIG.name;
    const generationDate = new Date().toLocaleDateString('fr-FR');
    const exportedBy = `${user?.last_name} ${user?.first_name}`;
    let pageCount = 1;

    // Bannière bleue
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 35, 'F');

    // En-tête global
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolName, 14, 15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Paiements de Salaires', 14, 24);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Date de génération: ${generationDate}`, 14, 32);
    doc.text(`Exporté par: ${exportedBy}`, 110, 32);
    doc.text(`Page ${pageCount}`, 180, 32);

    let y = 45;

    // En-têtes de colonnes avec fond bleu clair
    doc.setFillColor(224, 231, 255);
    doc.rect(14, y - 5, 180, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Reçu', 14, y);
    doc.text('Enseignant', 30, y);
    doc.text('Mois', 80, y);
    doc.text('Montant', 110, y);
    doc.text('Date', 140, y);
    y += 10;

    payments.forEach((payment, index) => {
      if (y > 280) {
        doc.addPage();
        pageCount++;
        y = 20;
        // Bannière bleue
        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolName, 14, 15);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Paiements de Salaires', 14, 24);
        doc.setFontSize(9);
        doc.text(`Date de génération: ${generationDate}`, 14, 32);
        doc.text(`Exporté par: ${exportedBy}`, 110, 32);
        doc.text(`Page ${pageCount}`, 180, 32);
        y = 45;
        // En-têtes de colonnes avec fond bleu clair
        doc.setFillColor(224, 231, 255);
        doc.rect(14, y - 5, 180, 8, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Reçu', 14, y);
        doc.text('Enseignant', 30, y);
        doc.text('Mois', 80, y);
        doc.text('Montant', 110, y);
        doc.text('Date', 140, y);
        y += 10;
        doc.setFont('helvetica', 'normal');
      }

      // Ligne alternée (zebra)
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, y - 4, 180, 7, 'F');
      }

      const receipt = payment.receipt_number || '';
      const teacherName = payment.users
        ? `${payment.users.last_name} ${payment.users.first_name}`.substring(0, 20)
        : 'N/A';
      const teacherRole = payment.users?.role === 'director' ? ' (D)' : '';
      const monthName = new Date(payment.payment_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const monthFormatted = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      const recordedBy = payment.created_by_user ? `${payment.created_by_user.last_name} ${payment.created_by_user.first_name}` : (payment.created_by || 'N/A');

      doc.setFontSize(7);
      doc.text(receipt.substring(0, 10), 14, y);
      doc.setFontSize(9);
      doc.text(teacherName + teacherRole, 30, y);
      doc.text(monthFormatted, 80, y);
      doc.setFontSize(10);
      doc.text(formatAmount(parseFloat(payment.amount)), 110, y);
      doc.setFontSize(9);
      doc.text(formatDate(payment.payment_date), 140, y);
      y += 10;

      // Ligne "Enregistré par" en dessous de chaque paiement
      if (y > 280) {
        doc.addPage();
        pageCount++;
        y = 20;
        // Bannière bleue
        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolName, 14, 15);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Paiements de Salaires', 14, 24);
        doc.setFontSize(9);
        doc.text(`Date de génération: ${generationDate}`, 14, 32);
        doc.text(`Exporté par: ${exportedBy}`, 110, 32);
        doc.text(`Page ${pageCount}`, 180, 32);
        y = 45;
      }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Enregistré par: ${recordedBy}`, 40, y);
      doc.setFont('helvetica', 'normal');
      y += 10;
    });

    doc.save('paiements_salaires.pdf');
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
      <header className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-xl flex-shrink-0 relative z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 relative z-30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white rounded-full backdrop-blur-sm border-2 border-white/50 shadow-lg flex-shrink-0" style={{ padding: 0, pointerEvents: 'none' }}>
                <SchoolLogo size={56} inCircle={true} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Gestion des Salaires</h1>
                <p className="text-xs sm:text-sm text-blue-100 drop-shadow">Définition et paiements des salaires</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (user?.role === 'founder') navigate('/dashboard/founder');
                else if (user?.role === 'director') navigate('/dashboard/director');
                else navigate('/dashboard/teacher');
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white border-2 border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 transition-all font-medium shadow-lg backdrop-blur-sm flex items-center justify-center gap-2 relative z-40"
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

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 sm:space-x-4 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('salaries')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all ${
              activeTab === 'salaries'
                ? 'bg-blue-600 text-white shadow-card'
                : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-card-hover'
            }`}
          >
            Salaires par Enseignant
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white shadow-card'
                : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-card-hover'
            }`}
          >
            Historique des Paiements
          </button>
          <button
            onClick={() => setActiveTab('outstanding')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all ${
              activeTab === 'outstanding'
                ? 'bg-blue-600 text-white shadow-card'
                : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-card-hover'
            }`}
          >
            Impayés
          </button>
        </div>

        {/* Salaries Tab */}
        {activeTab === 'salaries' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Salaires par Enseignant</h2>
              </div>
              <button
                onClick={() => setShowSalaryForm(!showSalaryForm)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-card text-sm"
              >
                {showSalaryForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showSalaryForm ? 'Fermer' : 'Définir un salaire'}
              </button>
            </div>

            {showSalaryForm && (
              <div className="modal-overlay">
                <div className="modal-content p-4 sm:p-6 border-2 border-blue-200 max-w-2xl w-full mx-2 sm:mx-4">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-200 pb-2 sm:pb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      Définir un salaire mensuel
                    </h3>
                    <button
                      onClick={() => setShowSalaryForm(false)}
                      className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 rounded-full p-2"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                <form onSubmit={handleCreateSalary} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enseignant</label>
                    <select
                      value={salaryForm.teacherId}
                      onChange={(e) => setSalaryForm({ ...salaryForm, teacherId: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    >
                      <option value="">Sélectionner un enseignant</option>
                      {teachers.filter(t => t.role === 'teacher' || t.role === 'director').map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.last_name} {teacher.first_name} {teacher.role === 'director' ? '(Directeur)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Année scolaire</label>
                    <input
                      type="text"
                      value={salaryForm.schoolYear}
                      onChange={(e) => setSalaryForm({ ...salaryForm, schoolYear: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant mensuel (XOF)</label>
                    <input
                      type="number"
                      value={salaryForm.monthlyAmount}
                      onChange={(e) => setSalaryForm({ ...salaryForm, monthlyAmount: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                      min="0"
                      step="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'effet</label>
                    <DatePicker
                      selected={salaryForm.effectiveDate ? new Date(salaryForm.effectiveDate) : null}
                      onChange={(date: Date | null) => setSalaryForm({ ...salaryForm, effectiveDate: date ? date.toISOString().split('T')[0] : '' })}
                      dateFormat="dd/MM/yyyy"
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                      placeholderText="DD/MM/YYYY"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-card flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Enregistrer le salaire
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSalaryForm(false)}
                    className="w-full py-2 sm:py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all font-medium shadow-card flex items-center justify-center gap-2 text-sm"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                </form>
              </div>
            </div>
            )}

            <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enseignant</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Année scolaire</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant mensuel</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'effet</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salaries.map((salary) => (
                      <tr key={salary.id}>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {salary.users?.last_name || 'Enseignant'} {salary.users?.first_name || 'Inconnu'} {salary.users?.role === 'director' ? '(Directeur)' : ''}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {salary.school_years?.year_label}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {salary.monthly_amount ? parseFloat(salary.monthly_amount).toLocaleString('fr-FR') : '0'} XOF
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {formatDate(salary.effective_date)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Historique des Paiements</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={exportPaymentsToPDF}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all font-medium text-sm"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-card text-sm"
                >
                  {showPaymentForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {showPaymentForm ? 'Fermer' : 'Enregistrer un paiement'}
                </button>
              </div>
            </div>

            {showPaymentForm && (
              <div className="modal-overlay">
                <div className="modal-content p-4 sm:p-6 border-2 border-blue-200 max-w-2xl w-full mx-2 sm:mx-4">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-200 pb-2 sm:pb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      Enregistrer un paiement de salaire
                    </h3>
                    <button
                      onClick={() => setShowPaymentForm(false)}
                      className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 rounded-full p-2"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                <form onSubmit={handleCreatePayment} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enseignant</label>
                    <select
                      value={paymentForm.teacherId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, teacherId: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    >
                      <option value="">Sélectionner un enseignant</option>
                      {teachers.filter(t => t.role === 'teacher' || t.role === 'director').map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.last_name} {teacher.first_name} {teacher.role === 'director' ? '(Directeur)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant (XOF)</label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                      min="0"
                      step="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mois concerné</label>
                    <DatePicker
                      selected={paymentForm.paymentMonth ? new Date(paymentForm.paymentMonth) : null}
                      onChange={(date: Date | null) => setPaymentForm({ ...paymentForm, paymentMonth: date ? date.toISOString().split('T')[0].substring(0, 7) + '-01' : '' })}
                      dateFormat="MM/yyyy"
                      showMonthYearPicker
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                      placeholderText="MM/YYYY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de paiement</label>
                    <DatePicker
                      selected={paymentForm.paymentDate ? new Date(paymentForm.paymentDate) : null}
                      onChange={(date: Date | null) => setPaymentForm({ ...paymentForm, paymentDate: date ? date.toISOString().split('T')[0] : '' })}
                      dateFormat="dd/MM/yyyy"
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                      placeholderText="DD/MM/YYYY"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-card flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Enregistrer le paiement
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="w-full py-2 sm:py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all font-medium shadow-card flex items-center justify-center gap-2 text-sm"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                </form>
              </div>
            </div>
            )}

            <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enseignant</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reçu</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {payment.teachers?.users?.last_name || 'Enseignant'} {payment.teachers?.users?.first_name || 'Inconnu'} {payment.teachers?.users?.role === 'director' ? '(Directeur)' : ''}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {formatMonth(payment.payment_month)}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {payment.amount ? parseFloat(payment.amount).toLocaleString('fr-FR') : '0'} XOF
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {payment.receipt_number}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          <button
                            onClick={() => handlePrintReceipt(payment)}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium flex items-center gap-1 transition-colors text-xs sm:text-sm"
                        >
                          <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
                          Imprimer
                        </button>
                        {user?.role === 'founder' && (
                          <button
                            onClick={() => handleCancelPayment(payment.id)}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium flex items-center gap-1 transition-colors text-xs sm:text-sm"
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* Outstanding Tab */}
        {activeTab === 'outstanding' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Impayés de Salaires</h2>
              </div>
              <div className="flex w-full sm:w-auto">
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Filtrer par mois"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enseignant</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salaire mensuel</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total versé</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reste à payer</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {outstanding.map((item) => (
                      <tr key={item.teacherId}>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {item.teacherName}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {item.monthlyAmount?.toLocaleString('fr-FR') || '0'} XOF
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {item.totalPaid?.toLocaleString('fr-FR') || '0'} XOF
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-red-600">
                          {item.totalOutstanding?.toLocaleString('fr-FR') || '0'} XOF
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
