import { Router } from 'express';
import { AuthRequest, authenticateToken, requireFounder, requireFounderOrDirector, requireFounderOrDirectorOrTeacher } from '../middleware/auth';
import { supabase } from '../services/supabase';
import crypto from 'crypto';

const router = Router();

// Générer un identifiant unique auto-généré
const generateUniqueIdentifier = async (): Promise<string> => {
  const timestamp = Date.now().toString().slice(-10);
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `ID${timestamp}${random}`;
};

// Générer un matricule unique avec vérification d'unicité
const generateMatricule = async (schoolYear: string): Promise<string> => {
  console.log('=== GENERATE MATRICULE ===');
  console.log('School year:', schoolYear);
  
  const year = schoolYear.substring(2, 4); // 2024-2025 -> 24
  const prefix = `ECO${year}`;
  console.log('Prefix:', prefix);
  
  const maxRetries = 10;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Utiliser timestamp complet + random pour garantir l'unicité
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const matricule = `${prefix}${timestamp}${random}`;
    
    console.log(`Attempt ${attempt + 1}: Generated matricule:`, matricule);
    
    // Vérifier si le matricule existe déjà
    const { data: existing } = await supabase
      .from('students')
      .select('matricule')
      .eq('matricule', matricule)
      .maybeSingle();
    
    if (!existing) {
      console.log('Matricule is unique:', matricule);
      return matricule;
    }
    
    console.log(`Matricule ${matricule} already exists, retrying...`);
    // Attendre un peu avant de réessayer
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  // En dernier recours, utiliser un UUID tronqué
  const uuid = crypto.randomUUID().slice(0, 12).toUpperCase();
  const matricule = `${prefix}${uuid}`;
  console.log('Using UUID-based matricule as fallback:', matricule);
  return matricule;
};

// Créer un nouvel élève (accessible au fondateur, directeur et enseignant)
router.post('/', authenticateToken, requireFounderOrDirectorOrTeacher, async (req: AuthRequest, res) => {
  try {
    console.log('=== CREATE STUDENT CALLED ===');
    console.log('User from request:', req.user);
    console.log('Request body:', req.body);
    
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      parentName,
      parentPhone,
      parentAddress,
      classId,
      schoolYear,
      photoUrl,
      matricule: manualMatricule,
    } = req.body;

    console.log('Extracted data:', { firstName, lastName, classId, schoolYear });

    // Générer l'identifiant unique auto-généré
    const uniqueIdentifier = await generateUniqueIdentifier();
    console.log('Generated unique identifier:', uniqueIdentifier);

    // Générer le matricule
    let matricule: string;
    if (manualMatricule) {
      matricule = manualMatricule;
    } else {
      matricule = await generateMatricule(schoolYear);
    }
    console.log('Final matricule:', matricule);

    // Gérer classId : peut être un UUID ou un nom de classe
    let finalClassId = classId;
    if (classId && !classId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { data: classData } = await supabase
        .from('classes')
        .select('id')
        .eq('name', classId.toUpperCase())
        .maybeSingle();
      
      if (classData) {
        finalClassId = classData.id;
      } else {
        const { data: newClass } = await supabase
          .from('classes')
          .insert({ name: classId.toUpperCase(), passing_grade: 10.00 })
          .select('id')
          .single();
        finalClassId = newClass.id;
      }
    }

    // Données minimales garanties - utiliser les noms de colonnes réels de la base
    const studentData: any = {
      unique_identifier: uniqueIdentifier, // Ajouter unique_identifier requis
      matricule,
      first_name: firstName,
      last_name: lastName,
      current_class_id: finalClassId, // Utiliser current_class_id au lieu de class_id
      school_year: schoolYear,
      status: 'active',
      created_by: req.user?.id, // Enregistrer qui a créé l'élève
    };

    // Ajouter les champs optionnels
    if (dateOfBirth) studentData.date_of_birth = dateOfBirth;
    if (gender) studentData.gender = gender;
    if (parentName) studentData.parent_name = parentName;
    if (parentPhone) studentData.parent_phone = parentPhone;
    if (parentAddress) studentData.parent_address = parentAddress;
    if (photoUrl) studentData.photo_url = photoUrl;

    console.log('Final student data:', studentData);

    const { data, error } = await supabase
      .from('students')
      .insert(studentData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log('Student created successfully:', data);
    res.status(201).json({ student: data });
  } catch (error: any) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'élève', details: error.message });
  }
});

// Lister tous les élèves
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { classId, schoolYear, status } = req.query;
    
    let query = supabase
      .from('students')
      .select('*');

    // Si l'utilisateur est un enseignant, montrer tous les élèves de ses classes assignées
    if (req.user?.role === 'teacher') {
      console.log('=== TEACHER STUDENTS FILTER ===');
      console.log('Teacher ID:', req.user.id);
      
      // Récupérer les classes assignées à cet enseignant
      const { data: teacherAssignments, error: assignError } = await supabase
        .from('teacher_class_assignments')
        .select('class_id')
        .eq('teacher_id', req.user.id);
      
      console.log('Teacher assignments:', teacherAssignments);
      console.log('Assignments error:', assignError);
      
      if (teacherAssignments && teacherAssignments.length > 0) {
        const assignedClassIds = teacherAssignments.map(a => a.class_id);
        console.log('Assigned class IDs:', assignedClassIds);
        query = query.in('current_class_id', assignedClassIds);
      } else {
        // Si aucune classe assignée, ne montrer aucun élève
        console.log('No classes assigned to teacher');
        query = query.eq('current_class_id', '00000000-0000-0000-0000-000000000000');
      }
    }

    if (classId) {
      query = query.eq('current_class_id', classId);
    }
    if (schoolYear) {
      query = query.eq('school_year', schoolYear);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Récupérer les noms des classes séparément
    const classIds = [...new Set(data?.map(s => s.current_class_id).filter(Boolean))];
    let classMap: any = {};
    if (classIds.length > 0) {
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIds);
      classMap = (classes || []).reduce((acc: any, cls: any) => {
        acc[cls.id] = cls.name;
        return acc;
      }, {});
    }

    // Récupérer les noms des créateurs (enseignants)
    const creatorIds = [...new Set(data?.map(s => s.created_by).filter(Boolean))];
    let creatorMap: any = {};
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', creatorIds);
      creatorMap = (creators || []).reduce((acc: any, user: any) => {
        acc[user.id] = `${user.first_name} ${user.last_name}`;
        return acc;
      }, {});
    }

    const studentsWithClassNames = (data || []).map((student: any) => ({
      ...student,
      classes: classMap[student.current_class_id] ? { name: classMap[student.current_class_id] } : null,
      creator_name: creatorMap[student.created_by] || null
    }));

    res.json({ students: studentsWithClassNames });
  } catch (error: any) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des élèves' });
  }
});

// Récupérer un élève par ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        classes (
          id,
          name
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    res.json({ student: data });
  } catch (error: any) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'élève' });
  }
});

// Mettre à jour un élève
router.put('/:id', authenticateToken, requireFounderOrDirector, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      parentName,
      parentPhone,
      parentAddress,
      classId,
      photoUrl,
      status,
      matricule: newMatricule, // Modification du matricule (déconseillé mais possible)
    } = req.body;

    // Si modification du matricule, vérifier qu'il n'existe pas déjà
    if (newMatricule) {
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('matricule', newMatricule)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ error: 'Matricule déjà existant' });
      }
    }

    const updateData: any = {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender,
      parent_name: parentName,
      parent_phone: parentPhone,
      parent_address: parentAddress,
      current_class_id: classId, // Utiliser current_class_id
      photo_url: photoUrl,
      status,
      updated_at: new Date().toISOString(),
    };

    // Ajouter le matricule seulement s'il est fourni
    if (newMatricule) {
      updateData.matricule = newMatricule;
    }

    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    res.json({ student: data });
  } catch (error: any) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'élève' });
  }
});

// Supprimer un élève
router.delete('/:id', authenticateToken, requireFounder, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'élève avant suppression pour le log
    const { data: student } = await supabase
      .from('students')
      .select('matricule')
      .eq('id', id)
      .maybeSingle();

    if (!student) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log l'activité
    await supabase.from('activity_log').insert({
      user_id: req.user!.id,
      action: 'DELETE_STUDENT',
      entity_type: 'student',
      entity_id: id,
      details: { matricule: student.matricule },
    });

    res.json({ message: 'Élève supprimé avec succès' });
  } catch (error: any) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'élève' });
  }
});

// Rechercher des élèves
router.get('/search/:query', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { query } = req.params;

    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        classes (
          id,
          name
        )
      `)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,matricule.ilike.%${query}%`)
      .order('last_name', { ascending: true });

    if (error) throw error;

    res.json({ students: data });
  } catch (error: any) {
    console.error('Search students error:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche des élèves' });
  }
});

// Récupérer l'historique scolaire d'un élève
router.get('/:id/academic-history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('student_academic_history')
      .select(`
        *,
        classes (
          id,
          name
        )
      `)
      .eq('student_id', id)
      .order('school_year', { ascending: false });

    if (error) throw error;

    res.json({ history: data || [] });
  } catch (error: any) {
    console.error('Get academic history error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique scolaire' });
  }
});

export { router as studentRoutes };
