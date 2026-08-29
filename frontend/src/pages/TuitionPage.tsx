import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStorage } from '../services/authService';
import { tuitionService } from '../services/tuitionService';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import { schoolYearService } from '../services/schoolYearService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import jsPDF from 'jspdf';
import { Plus, Printer, X, ArrowLeft, CheckCircle, CreditCard, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';
import { SCHOOL_CONFIG } from '../config/schoolConfig';
import logo from '../assets/logo_ecole_primaire_le_mont_sinai_app.png';
import { sortClasses } from '../utils/classUtils';

export default function TuitionPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'rates' | 'payments' | 'outstanding' | 'trimesters'>('rates');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatAmount = (amount: number | string | undefined | null): string => {
    if (amount === undefined || amount === null || amount === '') {
      return '0 FCFA';
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return '0 FCFA';
    }
    const rounded = Math.round(numAmount);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
  };

  const [rates, setRates] = useState<any[]>([]);
  const [showRateForm, setShowRateForm] = useState(false);
  const [rateForm, setRateForm] = useState({
    classId: '',
    schoolYear: '',
    amount: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const [payments, setPayments] = useState<any[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    schoolYear: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const [outstanding, setOutstanding] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState('');
  const [filterTrimester, setFilterTrimester] = useState('');
  const [outstandingSearchTerm, setOutstandingSearchTerm] = useState('');

  const [trimesters, setTrimesters] = useState<any[]>([]);
  const [showTrimestersForm, setShowTrimestersForm] = useState(false);
  const [trimestersForm, setTrimestersForm] = useState({
    schoolYear: '',
    trimesters: [
      { trimester_number: 1, start_date: '', end_date: '' },
      { trimester_number: 2, start_date: '', end_date: '' },
      { trimester_number: 3, start_date: '', end_date: '' },
    ],
  });

  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const filteredStudents = students.filter((student) => {
    const searchLower = studentSearchTerm.toLowerCase();
    return (
      student.last_name?.toLowerCase().includes(searchLower) ||
      student.first_name?.toLowerCase().includes(searchLower) ||
      student.matricule?.toLowerCase().includes(searchLower)
    );
  });

  const handleStudentSelect = (student: any) => {
    setPaymentForm({ ...paymentForm, studentId: student.id });
    setStudentSearchTerm(`${student.last_name} ${student.first_name} - ${student.matricule}`);
    setShowStudentDropdown(false);
  };

  const handleStudentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudentSearchTerm(e.target.value);
    setShowStudentDropdown(true);
    if (paymentForm.studentId) {
      setPaymentForm({ ...paymentForm, studentId: '' });
    }
  };

  const handleSaveTrimesters = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenStorage.getToken();
    if (!token) return;

    try {
      await tuitionService.saveTrimesters(trimestersForm, token);
      const trimestersData = await tuitionService.getTrimesters(token, trimestersForm.schoolYear);
      setTrimesters(trimestersData.trimesters || []);
      setShowTrimestersForm(false);
      alert('Trimestres enregistrés avec succès !');
    } catch (error: any) {
      console.error('Save trimesters error:', error);
      alert(error.message);
    }
  };

  const handleTrimesterChange = (index: number, field: string, value: string) => {
    const newTrimesters = [...trimestersForm.trimesters];
    newTrimesters[index] = { ...newTrimesters[index], [field]: value };
    setTrimestersForm({ ...trimestersForm, trimesters: newTrimesters });
  };

  useEffect(() => {
    const token = tokenStorage.getToken();
    const currentUser = tokenStorage.getUser();

    if (!token || !currentUser) {
      navigate('/login');
      return;
    }

    setUser(currentUser);

    schoolYearService.getCurrentSchoolYear(token)
      .then(currentYear => {
        setRateForm(prev => ({ ...prev, schoolYear: currentYear }));
        setPaymentForm(prev => ({ ...prev, schoolYear: currentYear }));
        setTrimestersForm(prev => ({ ...prev, schoolYear: currentYear }));
        loadData(token, currentUser, currentYear);
      })
      .catch(error => {
        console.error('Error loading school year:', error);
        const fallbackYear = new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString();
        setRateForm(prev => ({ ...prev, schoolYear: fallbackYear }));
        setPaymentForm(prev => ({ ...prev, schoolYear: fallbackYear }));
        setTrimestersForm(prev => ({ ...prev, schoolYear: fallbackYear }));
        loadData(token, currentUser, fallbackYear);
      });
  }, [navigate]);

  const loadData = async (token: string, currentUser: any, schoolYear: string) => {
    try {
      if (currentUser?.role === 'founder' || currentUser?.role === 'director') {
        const [ratesData, studentsData, classesData, outstandingData, paymentsData, trimestersData] = await Promise.all([
          tuitionService.getTuitionRates(token, schoolYear),
          studentService.getStudents(token),
          classService.getClasses(token),
          tuitionService.getOutstandingPayments(token, { schoolYear }),
          tuitionService.getTuitionPayments(token),
          tuitionService.getTrimesters(token, schoolYear),
        ]);

        setRates(ratesData.rates || []);
        setStudents(studentsData.students || []);
        setClasses(sortClasses(classesData.classes || []));
        setOutstanding(outstandingData.outstanding || []);
        setPayments(paymentsData.payments || []);
        setTrimesters(trimestersData.trimesters || []);
      } else {
        const [paymentsData, studentsData] = await Promise.all([
          tuitionService.getTuitionPayments(token, { schoolYear }),
          studentService.getStudents(token),
        ]);

        setPayments(paymentsData.payments || []);
        setStudents(studentsData.students || []);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenStorage.getToken();
    if (!token) return;

    try {
      await tuitionService.createTuitionRate(
        {
          classId: rateForm.classId,
          schoolYear: rateForm.schoolYear,
          amount: parseFloat(rateForm.amount),
          effectiveDate: rateForm.effectiveDate,
        },
        token
      );

      const ratesData = await tuitionService.getTuitionRates(token, rateForm.schoolYear);
      setRates(ratesData.rates || []);
      localStorage.setItem('directorStatsUpdate', Date.now().toString());

      setShowRateForm(false);
      setRateForm({
        ...rateForm,
        classId: '',
        amount: '',
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

    if (!paymentForm.studentId) {
      alert('Veuillez sélectionner un élève');
      return;
    }

    try {
      const result = await tuitionService.createTuitionPayment(
        {
          studentId: paymentForm.studentId,
          schoolYear: paymentForm.schoolYear,
          amount: parseFloat(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
        },
        token
      );

      // Fermer le formulaire immédiatement
      setShowPaymentForm(false);
      
      // Réinitialiser le formulaire
      setPaymentForm({
        studentId: '',
        schoolYear: paymentForm.schoolYear,
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
      });
      setStudentSearchTerm('');

      // Recharger les données
      const paymentsData = await tuitionService.getTuitionPayments(token, { schoolYear: paymentForm.schoolYear });
      setPayments(paymentsData.payments || []);

      const outstandingData = await tuitionService.getOutstandingPayments(token, { schoolYear: paymentForm.schoolYear });
      setOutstanding(outstandingData.outstanding || []);

      localStorage.setItem('teacherStatsUpdate', Date.now().toString());
      localStorage.setItem('directorStatsUpdate', Date.now().toString());

      // Afficher le message de succès après la fermeture
      alert(`Versement enregistré avec succès !\nNuméro de reçu: ${result.payment.receipt_number}`);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    const token = tokenStorage.getToken();
    if (!token) return;

    if (!confirm('Êtes-vous sûr de vouloir annuler ce versement ?')) {
      return;
    }

    try {
      await tuitionService.cancelTuitionPayment(paymentId, token);

      const paymentsData = await tuitionService.getTuitionPayments(token, { schoolYear: paymentForm.schoolYear });
      setPayments(paymentsData.payments || []);

      const outstandingData = await tuitionService.getOutstandingPayments(token, { schoolYear: paymentForm.schoolYear });
      setOutstanding(outstandingData.outstanding || []);

      localStorage.setItem('teacherStatsUpdate', Date.now().toString());
      localStorage.setItem('directorStatsUpdate', Date.now().toString());
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handlePrintReceipt = (payment: any) => {
    const receiptContainer = document.createElement('div');
    receiptContainer.id = 'print-receipt-container';
    receiptContainer.innerHTML = `
      <div style="max-width: 650px; margin: 0 auto; background: white; border: 3px solid #1e3a8a; border-radius: 12px; overflow: hidden; font-family: Arial, sans-serif; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Bandeau coloré -->
        <div style="background: #1e3a8a; padding: 25px 30px; text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 8px;">
            <div style="width: 60px; height: 60px; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #ffffff; overflow: hidden; padding: 0; margin: 0;">
              <img src="${logo}" alt="Logo" style="width: 100%; height: 100%; object-fit: cover; display: block; padding: 0; margin: 0;" />
            </div>
            <div>
              <h1 style="font-size: 24px; color: #ffffff; margin: 0; font-weight: 900; letter-spacing: 1px; line-height: 1.2;">${SCHOOL_CONFIG.name}</h1>
              <p style="font-size: 16px; color: #ffffff; margin: 8px 0 0 0; font-weight: 900; letter-spacing: 1px;">REÇU DE PAIEMENT</p>
            </div>
          </div>
        </div>

        <!-- Numéro de reçu -->
        <div style="text-align: center; margin: 25px 0;">
          <div style="display: inline-block; background: #fef3c7; padding: 10px 25px; border-radius: 20px; border: 3px dashed #f59e0b;">
            <span style="font-size: 12px; color: #451a03; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">N° Reçu</span>
            <div style="font-size: 20px; color: #451a03; font-weight: 900; margin-top: 3px; letter-spacing: 1px;">${payment.receipt_number}</div>
          </div>
        </div>

        <!-- Informations -->
        <div style="padding: 0 30px;">
          <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; margin-bottom: 18px;">
            <div style="font-weight: 900; color: #000000; font-size: 13px; padding: 10px 12px; background: #e5e7eb; border-radius: 6px; border-left: 4px solid #1e3a8a;">Élève:</div>
            <div style="color: #000000; font-size: 14px; padding: 10px 12px; background: #ffffff; border: 2px solid #000000; border-radius: 6px; font-weight: 900;">${payment.students?.last_name || ''} ${payment.students?.first_name || ''}</div>
          </div>
          <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; margin-bottom: 18px;">
            <div style="font-weight: 900; color: #000000; font-size: 13px; padding: 10px 12px; background: #e5e7eb; border-radius: 6px; border-left: 4px solid #1e3a8a;">Matricule:</div>
            <div style="color: #000000; font-size: 14px; padding: 10px 12px; background: #ffffff; border: 2px solid #000000; border-radius: 6px; font-weight: 900;">${payment.students?.matricule || 'N/A'}</div>
          </div>
          <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; margin-bottom: 18px;">
            <div style="font-weight: 900; color: #000000; font-size: 13px; padding: 10px 12px; background: #e5e7eb; border-radius: 6px; border-left: 4px solid #1e3a8a;">Classe:</div>
            <div style="color: #000000; font-size: 14px; padding: 10px 12px; background: #ffffff; border: 2px solid #000000; border-radius: 6px; font-weight: 900;">${payment.students?.classes?.name || 'N/A'}</div>
          </div>
          <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; margin-bottom: 18px;">
            <div style="font-weight: 900; color: #000000; font-size: 13px; padding: 10px 12px; background: #e5e7eb; border-radius: 6px; border-left: 4px solid #1e3a8a;">Date:</div>
            <div style="color: #000000; font-size: 14px; padding: 10px 12px; background: #ffffff; border: 2px solid #000000; border-radius: 6px; font-weight: 900;">${formatDate(payment.payment_date)}</div>
          </div>
          <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; margin-bottom: 18px;">
            <div style="font-weight: 900; color: #000000; font-size: 13px; padding: 10px 12px; background: #e5e7eb; border-radius: 6px; border-left: 4px solid #1e3a8a;">Trimestre:</div>
            <div style="color: #000000; font-size: 14px; padding: 10px 12px; background: #ffffff; border: 2px solid #000000; border-radius: 6px; font-weight: 900;">T${payment.trimester || 'N/A'}</div>
          </div>
          <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; margin-bottom: 18px;">
            <div style="font-weight: 900; color: #000000; font-size: 13px; padding: 10px 12px; background: #e5e7eb; border-radius: 6px; border-left: 4px solid #1e3a8a;">Année:</div>
            <div style="color: #000000; font-size: 14px; padding: 10px 12px; background: #ffffff; border: 2px solid #000000; border-radius: 6px; font-weight: 900;">${paymentForm.schoolYear}</div>
          </div>
        </div>

        <!-- Montant principal -->
        <div style="margin: 30px 30px; padding: 25px; background: #ecfdf5; border-radius: 12px; border: 3px solid #059669; text-align: center;">
          <div style="font-size: 14px; color: #064e3b; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Montant Payé</div>
          <div style="font-size: 38px; font-weight: 900; color: #022c22; line-height: 1; letter-spacing: 1px;">${parseFloat(payment.amount).toLocaleString('fr-FR')} XOF</div>
        </div>

        <!-- Pied de page -->
        <div style="background: #f9fafb; padding: 20px 30px; border-top: 3px solid #000000; text-align: center;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="text-align: left; font-size: 12px; color: #000000;">
              <div style="font-weight: 900; color: #000000; font-size: 13px;">Enregistré par:</div>
              <div style="font-weight: 900; color: #000000;">${payment.users?.first_name || ''} ${payment.users?.last_name || ''}</div>
            </div>
            <div style="text-align: center; font-size: 12px; color: #000000;">
              <div style="font-weight: 900; color: #000000; font-size: 13px;">Date d'émission:</div>
              <div style="font-weight: 900; color: #000000;">${formatDate(new Date().toISOString())}</div>
            </div>
          </div>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #000000; font-size: 11px; color: #000000; font-style: italic; font-weight: 900;">
            Ce document fait foi de paiement
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(receiptContainer);

    const printStyle = document.createElement('style');
    printStyle.textContent = `
      @media print {
        body > *:not(#print-receipt-container) {
          display: none !important;
        }
        #print-receipt-container {
          display: block !important;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
        }
        @page {
          size: A4;
          margin: 10mm;
        }
      }
    `;
    document.head.appendChild(printStyle);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.removeChild(receiptContainer);
        document.head.removeChild(printStyle);
      }, 1000);
    }, 100);
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
    doc.text('Paiements de Scolarité', 14, 24);

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
    doc.text('Élève', 30, y);
    doc.text('Classe', 75, y);
    doc.text('Montant', 100, y);
    doc.text('Date', 130, y);
    doc.text('Trimestre', 155, y);
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
        doc.text('Paiements de Scolarité', 14, 24);
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
        doc.text('Élève', 30, y);
        doc.text('Classe', 75, y);
        doc.text('Montant', 100, y);
        doc.text('Date', 130, y);
        doc.text('Trimestre', 155, y);
        y += 10;
        doc.setFont('helvetica', 'normal');
      }

      // Ligne alternée (zebra)
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, y - 4, 180, 7, 'F');
      }

      const receipt = payment.receipt_number || '';
      const studentName = `${payment.students?.last_name || ''} ${payment.students?.first_name || ''}`.substring(0, 20);
      const className = (payment.students?.classes?.name || 'N/A').substring(0, 12);
      const trimester = payment.trimester ? `T${payment.trimester}` : 'N/A';
      const recordedBy = payment.users ? `${payment.users.last_name} ${payment.users.first_name}` : (payment.created_by || 'N/A');

      doc.setFontSize(7);
      doc.text(receipt.substring(0, 10), 14, y);
      doc.setFontSize(9);
      doc.text(studentName, 30, y);
      doc.text(className, 75, y);
      doc.setFontSize(10);
      doc.text(formatAmount(parseFloat(payment.amount)), 100, y);
      doc.setFontSize(9);
      doc.text(formatDate(payment.payment_date), 130, y);
      doc.text(trimester, 155, y);
      y += 10;

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
        doc.text('Paiements de Scolarité', 14, 24);
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

    doc.save('paiements_scolarite.pdf');
  };

  const filteredOutstanding = outstanding.filter((o) => {
    if (filterClass && o.classId !== filterClass) return false;
    if (filterTrimester) {
      const trimester = parseInt(filterTrimester);
      const paymentDate = o.lastPaymentDate ? new Date(o.lastPaymentDate) : new Date();
      const paymentTrimester = paymentDate.getMonth() >= 8 || paymentDate.getMonth() <= 10 ? 1 :
                              paymentDate.getMonth() >= 11 || paymentDate.getMonth() <= 1 ? 2 : 3;
      if (paymentTrimester !== trimester) return false;
    }
    if (outstandingSearchTerm) {
      const searchLower = outstandingSearchTerm.toLowerCase();
      return (
        o.studentName?.toLowerCase().includes(searchLower) ||
        o.matricule?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-600 text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl opacity-20"></div>
      
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-xl flex-shrink-0 relative overflow-visible">
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
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Gestion des Scolarités</h1>
                <p className="text-xs sm:text-sm text-blue-100 drop-shadow">Tarifs, versements et impayés</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
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
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          {(user?.role === 'founder' || user?.role === 'director') && (
            <div className="bg-white rounded-xl shadow-card border border-gray-200 mb-4 sm:mb-6">
              <div className="flex overflow-x-auto border-b border-gray-200" style={{ WebkitOverflowScrolling: 'touch' }}>
                <button
                  onClick={() => setActiveTab('rates')}
                  className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap cursor-pointer touch-action-manipulation ${
                    activeTab === 'rates'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Tarifs par Classe
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap cursor-pointer touch-action-manipulation ${
                    activeTab === 'payments'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Versements
                </button>
                <button
                  onClick={() => setActiveTab('outstanding')}
                  className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap cursor-pointer touch-action-manipulation ${
                    activeTab === 'outstanding'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  Impayés
                </button>
                <button
                  onClick={() => setActiveTab('trimesters')}
                  className={`px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap cursor-pointer touch-action-manipulation ${
                    activeTab === 'trimesters'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Trimestres
                </button>
              </div>
            </div>
          )}

          {activeTab === 'rates' && (user?.role === 'founder' || user?.role === 'director') && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Tarifs par Classe</h2>
                <button
                  onClick={() => setShowRateForm(!showRateForm)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-card hover:shadow-card-hover flex items-center justify-center gap-2 text-sm"
                >
                  {showRateForm ? 'Fermer' : <><Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Définir un tarif</>}
                </button>
              </div>

              {showRateForm && (
                <div className="modal-overlay">
                  <div className="modal-content border-2 border-blue-200 p-4 sm:p-6 max-w-2xl w-full mx-2 sm:mx-4">
                    <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-200 pb-2 sm:pb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Définir un tarif de scolarité
                      </h3>
                      <button
                        onClick={() => setShowRateForm(false)}
                        className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 rounded-full p-2"
                      >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                    <form onSubmit={handleCreateRate} className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                        <select
                          value={rateForm.classId}
                          onChange={(e) => setRateForm({ ...rateForm, classId: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        >
                          <option value="">Sélectionner une classe</option>
                          {classes.length === 0 && (
                            <option disabled>Chargement des classes...</option>
                          )}
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                        {classes.length === 0 && (
                          <p className="text-red-500 text-sm mt-1">Aucune classe disponible</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Année scolaire</label>
                        <input
                          type="text"
                          value={rateForm.schoolYear}
                          onChange={(e) => setRateForm({ ...rateForm, schoolYear: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant (XOF)</label>
                        <input
                          type="number"
                          value={rateForm.amount}
                          onChange={(e) => setRateForm({ ...rateForm, amount: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date d'effet</label>
                        <DatePicker
                          selected={rateForm.effectiveDate ? new Date(rateForm.effectiveDate) : null}
                          onChange={(date: Date | null) => setRateForm({ ...rateForm, effectiveDate: date ? date.toISOString().split('T')[0] : '' })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          dateFormat="dd/MM/yyyy"
                          required
                        />
                      </div>
                      <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={() => setShowRateForm(false)}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all text-sm"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Année scolaire</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Date d'effet</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rates.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 text-xs sm:text-sm">
                            Aucun tarif défini
                          </td>
                        </tr>
                      ) : (
                        rates.map((rate) => (
                          <tr key={rate.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {rate.classes?.name || 'N/A'}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {rate.school_year || 'N/A'}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900">
                              {formatAmount(rate.amount)}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {formatDate(rate.effective_date)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Versements</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {(user?.role === 'founder' || user?.role === 'director') && (
                    <button
                      onClick={() => setShowPaymentForm(!showPaymentForm)}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-card hover:shadow-card-hover flex items-center justify-center gap-2 text-sm"
                    >
                      {showPaymentForm ? 'Fermer' : <><Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Nouveau versement</>}
                    </button>
                  )}
                  <button
                    onClick={exportPaymentsToPDF}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all font-medium shadow-card hover:shadow-card-hover flex items-center justify-center gap-2 text-sm"
                  >
                    <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                    Imprimer
                  </button>
                </div>
              </div>

              {showPaymentForm && (user?.role === 'founder' || user?.role === 'director') && (
                <div className="modal-overlay">
                  <div className="modal-content border-2 border-blue-200 p-4 sm:p-6 max-w-2xl w-full mx-2 sm:mx-4">
                    <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-200 pb-2 sm:pb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Nouveau versement
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Élève</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={studentSearchTerm}
                            onChange={handleStudentInputChange}
                            placeholder="Rechercher un élève..."
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            required
                          />
                          {showStudentDropdown && filteredStudents.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                              {filteredStudents.map((student) => (
                                <div
                                  key={student.id}
                                  onClick={() => handleStudentSelect(student)}
                                  className="px-3 sm:px-4 py-2 hover:bg-gray-100 cursor-pointer text-xs sm:text-sm text-gray-900"
                                >
                                  {student.last_name} {student.first_name} - {student.matricule}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Année scolaire</label>
                        <input
                          type="text"
                          value={paymentForm.schoolYear}
                          onChange={(e) => setPaymentForm({ ...paymentForm, schoolYear: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant (XOF)</label>
                        <input
                          type="number"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de paiement</label>
                        <DatePicker
                          selected={paymentForm.paymentDate ? new Date(paymentForm.paymentDate) : null}
                          onChange={(date: Date | null) => setPaymentForm({ ...paymentForm, paymentDate: date ? date.toISOString().split('T')[0] : '' })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          dateFormat="dd/MM/yyyy"
                          required
                        />
                      </div>
                      <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={() => setShowPaymentForm(false)}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all text-sm"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Reçu</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Élève</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 text-xs sm:text-sm">
                            Aucun versement enregistré
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {payment.receipt_number || 'N/A'}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {payment.students?.last_name} {payment.students?.first_name}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {payment.students?.classes?.name || 'N/A'}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900">
                            {formatAmount(payment.amount)}
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {formatDate(payment.payment_date)}
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              <button
                                onClick={() => handlePrintReceipt(payment)}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium flex items-center gap-1 transition-colors text-xs sm:text-sm"
                              >
                                <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
                                Imprimer
                              </button>
                              {(user?.role === 'founder' || user?.role === 'director') && (
                                <button
                                  onClick={() => handleCancelPayment(payment.id)}
                                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium flex items-center gap-1 transition-colors text-xs sm:text-sm"
                                >
                                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Annuler
                                </button>
                              )}
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
          )}

          {activeTab === 'outstanding' && (user?.role === 'founder' || user?.role === 'director') && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Impayés</h2>
              </div>

              <div className="bg-white rounded-xl shadow-card p-3 sm:p-4 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par classe</label>
                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Toutes les classes</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par trimestre</label>
                    <select
                      value={filterTrimester}
                      onChange={(e) => setFilterTrimester(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Tous les trimestres</option>
                      <option value="1">1er trimestre</option>
                      <option value="2">2ème trimestre</option>
                      <option value="3">3ème trimestre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
                    <input
                      type="text"
                      value={outstandingSearchTerm}
                      onChange={(e) => setOutstandingSearchTerm(e.target.value)}
                      placeholder="Nom ou matricule..."
                      className="w-full border border-gray-300 rounded-xl px-3 sm:px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Élève</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricule</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant attendu</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Versé</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Reste</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOutstanding.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 text-xs sm:text-sm">
                            Aucun impayé trouvé
                          </td>
                      </tr>
                    ) : (
                      filteredOutstanding.map((outstanding) => (
                        <tr key={outstanding.studentId} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {outstanding.studentName}
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {outstanding.matricule}
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {outstanding.className}
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900">
                            {formatAmount(outstanding.totalDue)}
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {formatAmount(outstanding.totalPaid)}
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-red-600">
                            {formatAmount(outstanding.remaining)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trimesters' && (user?.role === 'founder' || user?.role === 'director') && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Trimestres</h2>
                <button
                  onClick={() => setShowTrimestersForm(!showTrimestersForm)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-card hover:shadow-card-hover flex items-center justify-center gap-2 text-sm"
                >
                  {showTrimestersForm ? 'Fermer' : <><Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Définir les trimestres</>}
                </button>
              </div>

              {showTrimestersForm && (
                <div className="modal-overlay">
                  <div className="modal-content border-2 border-blue-200 p-4 sm:p-6 max-w-2xl w-full mx-2 sm:mx-4">
                    <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-200 pb-2 sm:pb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Définir les trimestres scolaires
                      </h3>
                      <button
                        onClick={() => setShowTrimestersForm(false)}
                        className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-blue-100 rounded-full p-2"
                      >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                    <form onSubmit={handleSaveTrimesters} className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Année scolaire</label>
                        <input
                          type="text"
                          value={trimestersForm.schoolYear}
                          onChange={(e) => setTrimestersForm({ ...trimestersForm, schoolYear: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          required
                        />
                      </div>
                      {trimestersForm.trimesters.map((trimester, index) => (
                        <div key={trimester.trimester_number} className="border border-gray-200 rounded-xl p-3 sm:p-4">
                          <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Trimestre {trimester.trimester_number}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                              <input
                                type="date"
                                value={trimester.start_date}
                                onChange={(e) => handleTrimesterChange(index, 'start_date', e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                              <input
                                type="date"
                                value={trimester.end_date}
                                onChange={(e) => handleTrimesterChange(index, 'end_date', e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={() => setShowTrimestersForm(false)}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all text-sm"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Trimestre</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Date de début</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Date de fin</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trimesters.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500 text-xs sm:text-sm">
                            Aucun trimestre défini
                          </td>
                        </tr>
                      ) : (
                        trimesters.map((trimester) => (
                          <tr key={trimester.trimester_number} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              Trimestre {trimester.trimester_number}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {formatDate(trimester.start_date)}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {formatDate(trimester.end_date)}
                            </td>
                          </tr>
                        ))
                      )}
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
