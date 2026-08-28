const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkDirectorPermissions() {
  console.log('=== Verification permissions directeur ===\n');
  
  try {
    const { data, error } = await supabase
      .from('director_permissions')
      .select('*');
    
    if (error) {
      console.log('Erreur:', error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('Aucune permission directeur trouvee');
      console.log('Creation des permissions par defaut...');
      
      // Get director user
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('username', 'Directeur')
        .maybeSingle();
      
      if (users) {
        const { error: insertError } = await supabase
          .from('director_permissions')
          .insert({
            user_id: users.id,
            can_view_all_students: true,
            can_manage_students: true,
            can_set_tuition: true,
            can_set_salaries: true,
            can_validate_teachers: true,
            can_disable_accounts: true,
            can_reset_passwords: true,
            can_manage_expenses: true,
            can_approve_promotion: true,
            can_set_passing_grade: true,
            can_manage_trimesters: true,
            can_view_statistics: true,
            can_export_data: true
          });
        
        if (insertError) {
          console.log('Erreur creation permissions:', insertError.message);
        } else {
          console.log('✅ Permissions creees');
        }
      }
    } else {
      console.log(`${data.length} permission(s) trouvee(s)`);
    }
    
  } catch (error) {
    console.log('Erreur:', error.message);
  }
}

checkDirectorPermissions().then(() => process.exit(0));